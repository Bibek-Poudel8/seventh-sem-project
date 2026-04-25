"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  Sparkles,
  CreditCard,
  Bell,
  Download,
  Settings,
  Gem,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ─── Nav config ────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "PRIMARY",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { title: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
      { title: "Budgets", href: "/dashboard/budgets", icon: Wallet },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { title: "AI Insights", href: "/dashboard/ai-insights", icon: Sparkles },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { title: "Payment Methods", href: "/dashboard/payment-methods", icon: CreditCard },
      { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { title: "Data Export", href: "/dashboard/export", icon: Download },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

interface AppSidebarProps {
  user: { name: string; email: string; image?: string };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar collapsible="icon">
      {/* ── Header / Logo ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent active:bg-transparent"
              tooltip="FinanceAI"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Gem className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-sm tracking-tight">FinanceAI</span>
                <span className="text-[10px] text-muted-foreground">Personal Finance</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content / Nav sections ── */}
      <SidebarContent>
        {NAV_SECTIONS.map((section, i) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {i < NAV_SECTIONS.length - 1 && <SidebarSeparator />}
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer / User profile ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={user.name}
                >
                  <Avatar className="size-7 rounded-lg shrink-0">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="rounded-lg text-[10px] font-semibold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none text-left">
                    <span className="text-xs font-semibold truncate">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="gap-2 cursor-pointer">
                    <Settings className="size-3.5" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
