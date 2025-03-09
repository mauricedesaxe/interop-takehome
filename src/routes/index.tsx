import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: Index,
});

/**
 * Mock for the function that fetches the pool data from the Subgraph
 */
async function fetchPoolData() {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    token0Price: 2500,
    fee: 0.003,
    volumeUSD: 15_000_000,
  };
}

/**
 * Mock for the function that swaps the tokens (this would be the call to the smart contract in a real life scenario)
 */
async function swap(amount: number) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    success: true,
    txHash: "0x" + Math.random().toString(16).substring(2, 10) + "...",
  };
}

function Index() {
  const [swapAmount, setSwapAmount] = useState<string>("1");

  const {
    data: poolData,
    isLoading: isLoadingPool,
    error: poolError,
  } = useQuery({
    queryKey: ["poolData"],
    queryFn: fetchPoolData,
    staleTime: 60_000,
  });

  const {
    mutate: executeSwap,
    isPending: isSwapping,
    isSuccess: swapSuccess,
    error: swapError,
  } = useMutation({
    mutationFn: (amount: number) => swap(amount),
    onSuccess: () => {
      // Could invalidate queries or update cache here if needed
      // For example: queryClient.invalidateQueries({ queryKey: ['poolData'] })
    },
  });

  const calculateSwapEstimate = () => {
    if (!poolData) return { estimate: 0, fee: 0 };

    const amount = parseFloat(swapAmount) || 0;
    const estimate = amount * poolData.token0Price;
    const fee = estimate * poolData.fee;

    return { estimate, fee };
  };

  const { estimate: swapEstimate, fee: swapFee } = calculateSwapEstimate();

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSwap(parseFloat(swapAmount));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Swap ETH to USDC</h2>

        {isLoadingPool ? (
          <div className="text-center py-4">Loading pool data...</div>
        ) : poolError ? (
          <div className="text-center py-4 text-red-500">
            Error loading pool data. Please try again.
          </div>
        ) : (
          <form onSubmit={handleSwap}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                From (ETH)
              </label>
              <input
                type="number"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                className="w-full p-2 border rounded"
                min="0.01"
                step="0.01"
                required
                disabled={isSwapping}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                To (USDC)
              </label>
              <div className="w-full p-2 border rounded bg-gray-50">
                {swapEstimate.toFixed(2)}
              </div>
            </div>

            <div className="mb-4 text-sm">
              <div className="flex justify-between">
                <span>Exchange Rate:</span>
                <span>1 ETH = {poolData?.token0Price} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Fee:</span>
                <span>
                  {swapFee.toFixed(2)} USDC (
                  {((poolData?.fee || 0) * 100).toFixed(2)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>24h Volume:</span>
                <span>
                  ${((poolData?.volumeUSD || 0) / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSwapping || parseFloat(swapAmount) <= 0}
            >
              {isSwapping ? "Processing..." : "Swap"}
            </button>

            {swapSuccess && (
              <div className="mt-3 p-2 bg-green-100 text-green-800 rounded text-center">
                Swap successful!
              </div>
            )}

            {swapError && (
              <div className="mt-3 p-2 bg-red-100 text-red-800 rounded text-center">
                Error: Failed to complete swap. Please try again.
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
