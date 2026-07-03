"use client";

import Link from "next/link";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface LandingNavProps {
  /** When set, skips client auth fetch and uses this state. */
  isAuthenticated?: boolean;
}

export function LandingNav({ isAuthenticated: isAuthenticatedProp }: LandingNavProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    isAuthenticatedProp ?? false
  );
  const [authReady, setAuthReady] = useState(isAuthenticatedProp !== undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticatedProp !== undefined) {
      setIsAuthenticated(isAuthenticatedProp);
      setAuthReady(true);
      return;
    }

    let cancelled = false;
    const supabase = createBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setIsAuthenticated(!!data.user);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [isAuthenticatedProp]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-card-border bg-background transition-all duration-300",
        scrolled && "bg-background/95 backdrop-blur-xl"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
        >
          <ShieldCheck className="size-6" />
          ShipProof
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          {authReady && isAuthenticated ? (
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button>Start Free Scan</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="rounded-lg p-2 text-foreground hover:bg-muted-background"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-card-border bg-background px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-3">
            {authReady && isAuthenticated ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Start Free Scan</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
