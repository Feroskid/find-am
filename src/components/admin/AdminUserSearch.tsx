import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { adminSearchUsers } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

function toUsers(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.users ?? d.results ?? d.items ?? d.data ?? [];
}

/** Shared admin lookup: search by name / email / phone, then pick a user. */
export function AdminUserSearch({
  onPick,
  label = "Find a user",
}: {
  onPick: (user: any) => void;
  label?: string;
}) {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const searchFn = useServerFn(adminSearchUsers);

  const search = useMutation({
    mutationFn: () => searchFn({ data: { q: q.trim(), token: token! } }),
    onSuccess: (r: any) => {
      if (!r.ok) return toast.error(r.error);
      const list = toUsers(r.data);
      setUsers(list);
      if (!list.length) toast.info("No users matched that search.");
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <label className="text-xs font-semibold uppercase text-muted-foreground">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && q.trim().length >= 2) search.mutate(); }}
          placeholder="Name, email or phone"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          disabled={q.trim().length < 2 || search.isPending}
          onClick={() => search.mutate()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {search.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Search
        </button>
      </div>

      {users.length > 0 && (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {users.map((u: any, i: number) => (
            <li key={u.user_id ?? u.id ?? i}>
              <button
                onClick={() => onPick(u)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-ink truncate">{u.name ?? u.full_name ?? "Unnamed"}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {[u.email, u.phone, u.user_id ?? u.id].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {String(u.user_status ?? u.status ?? "active")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
