import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import PreferencesTab from "./PreferencesTab";
import NotificationsTab from "./NotificationsTab";
import DataTab from "./DataTab";
import { User, ShieldCheck, SlidersHorizontal, Bell, Database } from "lucide-react";

export const metadata = {
  title: "Settings — Personal Finance",
  description: "Manage your account, security, preferences, and data",
};

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

  const [txnCount, budgetCount] = await Promise.all([
    prisma.transaction.count({ where: { userId: session.user.id, isDeleted: false } }),
    prisma.budget.count({ where: { userId: session.user.id, isActive: true } }),
  ]);

  const tabs = [
    { value: "profile", label: "Profile", Icon: User },
    { value: "security", label: "Security", Icon: ShieldCheck },
    { value: "preferences", label: "Preferences", Icon: SlidersHorizontal },
    { value: "notifications", label: "Notifications", Icon: Bell },
    { value: "data", label: "Data & Privacy", Icon: Database },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings, security, and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="">
        <TabsList className=" p-5  flex-col gap-1 bg-muted/40 items-start h-fit rounded-xl border">
          {tabs.map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-2 px-4 py-2 h-12 shrink rounded-lg text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={user} profile={profile} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab
            hasPassword={!!user.password}
            providers={user.accounts.map((a) => a.provider)}
            userEmail={user.email}
          />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesTab profile={profile} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab profile={profile} />
        </TabsContent>
        <TabsContent value="data">
          <DataTab txnCount={txnCount} budgetCount={budgetCount} userEmail={user.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
