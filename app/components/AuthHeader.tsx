import { auth } from "@/auth";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { Button } from "@/components/ui/button";

export async function AuthHeader() {
  const session = await auth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-bold text-xl text-indigo-600">
            MyApp
          </Link>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 font-medium"
                >
                  Dashboard
                </Link>
                <span className="text-sm text-gray-600">{session.user?.email}</span>
                <SignOutButton />
              </>
            ) : (
              <Link href="/signin">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
