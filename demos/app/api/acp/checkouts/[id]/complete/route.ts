import { NextRequest } from "next/server";

import {
  checkIdempotency,
  completeSession,
  storeIdempotency,
  validateHeaders,
  type ACPError,
  type CompleteRequest,
} from "../../../_lib/store";

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
  const body = (await request.json()) as CompleteRequest;

  const idempotencyKey = request.headers.get("idempotency-key");
  const replay = checkIdempotency(`complete_checkout_session:${id}`, idempotencyKey, body);
  if (replay) {
    return Response.json(replay.body, { status: replay.status });
  }

  const result = completeSession(id, body, request.nextUrl.origin);
  if ("type" in result) {
    const status = result.code === "not_found" ? 404 : 400;
    return Response.json(result satisfies ACPError, { status });
  }

  storeIdempotency(`complete_checkout_session:${id}`, idempotencyKey, body, 200, result);
  return Response.json(result, { status: 200 });
}
