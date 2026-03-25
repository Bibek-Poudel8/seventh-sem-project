import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "../components/SignOutButton";
import Image from "next/image";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/signin");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex justify-end p-6">
        <SignOutButton />
      </div>

      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            User Dashboard
          </h1>

          <div className="flex flex-col items-center gap-6">
            {/* User Avatar */}
            {user.image && (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-500">
                <Image
                  src={user.image}
                  alt="User Avatar"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* User Details Card */}
            <div className="w-full bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Name
                </label>
                <p className="text-lg text-gray-800 mt-1">
                  {user.name || "Not provided"}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="text-sm font-semibold text-gray-600">
                  Email
                </label>
                <p className="text-lg text-gray-800 mt-1">
                  {user.email || "Not provided"}
                </p>
              </div>

              {session.user && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="text-sm font-semibold text-gray-600">
                    Email Verified
                  </label>
                  <p className="text-lg text-green-600 mt-1">✓ Verified</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="w-full grid grid-cols-2 gap-4 mt-6">
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Provider</p>
                <p className="text-lg font-semibold text-indigo-600">Google</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="w-full max-w-2xl mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Session Info
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Session expires at:{" "}
              <span className="font-mono text-gray-800">{session.expires}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
