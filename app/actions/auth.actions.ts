"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

// ─── Schemas ────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
} | undefined;

// ─── Register ────────────────────────────────────────────────────────────────

export async function register(
  state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = RegisterSchema.safeParse(rawData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password } = validated.data;

  // Check for existing user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["An account with this email already exists"] } };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  redirect("/signin?registered=true");
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(
  state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = LoginSchema.safeParse(rawData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "Invalid email or password" };
        default:
          return { message: "Something went wrong. Please try again." };
      }
    }
    throw error; // re-throw redirect
  }
}
