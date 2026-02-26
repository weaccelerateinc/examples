import { NextRequest } from "next/server";

import {
  checkIdempotency,
  getSession,
  protocolError,
  storeIdempotency,
  updateSession,
  validateHeaders,
  type ACPError,
  type UpdateRequest,
} from "../../_lib/store";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const headerErr = validateHeaders(request.headers);
  if (headerErr) {
    return Response.json(headerErr satisfies ACPError, { status: 400 });
  }

  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    return Response.json(protocolError("not_found", "Checkout session not found", "$.checkout_session_id"), {
      status: 404,
    });
  }

  return Response.json(session, { status: 200 });
}

export async function POST(request: NextRequest, { params }: Params) {
  const headerErr = validateHeaders(request.headers);
  if (headerErr) {
    return Response.json(headerErr satisfies ACPError, { status: 400 });
  }

  const { id } = await params;
  const body = (await request.json()) as UpdateRequest;
  const idempotencyKey = request.headers.get("idempotency-key");
  const replay = checkIdempotency(`update_checkout_session:${id}`, idempotencyKey, body);
  if (replay) {
    return Response.json(replay.body, { status: replay.status });
  }

  const result = updateSession(id, body);
  if ("type" in result) {
    const status = result.code === "not_found" ? 404 : 400;
    return Response.json(result satisfies ACPError, { status });
  }

  storeIdempotency(`update_checkout_session:${id}`, idempotencyKey, body, 200, result);
  return Response.json(result, { status: 200 });
}
