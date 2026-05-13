"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-2 bg-background/80 backdrop-blur-md shadow-lg hover:scale-110 transition-all duration-300"
          >
            <Sun className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-[1.5rem] w-[1.5rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="mb-2 rounded-2xl p-2 border-2 bg-background/95 backdrop-blur-xl shadow-2xl">
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer hover:bg-accent"
          >
            <Sun className="h-4 w-4 text-amber-500" />
            <span className="font-medium">Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer hover:bg-accent"
          >
            <Moon className="h-4 w-4 text-blue-400" />
            <span className="font-medium">Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer hover:bg-accent"
          >
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
