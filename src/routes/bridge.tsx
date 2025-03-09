import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  AxelarQueryAPI,
  CHAINS,
  Environment,
} from "@axelar-network/axelarjs-sdk";
import { getTimeSince } from "../utils";

export const Route = createFileRoute("/bridge")({
  component: Bridge,
});

const axelarQuery = new AxelarQueryAPI({
  // @dev I know the PDF mentioned testnet, I've used mainnet for The Graph because
  // that was what I could find and so for consistency I'll use mainnet across the app.
  // Obviously in a real app you'd have this configured through env vars so you can have
  // staging and production deployments, etc.
  environment: Environment.MAINNET,
});

/**
 * Fetches the bridge fee estimate from Axelar
 */
async function estimateBridgeFee(): Promise<{
  fee: string;
  timestampUTC: string;
}> {
  const gasFee = await axelarQuery.estimateGasFee(
    CHAINS.MAINNET.ETHEREUM,
    CHAINS.MAINNET.POLYGON,
    300_000
  );

  if (typeof gasFee === "string") {
    const feeInEth = parseFloat(gasFee) / 1e18;
    return {
      fee: feeInEth.toFixed(6),
      timestampUTC: new Date().toUTCString(),
    };
  } else {
    // For the sake of the take-home I am expecting the SDK to return a string
    // unless I specifically ask for the detailed response so I throw an error
    // if I don't get what I expect.
    throw new Error("Invalid gas fee response");
  }
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
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update the current time every second to show accurate data age
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { data: bridgeEstimate, isLoading: isEstimating } = useQuery({
    queryKey: ["bridgeFee", amount],
    queryFn: async () => {
      const result = await estimateBridgeFee();
      return result;
    },
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
    <div className="max-w-5xl mx-auto p-4 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-100 transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-slate-800">Bridge USDC</h2>
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
            Ethereum → Polygon
          </div>
        </div>

        <div className="md:flex md:gap-10">
          {/* Left panel - Bridge inputs */}
          <div className="md:w-3/5">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-slate-700">
                <div className="flex items-center">
                  <div className="bg-slate-100 p-2 rounded-full mr-3">
                    <img
                      src="/ethereum.svg"
                      alt="Ethereum"
                      className="w-7 h-7"
                    />
                  </div>
                  From (Ethereum)
                </div>
              </label>
              <div className="flex justify-between items-center w-full p-4 border border-slate-200 rounded-lg bg-slate-50 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-2/3 bg-transparent focus:outline-none text-lg"
                  placeholder="0.0"
                  min="0.01"
                  step="0.01"
                  disabled={bridgeInProgress}
                />
                <div className="flex items-center space-x-2 bg-white py-2 px-3 rounded-lg shadow-sm">
                  <img src="/usdc.png" alt="USDC" className="w-6 h-6" />
                  <span className="font-medium text-slate-800">USDC</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center my-6 relative">
              <div className="absolute w-full border-t border-slate-200 top-1/2 -translate-y-1/2"></div>
              <div className="bg-white p-2 rounded-full z-10 shadow-sm border border-slate-100">
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
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-slate-700">
                <div className="flex items-center">
                  <div className="bg-slate-100 p-2 rounded-full mr-3">
                    <img src="/polygon.svg" alt="Polygon" className="w-7 h-7" />
                  </div>
                  To (Polygon)
                </div>
              </label>
              <div className="w-full p-4 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-center shadow-sm text-lg">
                <span className="text-slate-700">{amount || "0.0"}</span>
                <div className="flex items-center space-x-2 bg-white py-2 px-3 rounded-lg shadow-sm">
                  <img src="/usdc.png" alt="USDC" className="w-6 h-6" />
                  <span className="font-medium text-slate-800">USDC</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBridge}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 text-lg font-medium transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100 cursor-pointer"
              disabled={
                isEstimating ||
                bridgeInProgress ||
                !amount ||
                parseFloat(amount) <= 0
              }
            >
              {bridgeInProgress ? (
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
                  Bridging
                </span>
              ) : isEstimating ? (
                "Loading..."
              ) : (
                "Bridge USDC"
              )}
            </button>
          </div>

          {/* Right panel - Bridge details */}
          <div className="md:w-2/5 mt-8 md:mt-0 p-6 bg-white rounded-lg shadow-md border border-slate-100">
            <h3 className="font-medium mb-4 text-slate-800 text-lg">
              Bridge Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-600">Bridge Fee:</span>
                <span className="font-medium text-slate-800">
                  {isEstimating ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin mr-2 h-4 w-4 text-indigo-500"
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
                      Estimating...
                    </span>
                  ) : bridgeEstimate ? (
                    `${bridgeEstimate.fee} ETH`
                  ) : (
                    "0.00 ETH"
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-600">Data Age:</span>
                <span className="font-medium text-slate-800">
                  {bridgeEstimate
                    ? getTimeSince(bridgeEstimate.timestampUTC, currentTime)
                    : "just now"}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="text-sm text-slate-500 flex items-center justify-center">
                Powered by Axelar Network
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
