import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Swap
        </Link>{" "}
        <Link to="/bridge" className="[&.active]:font-bold">
          Bridge
        </Link>{" "}
        <Link to="/transactions" className="[&.active]:font-bold">
          Transactions
        </Link>
      </div>
      <hr />
      <Outlet />
    </>
  ),
});
