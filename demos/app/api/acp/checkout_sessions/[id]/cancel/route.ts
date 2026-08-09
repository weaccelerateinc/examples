import { NextRequest } from "next/server";

import { cancelSession, validateHeaders, type ACPError, type CancelRequest } from "../../../_lib/store";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const headerErr = validateHeaders(request.headers);
  if (headerErr) {
    return Response.json(headerErr satisfies ACPError, { status: 400 });
  }

  const { id } = await params;

  let body: CancelRequest | undefined;
  try {
    const text = await request.text();
    body = text ? (JSON.parse(text) as CancelRequest) : undefined;
  } catch {
    return Response.json(
      {
        type: "invalid_request",
        code: "invalid_json",
        message: "Request body must be valid JSON",
      } satisfies ACPError,
      { status: 400 }
    );
  }

  const result = cancelSession(id, body);
  if ("type" in result) {
    const status = result.code === "not_found" ? 404 : 405;
    return Response.json(result satisfies ACPError, { status });
  }

  return Response.json(result, { status: 200 });
}
