import { NextRequest } from "next/server";

import {
  checkIdempotency,
  createSession,
  storeIdempotency,
  validateHeaders,
  type ACPError,
  type CreateRequest,
} from "../_lib/store";

export async function POST(request: NextRequest) {
  const headerErr = validateHeaders(request.headers);
  if (headerErr) {
    return Response.json(headerErr satisfies ACPError, { status: 400 });
  }

  const body = (await request.json()) as CreateRequest;
  const idempotencyKey = request.headers.get("idempotency-key");
  const replay = checkIdempotency("create_checkout_session", idempotencyKey, body);
  if (replay) {
    return Response.json(replay.body, { status: replay.status });
  }

  const result = createSession(body);
  if ("type" in result) {
    return Response.json(result satisfies ACPError, { status: 400 });
  }

  storeIdempotency("create_checkout_session", idempotencyKey, body, 201, result);
  return Response.json(result, { status: 201 });
}
