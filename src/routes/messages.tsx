import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Find-task" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/messages" } as any });
  }, [token, navigate]);
  if (!token) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 flex-1">
        <h1 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> Messages
        </h1>
        <p className="mt-1 text-muted-foreground">
          Conversations happen inside each task workspace.
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Open a task to start chatting with the other party.{" "}
          <Link to="/tasks/browse" className="text-primary font-medium">Browse tasks</Link>
          {" · "}
          <Link to="/dashboard" className="text-primary font-medium">Go to dashboard</Link>
        </div>
      </main>
    </div>
  );
}
