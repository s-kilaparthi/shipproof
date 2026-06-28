import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="size-4" />
          <span>ShipProof</span>
        </div>
        <p>Security audits and DevOps guidance for founders who ship fast.</p>
      </div>
    </footer>
  );
}
