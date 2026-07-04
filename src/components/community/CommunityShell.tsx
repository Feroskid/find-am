import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { MessageSquare, Search, Bell, User, LogOut, LogIn, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function CommunityShell({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setProfile(null); return; }
    (supabase.from as any)("community_profiles").select("username, display_name, rank, points").eq("id", session.user.id).maybeSingle()
      .then(({ data }: any) => setProfile(data));
  }, [session?.user?.id]);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/community" }); };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1a1a1a] flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-black/5">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link to="/community" className="flex items-center gap-2 shrink-0">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E5A54B] text-white font-bold">FT</div>
            <span className="font-bold text-lg tracking-tight">Find-Task <span className="text-[#E5A54B]">Community</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm ml-4">
            <Link to="/community" className="px-3 py-1.5 rounded-lg hover:bg-black/5 font-medium">Home</Link>
            <Link to="/community/search" search={{ q: "" } as any} className="px-3 py-1.5 rounded-lg hover:bg-black/5 font-medium">Search</Link>
            <Link to="/" className="px-3 py-1.5 rounded-lg hover:bg-black/5 font-medium text-black/60">← Back to Find-Task</Link>
          </nav>
          <div className="flex-1" />
          {session?.user ? (
            <>
              <Link to="/community/notifications" className="p-2 rounded-lg hover:bg-black/5"><Bell className="h-4 w-4" /></Link>
              <Link to="/community/new" className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-[#1a1a1a] text-white px-3 py-1.5 text-sm font-semibold hover:opacity-90"><Plus className="h-4 w-4" /> New thread</Link>
              <div className="flex items-center gap-2 text-sm">
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="font-semibold">{profile?.display_name ?? profile?.username ?? "You"}</span>
                  <span className="text-[10px] text-[#E5A54B] font-bold uppercase">{profile?.rank ?? "Newbie"} · {profile?.points ?? 0}pts</span>
                </div>
                <button onClick={signOut} className="p-2 rounded-lg hover:bg-black/5" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
              </div>
            </>
          ) : (
            <Link to="/community/auth" className="inline-flex items-center gap-1 rounded-lg bg-[#E5A54B] text-white px-4 py-1.5 text-sm font-bold hover:opacity-90">
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      <footer className="border-t border-black/5 py-6 text-center text-xs text-black/50">
        Find-Task Community · Be kind, share knowledge, level up.
      </footer>
    </div>
  );
}

export function RankBadge({ rank, points }: { rank?: string; points?: number }) {
  const colors: Record<string, string> = {
    Newbie: "bg-gray-200 text-gray-700",
    Contributor: "bg-emerald-100 text-emerald-800",
    Regular: "bg-sky-100 text-sky-800",
    Veteran: "bg-violet-100 text-violet-800",
    Expert: "bg-orange-100 text-orange-800",
    Legend: "bg-[#E5A54B] text-white",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors[rank ?? "Newbie"] ?? colors.Newbie}`}>
      {rank ?? "Newbie"}{typeof points === "number" ? ` · ${points}` : ""}
    </span>
  );
}
