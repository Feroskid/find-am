import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, Phone, User as UserIcon, Sparkles } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { PasswordInput } from "@/components/PasswordInput";
import { registerUser, loginUser } from "@/lib/auth.functions";
import { useAuth, pickToken, pickUser } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Sign up — Find-task" },
      { name: "description", content: "Create your free Find-task account. One account works for both posting tasks and earning as a tasker." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth, token } = useAuth();
  const reg = useServerFn(registerUser);
  const login = useServerFn(loginUser);

  useEffect(() => {
    if (token) navigate({ to: "/dashboard", replace: true });
  }, [token, navigate]);

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords don't match. Please re-enter to confirm.");
      return;
    }
    setLoading(true);
    try {
      const { confirm: _c, ...payload } = form;
      const res = await reg({ data: { ...payload, account_type: "individual" } });
      if (!res.ok) { setError(res.error); return; }
      const loginRes = await login({ data: { email: form.email, password: form.password } });
      if (loginRes.ok) setAuth({ token: pickToken(loginRes.data), user: pickUser(loginRes.data) });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
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
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">One account. Post tasks <em>and</em> earn as a tasker.</p>
            </div>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <IconField label="Full name" icon={<UserIcon className="h-4 w-4" />}>
                <input required minLength={2} maxLength={120} value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="input-with-icon" autoComplete="name" placeholder="Jane Doe" />
              </IconField>
              <IconField label="Email" icon={<Mail className="h-4 w-4" />}>
                <input required type="email" maxLength={255} value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="input-with-icon" autoComplete="email" placeholder="you@example.com" />
              </IconField>
              <IconField label="Phone" icon={<Phone className="h-4 w-4" />}>
                <input required minLength={6} maxLength={32} value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="input-with-icon" autoComplete="tel" placeholder="+234…" />
              </IconField>
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Password</span>
                <PasswordInput required minLength={6} maxLength={128} value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  autoComplete="new-password" placeholder="At least 6 characters" />
              </label>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-60">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </main>
      <style>{`.input-with-icon{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.5rem;padding:0.625rem 0.75rem 0.625rem 2.25rem;font-size:0.875rem;outline:none}.input-with-icon:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 2px oklch(var(--ring) / 0.3)}`}</style>
    </div>
  );
}

function IconField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}
