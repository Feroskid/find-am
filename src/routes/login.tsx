import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, Lock } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { PasswordInput } from "@/components/PasswordInput";
import { loginUser } from "@/lib/auth.functions";
import { useAuth, pickToken, pickUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Find-task" },
      { name: "description", content: "Log in to your Find-task account to post tasks and manage your work." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, token, ready } = useAuth();
  const login = useServerFn(loginUser);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already-logged-in users skip the form (wait until auth has hydrated).
  useEffect(() => {
    if (ready && token) navigate({ to: "/dashboard", replace: true });
  }, [ready, token, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ data: form });
      if (!res.ok) { setError(res.error); return; }
      setAuth({ token: pickToken(res.data), user: pickUser(res.data) });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card/95 backdrop-blur shadow-xl p-7 sm:p-9">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Lock className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Log in to continue on Find-task.</p>
            </div>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    required type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </div>
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Password</span>
                <PasswordInput
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  placeholder="Your password"
                />
              </label>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Log in
              </button>
            </form>

            <div className="mt-4 text-right">
              <Link to="/reset-password" className="text-xs font-medium text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to Find-task?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
