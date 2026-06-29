import { ShieldCheck } from "lucide-react";

import { GitHubLoginButton } from "@/components/auth/github-login-button";
import { ThemeToggle } from "@/components/theme-toggle";

interface LoginPageProps {
  searchParams: { error?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
            <ShieldCheck className="size-8 text-foreground" />
            <span className="text-2xl">ShipProof</span>
          </div>

          <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground">
            Ship with confidence
          </h1>
          <p className="mt-3 text-muted-foreground">
            Scan your app for security issues, performance problems and get
            instant fix prompts.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          {searchParams.error === "auth" && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Authentication failed. Please try again.
            </p>
          )}
          <GitHubLoginButton />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            🔒 Read-only access · We never store your code · Only security
            issues are saved
          </p>
        </div>
      </div>
    </main>
  );
}
