import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import PreferencesTab from "./PreferencesTab";
import NotificationsTab from "./NotificationsTab";
import DataTab from "./DataTab";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: { select: { provider: true } } },
    }),
    prisma.userProfile.findUnique({ where: { userId: session.user.id } }),
  ]);

  if (!user) redirect("/signin");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-0.5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="profile"><ProfileTab user={user} profile={profile} /></TabsContent>
          <TabsContent value="security"><SecurityTab hasPassword={!!user.password} providers={user.accounts.map((a) => a.provider)} /></TabsContent>
          <TabsContent value="preferences"><PreferencesTab profile={profile} /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab profile={profile} /></TabsContent>
          <TabsContent value="data"><DataTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
