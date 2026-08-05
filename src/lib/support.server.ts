import { supabaseAdmin } from "@/integrations/supabase/client.server";

const API_BASE = "https://api.find-am.com";

export type AdminIdentity = { userId: string | number; name: string; email: string; raw: any };

export function looksAdmin(me: any): boolean {
  if (!me) return false;
  const flags = [me.is_admin, me.isAdmin, me.is_staff, me.is_superuser, me.admin];
  if (flags.some((f) => f === true || f === 1 || f === "true")) return true;
  const roleish = [me.role, me.user_role, me.account_role, me.account_type, me.user_type, me.type]
    .filter(Boolean)
    .map((r: any) => String(r).toLowerCase());
  if (roleish.some((r) => r === "admin" || r === "superadmin" || r === "moderator" || r === "staff")) return true;
  const roles = Array.isArray(me.roles) ? me.roles.map((r: any) => String(r?.name ?? r).toLowerCase()) : [];
  return roles.some((r: string) => r === "admin" || r === "moderator" || r === "staff");
}

/** Verify a Find-am API token belongs to an admin. Throws otherwise. */
export async function requireAdmin(token: string): Promise<AdminIdentity> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Your session has expired. Please sign in again.");
  const me = await res.json().catch(() => ({}));
  const inner = me?.user ?? me?.data ?? me;
  if (!looksAdmin(inner)) throw new Error("This account does not have admin access.");
  return {
    userId: inner?.user_id ?? inner?.id ?? "admin",
    name: inner?.name ?? inner?.full_name ?? "Admin",
    email: inner?.email ?? "",
    raw: inner,
  };
}

export async function insertTicket(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  user_ref?: string | undefined;
}) {
  const { data, error } = await supabaseAdmin
    .from("support_tickets")
    .insert({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      category: input.category,
      user_ref: input.user_ref ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function selectTickets(status: string) {
  let q = supabaseAdmin
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function selectTicketThread(ticketId: string) {
  const [t, m] = await Promise.all([
    supabaseAdmin.from("support_tickets").select("*").eq("id", ticketId).maybeSingle(),
    supabaseAdmin
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ]);
  if (t.error) throw t.error;
  if (m.error) throw m.error;
  return { ticket: t.data, messages: m.data ?? [] };
}

export async function insertTicketReply(input: {
  ticketId: string;
  body: string;
  authorName: string;
}) {
  const { error } = await supabaseAdmin.from("support_ticket_messages").insert({
    ticket_id: input.ticketId,
    author_role: "admin",
    author_name: input.authorName,
    body: input.body,
  });
  if (error) throw error;
  const { error: uErr } = await supabaseAdmin
    .from("support_tickets")
    .update({ status: "answered", last_reply_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", input.ticketId);
  if (uErr) throw uErr;
}

export async function patchTicket(input: {
  ticketId: string;
  status?: string | undefined;
  priority?: string | undefined;
}) {
  const patch: { updated_at: string; status?: string; priority?: string } = {
    updated_at: new Date().toISOString(),
  };
  if (input.status) patch.status = input.status;
  if (input.priority) patch.priority = input.priority;
  const { error } = await supabaseAdmin.from("support_tickets").update(patch).eq("id", input.ticketId);
  if (error) throw error;
}

export async function ticketCounts() {
  const { data, error } = await supabaseAdmin.from("support_tickets").select("status");
  if (error) throw error;
  const rows = data ?? [];
  return {
    total: rows.length,
    open: rows.filter((r: any) => r.status === "open").length,
    answered: rows.filter((r: any) => r.status === "answered").length,
    closed: rows.filter((r: any) => r.status === "closed").length,
  };
}
