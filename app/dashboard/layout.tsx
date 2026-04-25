import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DynamicBreadcrumb from "./DynamicBreadcrumb";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = {
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    image: session.user.image ?? undefined,
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar user={user} />

        <SidebarInset>
          {/* Sticky top bar */}
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
            </div>
          </header>

          {/* Page content */}
          <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
