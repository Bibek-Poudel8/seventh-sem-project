"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faArrowRightArrowLeft,
  faWallet,
  faChartBar,
  faWandMagicSparkles,
  faCreditCard,
  faBell,
  faDownload,
  faGear,
  faGem,
  faUpDown,
  faRightFromBracket,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

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

const NAV_SECTIONS: {
  label: string;
  items: {
    title: string;
    href: string;
    icon: IconDefinition;
    exact?: boolean;
  }[];
}[] = [
  {
    label: "PRIMARY",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: faGauge, exact: true },
      {
        title: "Transactions",
        href: "/dashboard/transactions",
        icon: faArrowRightArrowLeft,
      },
      { title: "Budgets", href: "/dashboard/budgets", icon: faWallet },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { title: "Analytics", href: "/dashboard/analytics", icon: faChartBar },
      {
        title: "AI Insights",
        href: "/dashboard/ai-insights",
        icon: faWandMagicSparkles,
      },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      {
        title: "Payment Methods",
        href: "/dashboard/payment-methods",
        icon: faCreditCard,
      },
      {
        title: "Notifications",
        href: "/dashboard/notifications",
        icon: faBell,
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { title: "Data Export", href: "/dashboard/export", icon: faDownload },
      { title: "Settings", href: "/dashboard/settings", icon: faGear },
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

  const isNavItemActive = (href: string, exact?: boolean) => {
    const normalizedPathname = pathname.replace(/\/$/, "") || "/";
    const normalizedHref = href.replace(/\/$/, "") || "/";

    if (exact) {
      return normalizedPathname === normalizedHref;
    }

    return (
      normalizedPathname === normalizedHref ||
      normalizedPathname.startsWith(`${normalizedHref}/`)
    );
  };

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
                <FontAwesomeIcon icon={faGem} className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-sm tracking-tight">
                  FinanceAI
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Personal Finance
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content / Nav sections ── */}
      <SidebarContent className="">
        {NAV_SECTIONS.map((section, i) => (
          <SidebarGroup key={section.label} className="">
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {section.items.map((item) => {
                  const isActive = isNavItemActive(item.href, item.exact);
                  return (
                    <SidebarMenuItem key={item.href} className="">
                      <SidebarMenuButton
                        asChild
                        className="bg-transparent data-[state=open]:bg-accent! hover:bg-accent"
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href} className="h-12 px-6">
                          <FontAwesomeIcon icon={item.icon} />
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
                    <span className="text-xs font-semibold truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                  <FontAwesomeIcon
                    icon={faUpDown}
                    className="ml-auto size-3.5 text-muted-foreground"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56"
              >
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
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings"
                    className="gap-2 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faGear} className="size-3.5" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <FontAwesomeIcon
                    icon={faRightFromBracket}
                    className="size-3.5"
                  />
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
