import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const CONTACT_EMAIL = "integerpj@gmail.com";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Find-Am" },
      { name: "description", content: "Get in touch with the Find-Am team. Send us a message and we'll respond as soon as we can." },
      { property: "og:title", content: "Contact Us — Find-Am" },
      { property: "og:description", content: "Reach the Find-Am team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(200),
  subject: z.string().trim().min(3, "Subject too short").max(120),
  message: z.string().trim().min(10, "Please share a bit more").max(3000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fill the form correctly");
      return;
    }
    setSending(true);
    const body = `From: ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`;
    const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(parsed.data.subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    setTimeout(() => setSending(false), 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-full hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="font-semibold">Contact Us</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="text-center mb-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary mb-3">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-ink">We'd love to hear from you</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Share feedback, report an issue, or ask a question. Your default mail app will open with the message pre-filled.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 bg-card border border-border rounded-2xl p-6">
          <Field label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              placeholder="Tell us what's on your mind…"
              maxLength={3000}
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 font-bold text-sm disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {sending ? "Opening mail app…" : "Submit message"}
          </button>
          <p className="text-xs text-center text-muted-foreground">
            Or email us directly at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-semibold hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </form>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
