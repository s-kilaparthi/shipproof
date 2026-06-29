"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white"
        >
          ⚡ ShipProof
        </Link>

        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-[#3b82f6] px-5 text-white hover:bg-[#2563eb]">
              Start Free Scan
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-gray-300 hover:bg-white/10 sm:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0a0a0f]/95 px-4 py-4 backdrop-blur-xl sm:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button
                variant="ghost"
                className="w-full text-gray-300 hover:bg-white/10 hover:text-white"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-[#3b82f6] text-white hover:bg-[#2563eb]">
                Start Free Scan
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
