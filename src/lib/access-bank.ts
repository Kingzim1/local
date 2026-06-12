import type { BankAccount, OfframpRequest, OfframpResponse } from "@/types/offramp";

const ACCESS_BANK_BASE_URL = process.env.ACCESS_BANK_API_URL || "https://api.accessbankplc.com";
const ACCESS_BANK_API_KEY = process.env.ACCESS_BANK_API_KEY || "";
const ACCESS_BANK_CLIENT_KEY = process.env.ACCESS_BANK_CLIENT_KEY || "";

export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string = "044"
): Promise<BankAccount | null> {
  try {
    const response = await fetch(
      `${ACCESS_BANK_BASE_URL}/api/v1/account/lookup?accountNumber=${accountNumber}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${ACCESS_BANK_API_KEY}`,
          "Client-Key": ACCESS_BANK_CLIENT_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      bankCode: data.bankCode || bankCode,
    };
  } catch {
    return null;
  }
}

export async function initiateTransfer(
  accountNumber: string,
  amount: number,
  beneficiaryName: string,
  reference: string
): Promise<{ success: boolean; transactionId?: string }> {
  try {
    const response = await fetch(
      `${ACCESS_BANK_BASE_URL}/api/v1/transfer/instant`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_BANK_API_KEY}`,
          "Client-Key": ACCESS_BANK_CLIENT_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beneficiaryAccount: accountNumber,
          amount: amount * 100, // Convert to kobo
          beneficiaryName,
          reference,
          currency: "NGN",
        }),
      }
    );

    const data = await response.json();
    return {
      success: response.ok && data.status === "success",
      transactionId: data.transactionId,
    };
  } catch {
    return { success: false };
  }
}

export async function processOfframp(request: OfframpRequest): Promise<OfframpResponse> {
  const { walletAddress, amount, nairaAccountNumber } = request;

  // Verify the bank account with Access Bank
  const account = await verifyBankAccount(nairaAccountNumber, "044");

  if (!account) {
    return {
      success: false,
      message: "Invalid Access Bank account number",
    };
  }

  // Convert USDC to Naira (assuming 1 USDC = 1500 NGN as placeholder rate)
  const usdcAmount = parseFloat(amount);
  const nairaAmount = usdcAmount * 1500;

  // Generate transaction reference
  const reference = `ZIMAX_${Date.now()}_${walletAddress.slice(0, 8)}`;

  // Initiate NGN transfer via Access Bank
  const transfer = await initiateTransfer(
    account.accountNumber,
    nairaAmount,
    account.accountName,
    reference
  );

  if (!transfer.success) {
    return {
      success: false,
      message: "Failed to initiate Naira transfer",
    };
  }

  return {
    success: true,
    transactionId: transfer.transactionId,
    message: "Offramp initiated successfully. Funds will be credited shortly.",
    status: "pending",
  };
}