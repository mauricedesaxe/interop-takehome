import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/bridge")({
  component: Bridge,
});

function Bridge() {
  return (
    <div className="p-2">
      <h3>Bridge here</h3>
      <p>TODO: Implement bridge here</p>
    </div>
  );
}
