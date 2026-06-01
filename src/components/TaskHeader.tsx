import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function TaskHeader() {
  const [open, setOpen] = useState(false);
  const { token, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to="/tasks" className="font-extrabold text-2xl tracking-tight text-primary">
            Find-task
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-foreground/80">
            <Link to="/tasks" className="hover:text-foreground">Post a task</Link>
            <a href="#categories" className="hover:text-foreground">Categories</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <button
              onClick={logout}
              className="text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              Log out
            </button>
          ) : (
            <>
              <Link to="/register" className="text-sm font-medium text-foreground/80 hover:text-foreground">
                Sign up
              </Link>
              <Link to="/login" className="text-sm font-medium text-foreground/80 hover:text-foreground">
                Log in
              </Link>
            </>
          )}
          <Link
            to="/register"
            className="inline-flex items-center rounded-full border border-primary px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Become a Tasker
          </Link>
        </div>

        <button
          className="md:hidden p-2 -mr-2 text-foreground"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 flex flex-col gap-3 text-sm">
            <Link to="/tasks" onClick={() => setOpen(false)}>Post a task</Link>
            <a href="#categories" onClick={() => setOpen(false)}>Categories</a>
            <a href="#how" onClick={() => setOpen(false)}>How it works</a>
            <div className="h-px bg-border" />
            {token ? (
              <button onClick={() => { logout(); setOpen(false); }} className="text-left">Log out</button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
