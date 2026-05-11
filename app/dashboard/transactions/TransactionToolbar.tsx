"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import TransactionForm from "./TransactionForm";
import { TransactionCategory } from "./transaction-types";

type SearchParams = Record<string, string | undefined>;

export default function TransactionToolbar({
  categories,
  searchParams,
}: {
  categories: TransactionCategory[];
  searchParams: SearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v != null) as [
        string,
        string,
      ][],
    );

    if (value) params.set(key, value);
    else params.delete(key);

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
        />
        <Input
          placeholder="Search transactions..."
          defaultValue={searchParams.keyword}
          onChange={(e) => {
            setTimeout(
              () => updateParam("keyword", e.target.value || null),
              300,
            );
          }}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <Select
        value={searchParams.type ?? "ALL"}
        onValueChange={(v) => updateParam("type", v === "ALL" ? null : v)}
      >
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="INCOME">Income</SelectItem>
          <SelectItem value="EXPENSE">Expense</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.category ?? "ALL"}
        onValueChange={(v) => updateParam("category", v === "ALL" ? null : v)}
      >
        <SelectTrigger className="w-40 h-8 text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.name}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        placeholder="From"
        defaultValue={searchParams.dateFrom}
        onChange={(e) => updateParam("dateFrom", e.target.value || null)}
        className="w-36 h-8 text-sm"
      />
      <Input
        type="date"
        placeholder="To"
        defaultValue={searchParams.dateTo}
        onChange={(e) => updateParam("dateTo", e.target.value || null)}
        className="w-36 h-8 text-sm"
      />

      {Object.values(searchParams).some(Boolean) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
          className="h-8 gap-1 text-muted-foreground"
        >
          <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" /> Clear
        </Button>
      )}

      <div className="ml-auto">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5">
              <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm
              categories={categories}
              onSuccess={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
