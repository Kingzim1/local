import type { BankAccount, OfframpRequest, OfframpResponse } from "@/types/offramp";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || "";
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || "";
const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";

const GATEWAY = process.env.PAYMENT_GATEWAY || "paystack";

export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string = "044"
): Promise<BankAccount | null> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.status && data.data) {
      return {
        accountNumber: data.data.account_number,
        accountName: data.data.account_name,
        bankCode: bankCode,
      };
    }
    return null;
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
  if (GATEWAY === "flutterwave") {
    return initiateFlutterwaveTransfer(
      accountNumber,
      amount,
      beneficiaryName,
      reference
    );
  }
  return initiatePaystackTransfer(
    accountNumber,
    amount,
    beneficiaryName,
    reference
  );
}

async function initiatePaystackTransfer(
  accountNumber: string,
  amount: number,
  beneficiaryName: string,
  reference: string
): Promise<{ success: boolean; transactionId?: string }> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transfer`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "nuban",
          name: beneficiaryName,
          account_number: accountNumber,
          bank_code: "044",
          amount: amount * 100, // Convert to kobo
          reference,
          currency: "NGN",
        }),
      }
    );

    const data = await response.json();
    if (response.ok && data.status) {
      return {
        success: true,
        transactionId: data.data?.reference,
      };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

async function initiateFlutterwaveTransfer(
  accountNumber: string,
  amount: number,
  beneficiaryName: string,
  reference: string
): Promise<{ success: boolean; transactionId?: string }> {
  try {
    const response = await fetch(
      `${FLUTTERWAVE_BASE_URL}/transfers`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: accountNumber,
          amount: amount,
          currency: "NGN",
          beneficiary_name: beneficiaryName,
          reference,
          narration: "Zimax Offramp",
          bank_code: "044",
        }),
      }
    );

    const data = await response.json();
    if (response.ok && data.status === "success") {
      return {
        success: true,
        transactionId: data.data?.id?.toString(),
      };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

export async function processOfframp(request: OfframpRequest): Promise<OfframpResponse> {
  const { walletAddress, amount, nairaAccountNumber } = request;

  // Verify the bank account via Paystack/Flutterwave
  const account = await verifyBankAccount(nairaAccountNumber, "044");

  if (!account) {
    return {
      success: false,
      message: "Invalid Access Bank account number",
    };
  }

  // Convert Zimax to Naira (placeholder rate: 1 Zimax = 1500 NGN)
  const zimaxAmount = parseFloat(amount);
  const nairaAmount = zimaxAmount * 1500;

  // Generate transaction reference
  const reference = `ZIMAX_${Date.now()}_${walletAddress.slice(0, 8)}`;

  // Initiate NGN transfer via payment gateway
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