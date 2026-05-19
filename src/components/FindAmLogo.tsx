import { cn } from "@/lib/utils";

// Google-style multicolor wordmark for Find-Am
// F-i-n-d - A-m  using brand-ish primaries
const COLORS = [
  "#4285F4", // F - blue
  "#EA4335", // i - red
  "#FBBC05", // n - yellow
  "#4285F4", // d - blue
  "#34A853", // A - green
  "#EA4335", // m - red
];

export function FindAmLogo({ className, size = "text-2xl" }: { className?: string; size?: string }) {
  const letters = ["F", "i", "n", "d", "-", "A", "m"];
  let ci = 0;
  return (
    <span className={cn("font-extrabold tracking-tight select-none", size, className)}>
      {letters.map((l, i) => {
        if (l === "-") {
          return (
            <span key={i} className="text-foreground/70">
              {l}
            </span>
          );
        }
        const color = COLORS[ci++ % COLORS.length];
        return (
          <span key={i} style={{ color }}>
            {l}
          </span>
        );
      })}
    </span>
  );
}
