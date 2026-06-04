import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
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
  const { setAuth } = useAuth();
  const reg = useServerFn(registerUser);
  const login = useServerFn(loginUser);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Backend still expects account_type — every Find-task user is both poster + tasker,
      // so we default to "individual" without exposing the choice to the user.
      const res = await reg({ data: { ...form, account_type: "individual" } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const loginRes = await login({ data: { email: form.email, password: form.password } });
      if (loginRes.ok) {
        setAuth({ token: pickToken(loginRes.data), user: pickUser(loginRes.data) });
      }
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
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One account, two modes. Post tasks <em>and</em> earn as a tasker.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Full name">
              <input
                required minLength={2} maxLength={120}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="input"
                autoComplete="name"
              />
            </Field>
            <Field label="Email">
              <input
                required type="email" maxLength={255}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="input"
                autoComplete="email"
              />
            </Field>
            <Field label="Phone">
              <input
                required minLength={6} maxLength={32}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input"
                autoComplete="tel"
                placeholder="+234…"
              />
            </Field>
            <Field label="Password">
              <input
                required type="password" minLength={6} maxLength={128}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="input"
                autoComplete="new-password"
              />
            </Field>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:transparent;border-radius:0.5rem;padding:0.625rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{box-shadow:0 0 0 2px oklch(var(--ring) / 0.4)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
