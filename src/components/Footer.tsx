import { Link } from "@tanstack/react-router";

const COLS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { to: "/explore", label: "Browse tasks" },
      { to: "/tasks/categories", label: "Categories" },
      { to: "/map", label: "Live task map" },
      { to: "/community", label: "Community" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/terms", label: "About Find-task" },
      { to: "/terms", label: "Trust & safety" },
      { to: "/terms", label: "Insurance" },
      { to: "/community", label: "Careers" },
    ],
  },
  {
    title: "Existing users",
    links: [
      { to: "/login", label: "Log in" },
      { to: "/register", label: "Sign up" },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/wallet", label: "Wallet" },
    ],
  },
  {
    title: "Popular categories",
    links: [
      { to: "/tasks/categories", label: "Cleaning" },
      { to: "/tasks/categories", label: "Removals" },
      { to: "/tasks/categories", label: "Handyman" },
      { to: "/tasks/categories", label: "Delivery" },
      { to: "/tasks/categories", label: "Gardening" },
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
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-soft mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-border">
          <div>
            <div className="font-display text-3xl text-primary">Find-task</div>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Post any task. Pick the best person. Get it done — securely paid through Find-task.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-semibold">
              📱 Download iOS
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-semibold">
              🤖 Download Android
            </span>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-5 mt-10 text-sm">
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="font-bold mb-3 text-foreground uppercase tracking-wider text-xs">{c.title}</div>
              <ul className="space-y-2 text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to as any} className="hover:text-primary">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Find-task. All rights reserved.</span>
          <span>Powered by Find-Am · 🇳🇬 Nigeria</span>
        </div>
      </div>
    </footer>
  );
}
