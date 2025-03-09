import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTimeSince } from "../utils";
import toast from "react-hot-toast";

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
    timestampUTC: new Date().toUTCString(),
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
    txHash: "0x" + Math.random().toString(16).substring(2, 42),
  };
}

function Index() {
  const [swapAmount, setSwapAmount] = useState<string>("1");
  const [debouncedAmount, setDebouncedAmount] = useState<string>(swapAmount);
  const [direction, setDirection] = useState<"ETH_TO_USDC" | "USDC_TO_ETH">(
    "ETH_TO_USDC"
  );
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(swapAmount);
    }, 200); // debounce delay should be enough to not calculate every keystroke, but still be responsive (read Doherty Threshold)
    return () => clearTimeout(timer);
  }, [swapAmount]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const { mutate: executeSwap, isPending: isSwapping } = useMutation({
    mutationFn: (amount: number) => swap(amount),
    onSuccess: (data) => {
      // Show success toast
      toast.success(
        `Swap successful! Transaction: ${data.txHash.substring(0, 16)}...`
      );
    },
    onError: (error) => {
      // Show error toast
      toast.error(
        `Swap failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    },
  });

  const calculateSwapEstimate = useMemo(() => {
    if (!poolData) return { estimate: 0, fee: 0 };

    const amount = parseFloat(debouncedAmount) || 0;

    // Calculate based on direction
    if (direction === "ETH_TO_USDC") {
      const estimate = amount * poolData.token0Price;
      const fee = estimate * poolData.fee;
      return { estimate, fee };
    } else {
      const estimate = amount * poolData.token1Price;
      const fee = estimate * poolData.fee;
      return { estimate, fee };
    }
  }, [debouncedAmount, poolData, direction]);

  const { estimate: swapEstimate, fee: swapFee } = calculateSwapEstimate;

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSwap(parseFloat(swapAmount));
  };

  const toggleDirection = () => {
    setDirection((prev) =>
      prev === "ETH_TO_USDC" ? "USDC_TO_ETH" : "ETH_TO_USDC"
    );
    if (direction === "ETH_TO_USDC") {
      setSwapAmount("1000");
    } else {
      setSwapAmount("1");
    }
  };

  // Get token names based on direction
  const fromToken = direction === "ETH_TO_USDC" ? "ETH" : "USDC";
  const toToken = direction === "ETH_TO_USDC" ? "USDC" : "ETH";

  return (
    <div className="max-w-5xl mx-auto p-4 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-100 transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-slate-800">
            Swap {fromToken} to {toToken}
          </h2>
        </div>

        {isLoadingPool ? (
          <div className="text-center py-8 text-slate-600">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-32 bg-slate-200 rounded mb-4"></div>
              <div className="h-6 w-48 bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : poolError ? (
          <div className="text-center py-6 text-red-500 bg-red-50 rounded-lg">
            Error loading pool data. Please try again.
          </div>
        ) : (
          <form onSubmit={handleSwap}>
            <div className="md:flex md:gap-10">
              {/* Left panel - Swap inputs */}
              <div className="md:w-3/5">
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    <div className="flex items-center">
                      <div className="bg-slate-100 p-2 rounded-full mr-3">
                        <img
                          src={
                            fromToken === "USDC" ? "/usdc.png" : "/ethereum.svg"
                          }
                          alt={fromToken}
                          className="w-7 h-7"
                        />
                      </div>
                      From ({fromToken})
                    </div>
                  </label>
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    min="0.01"
                    step="0.01"
                    required
                    disabled={isSwapping}
                  />
                </div>

                {/* New arrow divider that's clickable */}
                <div className="flex justify-center my-6 relative">
                  <div className="absolute w-full border-t border-slate-200 top-1/2 -translate-y-1/2"></div>
                  <button
                    type="button"
                    onClick={toggleDirection}
                    disabled={isSwapping}
                    className="bg-white p-3 rounded-full z-10 shadow-sm border border-slate-100 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Switch direction"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6 text-indigo-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    <div className="flex items-center">
                      <div className="bg-slate-100 p-2 rounded-full mr-3">
                        <img
                          src={
                            toToken === "USDC" ? "/usdc.png" : "/ethereum.svg"
                          }
                          alt={toToken}
                          className="w-7 h-7"
                        />
                      </div>
                      To ({toToken})
                    </div>
                  </label>
                  <div className="w-full p-4 border border-slate-200 rounded-lg bg-slate-50 text-lg shadow-sm text-slate-700">
                    {swapEstimate.toFixed(2)}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 text-lg cursor-pointer font-medium transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100"
                  disabled={isSwapping || parseFloat(swapAmount) <= 0}
                >
                  {isSwapping ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing
                    </span>
                  ) : (
                    "Swap"
                  )}
                </button>
              </div>

              {/* Right panel - Transaction details */}
              <div className="md:w-2/5 mt-8 md:mt-0 p-6 bg-white rounded-lg shadow-md border border-slate-100">
                <h3 className="font-medium mb-4 text-slate-800 text-lg">
                  Transaction Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-600">Exchange Rate:</span>
                    <span className="font-medium text-slate-800">
                      {direction === "ETH_TO_USDC"
                        ? `1 ETH = ${poolData?.token0Price.toFixed(2)} USDC`
                        : `1 USDC = ${poolData?.token1Price.toFixed(6)} ETH`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-600">Fee:</span>
                    <span className="font-medium text-slate-800">
                      {swapFee.toFixed(2)} {toToken} (
                      {((poolData?.fee || 0) * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-slate-600">24h Volume:</span>
                    <span className="font-medium text-slate-800">
                      ${((poolData?.volumeUSD || 0) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Data Age:</span>
                    <span className="font-medium text-slate-800">
                      {poolData?.timestampUTC
                        ? getTimeSince(poolData.timestampUTC, currentTime)
                        : "just now"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
