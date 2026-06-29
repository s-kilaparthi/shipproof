"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    q: "Do you store my source code?",
    a: "No. We fetch only the specific files needed for analysis, scan them in memory, and immediately discard them. Only the security issues found are saved to your account — never your source code.",
  },
  {
    q: "How is this different from GitHub's built-in security?",
    a: "GitHub's security scanning catches dependency vulnerabilities. ShipProof goes further — we check your actual API routes for auth issues, your database for RLS gaps, your infrastructure for missing headers, and we model threats specific to your app type. Plus every issue comes with a copy-paste fix prompt.",
  },
  {
    q: "What if my app isn't built with a vibe coding tool?",
    a: 'ShipProof works with any codebase on GitHub. Select "I code manually" as your tool and we\'ll give you code snippets instead of AI prompts.',
  },
  {
    q: "How accurate is the scanning?",
    a: "Our 5-layer scan combines pattern matching (100% deterministic) with AI analysis. AI findings include confidence scores — we only show high and medium confidence issues to minimize false positives.",
  },
  {
    q: "Can I scan private repositories?",
    a: "Yes. GitHub OAuth gives us read-only access to both public and private repositories.",
  },
  {
    q: "What happens after I apply the fixes?",
    a: "Run a fresh scan to verify your fixes worked. Your score should improve with each round of fixes. Most apps reach production-ready in 2-3 scan cycles.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-xl border border-white/10 bg-[#12121a]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-medium text-white">{item.q}</span>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-gray-400 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="border-t border-white/5 px-5 pb-4 pt-3 text-sm leading-relaxed text-gray-400">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
