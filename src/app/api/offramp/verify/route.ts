import { verifyBankAccount } from "@/lib/access-bank";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountNumber = searchParams.get("accountNumber");

  if (!accountNumber || !/^\d{10}$/.test(accountNumber)) {
    return NextResponse.json(
      { success: false, error: "Invalid account number" },
      { status: 400 }
    );
  }

  const account = await verifyBankAccount(accountNumber, "044");

  if (!account) {
    return NextResponse.json(
      { success: false, error: "Account not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    account,
  });
}