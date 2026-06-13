"use client";

import { useState, useEffect } from "react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  chainId?: string;
};

const POLYGON_CHAIN_ID = "0x89"; // 137 in hex

const switchToPolygon = async (provider: EthereumProvider): Promise<boolean> => {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_CHAIN_ID }],
    });
    return true;
  } catch (switchError: unknown) {
    const error = switchError as { code?: number };
    if (error.code === 4001) {
      console.log("User rejected network switch");
      return false;
    }
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: POLYGON_CHAIN_ID,
            chainName: "Polygon Mainnet",
            nativeCurrency: {
              name: "MATIC",
              symbol: "MATIC",
              decimals: 18,
            },
            rpcUrls: ["https://polygon-rpc.com"],
            blockExplorerUrls: ["https://polygonscan.com"],
          },
        ],
      });
      return true;
    } catch (addError: unknown) {
      console.error("Failed to add Polygon network:", addError);
      return false;
    }
  }
};

export default function OfframpForm() {
  const [walletAddress, setWalletAddress] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    transactionId?: string;
  } | null>(null);

  const connectWallet = async () => {
    setConnecting(true);
    setConnectionError(null);

    if (typeof window === "undefined") {
      setConnectionError("Window is not available");
      setConnecting(false);
      return;
    }

    const provider = (window as { ethereum?: EthereumProvider }).ethereum;
    if (!provider) {
      setConnectionError("MetaMask not detected. Please ensure the extension is installed and unlocked.");
      setConnecting(false);
      return;
    }

    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);

        const chainId = (await provider.request({ method: "eth_chainId" })) as string;
        if (chainId !== POLYGON_CHAIN_ID) {
          const switched = await switchToPolygon(provider);
          if (!switched) {
            setConnectionError("Please switch to Polygon Mainnet in MetaMask manually.");
          }
        }
      } else {
        setConnectionError("No accounts found. Please create or import a wallet.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to connect to MetaMask";
      setConnectionError(message);
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const provider = (window as { ethereum?: EthereumProvider }).ethereum;
    if (!provider) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        setWalletAddress("");
      } else if (!walletAddress) {
        setWalletAddress(accountsArray[0]);
      }
    };

    const handleChainChanged = (chainId: unknown) => {
      const id = chainId as string;
      if (id !== POLYGON_CHAIN_ID) {
        setConnectionError("Please switch to Polygon Mainnet in MetaMask.");
      } else {
        setConnectionError(null);
      }
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [walletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/offramp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          amount,
          nairaAccountNumber: accountNumber,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        message: "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAccount = async () => {
    if (!accountNumber || accountNumber.length !== 10) return;

    try {
      const response = await fetch(
        `/api/offramp/verify?accountNumber=${accountNumber}`,
        { method: "GET" }
      );
      const data = await response.json();

      if (data.success && data.account) {
        setAccountName(data.account.accountName);
      }
    } catch {
      setAccountName("");
    }
  };

  const nairaAmount = amount ? (parseFloat(amount) * 1500).toLocaleString() : "0";

  return (
    <div className="max-w-md mx-auto p-6 bg-neutral-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">
        Zimax Offramp - Polygon to Naira
      </h2>

      <div className="mb-4 p-3 bg-neutral-700 rounded">
        <p className="text-sm text-neutral-300">Exchange Rate</p>
        <p className="text-lg font-semibold text-white">
          1 ZIMAX = ₦1,500 NGN
        </p>
        {amount && (
          <p className="text-sm text-neutral-400 mt-1">
            You will receive: ₦{nairaAmount}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Polygon Wallet Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-3 py-2 bg-neutral-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={connectWallet}
              disabled={connecting}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white rounded transition text-sm"
            >
              {connecting ? "Connecting..." : walletAddress ? "Connected" : "Connect"}
            </button>
          </div>
          {connectionError && (
            <p className="text-xs text-red-400 mt-1">{connectionError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            ZIMAX Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 bg-neutral-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Access Bank Account Number
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
              setAccountName("");
            }}
            placeholder="10-digit account number"
            maxLength={10}
            className="w-full px-3 py-2 bg-neutral-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onBlur={verifyAccount}
            required
          />
          {accountName && (
            <p className="text-xs text-green-400 mt-1">Account: {accountName}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded transition"
        >
          {loading ? "Processing..." : "Initiate Offramp"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 p-3 rounded ${
            result.success ? "bg-green-900/50" : "bg-red-900/50"
          }`}
        >
          <p className="text-sm text-white">{result.message}</p>
          {result.transactionId && (
            <p className="text-xs text-neutral-300 mt-1">
              Transaction ID: {result.transactionId}
            </p>
          )}
        </div>
      )}
    </div>
  );
}