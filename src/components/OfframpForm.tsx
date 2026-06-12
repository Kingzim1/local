"use client";

import { useState } from "react";

export default function OfframpForm() {
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    transactionId?: string;
  } | null>(null);

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
          1 USDC = ₦1,500 NGN
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
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-neutral-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            USDC Amount
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