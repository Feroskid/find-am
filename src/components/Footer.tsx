import { Link } from "@tanstack/react-router";

const COLS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { to: "/tasks", label: "How it works" },
      { to: "/explore", label: "Browse tasks" },
      { to: "/tasks/categories", label: "Categories" },
      { to: "/map", label: "Live task map" },
      { to: "/community", label: "Community" },
      { to: "/register", label: "Earn money" },
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

        <div className="mt-12 pt-8 border-t border-background/15">
          <div className="font-display text-3xl text-primary">Find-task</div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs text-footer-foreground/60">
          <div>
            Integer Tech Ltd © {new Date().getFullYear()}. All rights reserved. Find-task is operated by Integer Tech Ltd · 🇳🇬 Nigeria
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
