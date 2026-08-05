import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import { loginUser } from "@/lib/auth.functions";
import { verifyAdminAccess } from "@/lib/support.functions";
import { useAuth, pickToken, pickUser } from "@/lib/auth";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Find-task" },
      { name: "description", content: "Restricted sign in for Find-task administrators and moderators." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin sign in — Find-task" },
      { property: "og:description", content: "Restricted sign in for Find-task administrators and moderators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const login = useServerFn(loginUser);
  const verify = useServerFn(verifyAdminAccess);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ data: form });
      if (!res.ok) { setError(res.error); return; }
      const token = pickToken(res.data);
      if (!token) { setError("Sign in failed. Please try again."); return; }
      const check: any = await verify({ data: { token } });
      if (!check?.ok) { setError(check?.error ?? "This account does not have admin access."); return; }
      setAuth({ token, user: pickUser(res.data) });
      navigate({ to: "/admin" });
    } catch (err: any) {
      setError(err?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card/95 backdrop-blur shadow-xl p-7 sm:p-9">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Restricted area — administrator and moderator accounts only.</p>
          </div>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">Admin email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  required type="email" autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@find-am.com"
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
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
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Sign in to admin console
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Not an admin? <Link to="/login" className="text-primary font-semibold hover:underline">Use the normal sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
