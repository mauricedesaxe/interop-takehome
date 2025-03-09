import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/bridge")({
  component: Bridge,
});

/**
 * Mock function to simulate the fee estimation fetch
 */
async function estimateBridgeFee(
  amount: number
): Promise<{ fee: string; estimatedTime: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    fee: (amount * 0.003).toFixed(4),
    estimatedTime: "~15 minutes",
  };
}

/**
 * Mock function to simulate the bridging process (this would be a call to a smart contract usually)
 */
async function bridge(
  amount: number
): Promise<{ success: boolean; txHash: string }> {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    success: true,
    txHash: "0x" + Math.random().toString(16).substring(2, 42),
  };
}

function Bridge() {
  const [amount, setAmount] = useState<string>("100");

  const { data: bridgeEstimate, isLoading: isEstimating } = useQuery({
    queryKey: ["bridgeFee", amount],
    queryFn: () => estimateBridgeFee(parseFloat(amount) || 0),
    enabled: !!amount && parseFloat(amount) > 0,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const { mutate: executeBridge, isPending: bridgeInProgress } = useMutation({
    mutationFn: (bridgeAmount: number) => bridge(bridgeAmount),
    onSuccess: (data) => {
      alert(`Bridge completed successfully! Transaction hash: ${data.txHash}`);
    },
    onError: (error) => {
      alert(`Bridge failed: ${error}`);
    },
  });

  const handleBridge = () => {
    const amountValue = parseFloat(amount);
    if (amountValue > 0) {
      executeBridge(amountValue);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Bridge USDC</h2>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            From (Ethereum)
          </label>
          <div className="flex justify-between items-center w-full p-2 border rounded">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-2/3 bg-transparent focus:outline-none"
              placeholder="0.0"
              min="0.01"
              step="0.01"
            />
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <span className="font-medium">USDC</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center my-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">To (Polygon)</label>
          <div className="w-full p-2 border rounded bg-gray-50 flex justify-between items-center">
            <span>{amount || "0.0"}</span>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
              <span className="font-medium">USDC</span>
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm">
          <div className="flex justify-between">
            <span>Bridge Fee:</span>
            <span>
              {isEstimating
                ? "Calculating..."
                : `${bridgeEstimate?.fee || "0.00"} ETH`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Time:</span>
            <span>{bridgeEstimate?.estimatedTime || "~15 minutes"}</span>
          </div>
        </div>

        <button
          onClick={handleBridge}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          disabled={
            isEstimating ||
            bridgeInProgress ||
            !amount ||
            parseFloat(amount) <= 0
          }
        >
          {bridgeInProgress
            ? "Bridging..."
            : isEstimating
              ? "Loading..."
              : "Bridge USDC"}
        </button>

        <div className="mt-3 text-sm text-gray-500 text-center">
          Powered by Axelar Network
        </div>
      </div>
    </div>
  );
}
