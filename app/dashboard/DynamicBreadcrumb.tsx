"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  budgets: "Budgets",
  analytics: "Analytics",
  settings: "Settings",
  notifications: "Notifications",
  export: "Data Export",
  "payment-methods": "Payment Methods",
  "ai-insights": "AI Insights",
};

export default function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // segments: ["dashboard", "transactions", ...]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const label = LABELS[seg] ?? seg;
          const isLast = i === segments.length - 1;

          return (
            <span key={href} className="flex items-center gap-1.5">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-sm font-medium">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
