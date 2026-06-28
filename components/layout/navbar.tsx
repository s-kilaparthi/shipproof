import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <ShieldCheck className="size-6 text-primary" />
          <span>ShipProof</span>
        </Link>
        <Link href="/login">
          <Button>Get Started</Button>
        </Link>
      </div>
    </header>
  );
}
