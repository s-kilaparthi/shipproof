"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  plan?: "launch" | null;
  planLabel?: string;
  className?: string;
  onSuccess?: () => void;
}

export function WaitlistForm({
  plan = null,
  planLabel,
  className,
  onSuccess,
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, plan }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Failed to join waitlist");
        return;
      }

      toast.success(
        plan === "launch"
          ? "You're on the Launch plan waitlist!"
          : "You're on the waitlist!"
      );
      setEmail("");
      onSuccess?.();
    } catch {
      toast.error("Failed to join waitlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      {planLabel ? (
        <p className="mb-3 text-center text-sm font-medium text-foreground">
          {planLabel}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          className="h-11 w-full sm:max-w-xs"
          required
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-11 shrink-0 bg-gray-900 px-6 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          {loading ? "Joining…" : "Join Waitlist"}
        </Button>
      </div>
    </form>
  );
}
