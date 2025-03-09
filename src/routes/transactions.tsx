import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/transactions")({
  component: Transactions,
});

function Transactions() {
  return (
    <div className="p-2">
      <h3>Transactions here</h3>
      <p>TODO: Implement transactions here</p>
    </div>
  );
}
