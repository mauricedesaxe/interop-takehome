import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: Index,
});

/**
 * Fetches pool data from the Uniswap V3 Subgraph
 */
async function fetchPoolData() {
  // I've identified this pool as the highest volume USDC-WETH pool on Arbitrum One at the time of writing
  const POOL_ID = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640";

  const query = `
    {
      pool(id: "${POOL_ID}") {
        token0 {
          symbol
        }
        token1 {
          symbol
        }
        token0Price
        token1Price
        feeTier
        volumeUSD
      }
    }
  `;

  const API_KEY = import.meta.env.VITE_THE_GRAPH_API_KEY;
  const SUBGRAPH_ID = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
  if (!API_KEY) {
    console.error(
      "Missing Graph API key. Please set VITE_THE_GRAPH_API_KEY in your environment variables."
    );
    throw new Error("API key not configured");
  }

  const response = await fetch(
    `https://gateway.thegraph.com/api/${API_KEY}/subgraphs/id/${SUBGRAPH_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const data = await response.json();

  if (data.errors) {
    console.error("GraphQL errors:", data.errors);
    throw new Error(
      "Failed to fetch pool data: " +
        (data.errors[0]?.message || "Unknown error")
    );
  }

  if (!data.data || !data.data.pool) {
    throw new Error("Pool not found or invalid response format");
  }

  const poolData = data.data.pool;

  const token0Price = parseFloat(poolData.token0Price);
  const token1Price = parseFloat(poolData.token1Price);
  const feeDecimal = parseInt(poolData.feeTier) / 1000000;

  return {
    token0Price,
    token1Price,
    fee: feeDecimal,
    volumeUSD: parseFloat(poolData.volumeUSD),
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
  const [debouncedAmount, setDebouncedAmount] = useState<string>(swapAmount);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(swapAmount);
    }, 200); // debounce delay should be enough to not calculate every keystroke, but still be responsive (read Doherty Threshold)
    return () => clearTimeout(timer);
  }, [swapAmount]);

  const {
    data: poolData,
    isLoading: isLoadingPool,
    error: poolError,
  } = useQuery({
    queryKey: ["poolData"],
    queryFn: fetchPoolData,
    staleTime: 60_000,
    refetchInterval: 60_000,
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

  const calculateSwapEstimate = useMemo(() => {
    if (!poolData) return { estimate: 0, fee: 0 };

    const amount = parseFloat(debouncedAmount) || 0;
    const estimate = amount * poolData.token0Price;
    const fee = estimate * poolData.fee;

    return { estimate, fee };
  }, [debouncedAmount, poolData]);

  const { estimate: swapEstimate, fee: swapFee } = calculateSwapEstimate;

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
