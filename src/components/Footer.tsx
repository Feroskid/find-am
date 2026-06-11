import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="font-extrabold text-lg text-primary">Find-task</div>
          <p className="mt-2 text-muted-foreground">
            Get anything done. Trusted Taskers across Nigeria, paid securely through escrow.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-2">Discover</div>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/explore" className="hover:text-foreground">Explore</Link></li>
            <li><Link to="/tasks/categories" className="hover:text-foreground">Categories</Link></li>
            <li><Link to="/map" className="hover:text-foreground">Live map</Link></li>
            <li><Link to="/community" className="hover:text-foreground">Community</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Account</div>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            <li><Link to="/profile" className="hover:text-foreground">Profile</Link></li>
            <li><Link to="/wallet" className="hover:text-foreground">Wallet</Link></li>
            <li><Link to="/post-task" className="hover:text-foreground">Post a task</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Legal & Help</div>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/terms" className="hover:text-foreground">Terms & Privacy</Link></li>
            <li><Link to="/verify-email" className="hover:text-foreground">Verify email</Link></li>
            <li><Link to="/reset-password" className="hover:text-foreground">Reset password</Link></li>
            <li><Link to="/community" className="hover:text-foreground">Help center</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-8 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} Find-task · Powered by Find-Am
      </div>
    </footer>
  );
}
