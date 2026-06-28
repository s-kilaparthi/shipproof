export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to start scanning your app for security issues.
        </p>
      </div>
    </main>
  );
}
