"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  iconOnly?: boolean;
  className?: string;
}

export function SignOutButton({ iconOnly = false, className }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-9", className)}
        onClick={handleSignOut}
        disabled={loading}
        aria-label={loading ? "Signing out" : "Sign out"}
      >
        <LogOut className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut className="size-4" />
      {loading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
