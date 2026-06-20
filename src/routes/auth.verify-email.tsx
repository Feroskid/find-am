import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { EmailVerificationPage } from "./verify-email";

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: (s) =>
    z.object({
      token: z.string().optional(),
      verification_token: z.string().optional(),
      email_verification_token: z.string().optional(),
      code: z.string().optional(),
    }).parse(s),
  head: () => ({ meta: [{ title: "Verify your email — Find-task" }] }),
  component: AuthVerifyEmail,
});

function AuthVerifyEmail() {
  const search = useSearch({ from: "/auth/verify-email" });
  const linkToken = search.token ?? search.verification_token ?? search.email_verification_token ?? search.code;
  return <EmailVerificationPage linkToken={linkToken} />;
}