import { processOfframp } from "@/lib/access-bank";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount, nairaAccountNumber } = body;

    // Validate input
    if (!walletAddress || !amount || !nairaAccountNumber) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, amount, nairaAccountNumber" },
        { status: 400 }
      );
    }

    // Validate wallet address format (Polygon/Ethereum address)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    // Validate account number format
    if (!/^\d{10}$/.test(nairaAccountNumber)) {
      return NextResponse.json(
        { error: "Invalid Access Bank account number. Must be 10 digits." },
        { status: 400 }
      );
    }

    // Process the offramp
    const result = await processOfframp({
      walletAddress,
      amount,
      nairaAccountNumber,
      bankCode: "044",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Offramp error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}