import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export const Route = createRootRoute({
  component: () => (
    <div className="bg-slate-50 min-h-screen">
      <Disclosure as="nav" className="bg-gray-800 shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex shrink-0 items-center">
                <img
                  alt="Interop Labs"
                  src="/interop-labs.png"
                  className="h-8 w-auto"
                />
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white [&.active]:border-indigo-400 [&.active]:text-white"
                >
                  Swap
                </Link>
                <Link
                  to="/bridge"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white [&.active]:border-indigo-400 [&.active]:text-white"
                >
                  Bridge
                </Link>
                <Link
                  to="/transactions"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white [&.active]:border-indigo-400 [&.active]:text-white"
                >
                  Transactions
                </Link>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon
                  aria-hidden="true"
                  className="block size-6 group-data-[open]:hidden"
                />
                <XMarkIcon
                  aria-hidden="true"
                  className="hidden size-6 group-data-[open]:block"
                />
              </DisclosureButton>
            </div>
          </div>
        </div>

        <DisclosurePanel className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            <DisclosureButton
              as={Link}
              to="/"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-300 hover:border-gray-500 hover:bg-gray-700 hover:text-white [&.active]:border-indigo-400 [&.active]:bg-gray-700 [&.active]:text-white"
            >
              Swap
            </DisclosureButton>
            <DisclosureButton
              as={Link}
              to="/bridge"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-300 hover:border-gray-500 hover:bg-gray-700 hover:text-white [&.active]:border-indigo-400 [&.active]:bg-gray-700 [&.active]:text-white"
            >
              Bridge
            </DisclosureButton>
            <DisclosureButton
              as={Link}
              to="/transactions"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-300 hover:border-gray-500 hover:bg-gray-700 hover:text-white [&.active]:border-indigo-400 [&.active]:bg-gray-700 [&.active]:text-white"
            >
              Transactions
            </DisclosureButton>
          </div>
        </DisclosurePanel>
      </Disclosure>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
        }}
      />
    </div>
  ),
});
