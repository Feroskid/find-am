import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks/$taskId/applications")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/tasks/$taskId", params: { taskId: params.taskId } });
  },
});
