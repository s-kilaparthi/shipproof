import { ShieldCheck } from "lucide-react";

import { GitHubLoginButton } from "@/components/auth/github-login-button";

interface LoginPageProps {
  searchParams: { error?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="size-8 text-primary" />
            <span className="text-2xl">ShipProof</span>
          </div>

          <h1 className="mt-8 text-3xl font-bold tracking-tight">
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
        </div>
      </div>
    </main>
  );
}
