import { NextRequest } from "next/server";

type ACPConfirmPayload = {
  processorToken: string;
  cartId?: string;
  amount?: string | number;
  currency?: string;
};

type ACPResultStatus = "authorized" | "declined";

type ACPResult = {
  id: string;
  status: ACPResultStatus;
  message?: string;
};

type ACPReport = {
  accelerateToken: string;
  transaction: {
    id: string;
    status: ACPResultStatus;
    amount: string;
    currency: string;
    processorResponseText: string;
  };
};

function normalizeAmount(amount: ACPConfirmPayload["amount"]): string {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return amount.toFixed(2);
  }
  if (typeof amount === "string" && amount.trim() !== "") {
    return amount;
  }
  return "65.40";
}

function buildMockResult(processorToken: string): ACPResult {
  const shouldDecline = /decline|fail|insufficient/i.test(processorToken);
  const id = `acp_mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  if (shouldDecline) {
    return {
      id,
      status: "declined",
      message: "ACP mock decline (token matched decline pattern)",
    };
  }

  return {
    id,
    status: "authorized",
  };
}

async function maybeReportToAccelerate(
  processorToken: string,
  result: ACPResult,
  amount: string,
  currency: string
): Promise<void> {
  if (!process.env.ACCELERATE_SERVER_URL || !process.env.ACCELERATE_WH_KEY) {
    return;
  }

  const reportBody: ACPReport = {
    accelerateToken: processorToken,
    transaction: {
      id: result.id,
      status: result.status,
      amount,
      currency,
      processorResponseText: result.message || "Authorized",
    },
  };

  try {
    await fetch(`${process.env.ACCELERATE_SERVER_URL}/reporting/acp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.ACCELERATE_WH_KEY,
      },
      body: JSON.stringify(reportBody),
    });
  } catch (error) {
    console.warn("[acp] unable to report transaction to Accelerate", error);
  }
}

export async function POST(request: NextRequest) {
  const data = (await request.json()) as ACPConfirmPayload;

  if (!data.processorToken) {
    return Response.json({ status: "declined", message: "Missing processorToken" }, { status: 400 });
  }

  // Default behavior is a local mock authorization so this route works without ACP credentials.
  const mockMode = process.env.ACP_MOCK_MODE !== "false";
  const amount = normalizeAmount(data.amount);
  const currency = data.currency || "USD";

  if (mockMode) {
    const result = buildMockResult(data.processorToken);
    await maybeReportToAccelerate(data.processorToken, result, amount, currency);

    return Response.json({
      status: result.status,
      token: result.id,
      message: result.message,
      mode: "mock",
    });
  }

  const acpApiUrl = process.env.ACP_API_URL;
  const acpApiKey = process.env.ACP_API_KEY;

  if (!acpApiUrl || !acpApiKey) {
    return Response.json(
      {
        status: "declined",
        message: "ACP API not configured. Set ACP_API_URL + ACP_API_KEY or enable ACP_MOCK_MODE.",
      },
      { status: 500 }
    );
  }

  const endpoint = `${acpApiUrl.replace(/\/$/, "")}/payments`;
  const acpResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${acpApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: data.processorToken,
      amount,
      currency,
      metadata: {
        cartId: data.cartId || "unknown",
      },
    }),
  });

  if (!acpResponse.ok) {
    const errorText = await acpResponse.text();
    return Response.json(
      {
        status: "declined",
        message: `[acp] upstream failed (${acpResponse.status}): ${errorText}`,
      },
      { status: 502 }
    );
  }

  const responseJson = (await acpResponse.json()) as {
    id?: string;
    transactionId?: string;
    status?: string;
    message?: string;
  };

  const result: ACPResult = {
    id: responseJson.transactionId || responseJson.id || `acp_${Date.now()}`,
    status: responseJson.status === "declined" ? "declined" : "authorized",
    message: responseJson.message,
  };

  await maybeReportToAccelerate(data.processorToken, result, amount, currency);

  return Response.json({
    status: result.status,
    token: result.id,
    message: result.message,
    mode: "passthrough",
  });
}
