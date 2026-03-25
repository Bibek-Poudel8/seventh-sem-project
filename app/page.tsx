import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black rounded-lg shadow-lg m-8">
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white">
            Welcome to Next Auth
          </h1>

          {session ? (
            <div className="space-y-6 w-full">
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Hello,{" "}
                <span className="font-semibold">{session.user?.name}</span>! 👋
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                You're successfully signed in.
              </p>
              <Link href="/dashboard" className="inline-block">
                <Button size="lg" className="text-lg px-8 py-6">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6 w-full">
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Sign in to get started
              </p>
              <Link href="/signin" className="inline-block">
                <Button size="lg" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
