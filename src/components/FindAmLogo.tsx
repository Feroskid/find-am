import { cn } from "@/lib/utils";
import logoUrl from "@/assets/findam-logo.png";

// Find-Am wordmark + binoculars logo. Transparent PNG so it works on both
// light and dark backgrounds.
export function FindAmLogo({
  className,
  size = "text-2xl",
}: {
  className?: string;
  size?: string;
}) {
  // Map the legacy `size` text-* class to a pixel height so the wordmark logo
  // scales like the previous typographic logo.
  const heightClass = sizeToHeight(size);
  return (
    <img
      src={logoUrl}
      alt="Find-Am"
      className={cn("w-auto select-none", heightClass, className)}
      draggable={false}
    />
  );
}

function sizeToHeight(size: string): string {
  if (size.includes("7xl")) return "h-24 md:h-28";
  if (size.includes("6xl")) return "h-20 md:h-24";
  if (size.includes("5xl")) return "h-16";
  if (size.includes("4xl")) return "h-14";
  if (size.includes("3xl")) return "h-12";
  if (size.includes("2xl")) return "h-9";
  if (size.includes("xl")) return "h-8";
  return "h-7";
}
