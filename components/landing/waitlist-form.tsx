"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  plan?: "launch" | null;
  planLabel?: string;
  className?: string;
  onSuccess?: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormStatus =
  | { type: "idle" }
  | { type: "success"; email: string }
  | { type: "already"; email: string };

export function WaitlistForm({
  plan = null,
  planLabel,
  className,
  onSuccess,
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setValidationError("Please enter a valid email address");
      return;
    }

    setValidationError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, plan }),
      });

      const data = (await response.json()) as {
        error?: string;
        ok?: boolean;
        updated?: boolean;
      };

      if (!response.ok) {
        if (response.status === 400) {
          setValidationError("Please enter a valid email address");
          return;
        }
        setValidationError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (data.updated) {
        setStatus({ type: "already", email: trimmed });
      } else {
        setStatus({ type: "success", email: trimmed });
      }
      onSuccess?.();
    } catch {
      setValidationError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status.type === "success") {
    return (
      <div className={cn("w-full text-center", className)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="text-green-600 dark:text-green-500">✓</span>{" "}
          You&apos;re on the list!
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          We&apos;ll email you at {status.email} when payments launch.
        </p>
      </div>
    );
  }

  if (status.type === "already") {
    return (
      <div className={cn("w-full text-center", className)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You&apos;re already on the waitlist!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)} noValidate>
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
          onChange={(event) => {
            setEmail(event.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={loading}
          className="h-11 w-full sm:max-w-xs"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-11 shrink-0 bg-gray-900 px-6 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          {loading ? "Adding you..." : "Join Waitlist"}
        </Button>
      </div>
      {validationError ? (
        <p className="mt-2 text-center text-xs text-red-500">{validationError}</p>
      ) : null}
    </form>
  );
}
