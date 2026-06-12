export interface OfframpRequest {
  walletAddress: string;
  amount: string;
  nairaAccountNumber: string;
  bankCode: string;
}

export interface OfframpResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  status?: "pending" | "processing" | "completed" | "failed";
}

export interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

export interface ExchangeRate {
  usdcToNaira: number;
  lastUpdated: string;
}

export interface AccessBankConfig {
  apiKey: string;
  baseUrl: string;
  clientKey: string;
}

export const BANK_CODES: Record<string, string> = {
  ACCESS_BANK: "044",
  GTBANK: "058",
  FIRST_BANK: "011",
  ZENITH_BANK: "057",
  UBA: "033",
};