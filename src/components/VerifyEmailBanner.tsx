import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MailWarning, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { checkEmailVerification } from "@/lib/findtask.functions";

const DISMISS_KEY = "findam:verifyBannerDismissed";

export function VerifyEmailBanner() {
  const { token, user } = useAuth();
  const checkVerified = useServerFn(checkEmailVerification);
  const [dismissed, setDismissed] = useState(true);

  const verificationQ = useQuery({
    queryKey: ["email-verification-status", token],
    enabled: !!token,
    staleTime: 10 * 60_000,
    queryFn: () => checkVerified({ data: { token: token! } }),
  });

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1"); } catch {}
  }, []);

  if (!token || !user) return null;
  const verified =
    (user as any).email_verified === true ||
    (user as any).is_email_verified === true ||
    (user as any).verified === true ||
    (user as any).email_verified_at != null ||
    (verificationQ.data?.ok && (verificationQ.data.data as any)?.verified === true);
  if (verified || dismissed) return null;

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex items-center gap-3 text-sm">
        <MailWarning className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">
          Your email isn't verified yet. Verify now to unlock payouts and full access.
        </span>
        <Link
          to="/verify-email"
          className="inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Verify email
        </Link>
        <button
          aria-label="Dismiss"
          onClick={() => { try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}; setDismissed(true); }}
          className="opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
