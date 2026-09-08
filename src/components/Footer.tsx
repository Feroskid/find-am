import { Link } from "@tanstack/react-router";
import { Instagram, Youtube } from "lucide-react";

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.65l-5.21-6.817-5.957 6.817H1.7l7.73-8.84L1.254 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
    <path d="M16.6 5.82A4.28 4.28 0 0 0 15.54 3h-3.1v12.4a2.6 2.6 0 1 1-1.86-2.5V9.7a5.72 5.72 0 1 0 4.96 5.66V8.9a7.1 7.1 0 0 0 4.06 1.28V7.08a4.28 4.28 0 0 1-2.99-1.26Z" />
  </svg>
);

const SOCIALS = [
  { label: "Find-am on X", href: "https://x.com/Find_am_1", icon: <XIcon /> },
  { label: "Find-am on Instagram", href: "https://www.instagram.com/find_am_1", icon: <Instagram className="h-4 w-4" /> },
  { label: "Find-am on YouTube", href: "https://www.youtube.com/@Find_Am_Tasks", icon: <Youtube className="h-4 w-4" /> },
  { label: "Find-am on TikTok", href: "https://www.tiktok.com/@find_am", icon: <TikTokIcon /> },
];

const COLS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { to: "/tasks", label: "How it works" },
      { to: "/explore", label: "Browse tasks" },
      { to: "/tasks/categories", label: "Categories" },
      { to: "/map", label: "Live task map" },
        { to: "/faq", label: "FAQ" },
      { to: "/community", label: "Community" },
      { to: "/coming-soon", label: "Earn money" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/terms", label: "About us" },
      { to: "/community", label: "Careers" },
      { to: "/community", label: "Media enquiries" },
      { to: "/community", label: "Community guidelines" },
      { to: "/terms", label: "Terms and Conditions" },
      { to: "/privacy", label: "Privacy policy" },
      { to: "/refund", label: "Refund policy" },
      { to: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Existing users",
    links: [
      { to: "/post-task", label: "Post a task" },
      { to: "/explore", label: "Browse tasks" },
      { to: "/community", label: "Support centre" },
      { to: "/login", label: "Log in" },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/wallet", label: "Wallet" },
    ],
  },
  {
    title: "Popular categories",
    links: [
      { to: "/tasks/categories", label: "Handyman Services" },
      { to: "/tasks/categories", label: "Cleaning Services" },
      { to: "/tasks/categories", label: "Delivery Services" },
      { to: "/tasks/categories", label: "Removalists" },
      { to: "/tasks/categories", label: "Gardening Services" },
      { to: "/tasks/categories", label: "Assembly Services" },
      { to: "/tasks/categories", label: "All Services" },
    ],
  },
  {
    title: "Popular locations",
    links: [
      { to: "/explore", label: "Lagos" },
      { to: "/explore", label: "Abuja" },
      { to: "/explore", label: "Port Harcourt" },
      { to: "/explore", label: "Ibadan" },
      { to: "/explore", label: "Kano" },
      { to: "/explore", label: "Benin City" },
      { to: "/explore", label: "Enugu" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground mt-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-5 text-sm">
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="font-bold mb-3 text-footer-foreground">{c.title}</div>
              <ul className="space-y-2 text-footer-foreground/75">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to as any} className="hover:text-footer-foreground hover:underline">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-background/15 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-display text-3xl text-primary">Find-task</div>
          <div className="flex items-center gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="grid h-10 w-10 place-items-center rounded-full border border-background/20 text-footer-foreground/80 transition hover:border-primary hover:text-primary"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>


        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs text-footer-foreground/60">
          <div>
            Integer Tech Ltd © {new Date().getFullYear()}. All rights reserved. Find-task is operated by Integer Tech Ltd · RC Number: 9598372 · 🇳🇬 Nigeria
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 font-semibold text-footer-foreground/85">
            <Link to="/terms" className="hover:text-footer-foreground hover:underline">Terms &amp; Conditions</Link>
            <span className="text-footer-foreground/30">·</span>
            <Link to="/privacy" className="hover:text-footer-foreground hover:underline">Privacy Policy</Link>
            <span className="text-footer-foreground/30">·</span>
            <Link to="/refund" className="hover:text-footer-foreground hover:underline">Refund Policy</Link>
            <span className="text-footer-foreground/30">·</span>
            <Link to="/community" className="hover:text-footer-foreground hover:underline">Community Guidelines</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
