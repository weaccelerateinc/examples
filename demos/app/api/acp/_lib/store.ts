import { randomUUID } from "crypto";

export const ACP_VERSION = "2026-01-30";

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export type ACPError = {
  type: "invalid_request" | "request_not_idempotent" | "processing_error" | "service_unavailable";
  code: string;
  message: string;
  param?: string;
};

export type ACPItemInput = {
  id: string;
  name?: string;
  unit_amount?: number;
  quantity?: number;
};

export type ACPTotal = {
  type: "items_base_amount" | "subtotal" | "tax" | "fulfillment" | "total";
  display_text: string;
  amount: number;
};

export type ACPLineItem = {
  id: string;
  item: {
    id: string;
  };
  quantity: number;
  name?: string;
  unit_amount?: number;
  totals: ACPTotal[];
};

export type ACPAddress = {
  name: string;
  line_one: string;
  line_two?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
};

export type ACPFulfillmentOption = {
  type: "shipping";
  id: string;
  title: string;
  description?: string;
  carrier?: string;
  totals: ACPTotal[];
};

export type ACPSelectedFulfillmentOption = {
  type: "shipping" | "digital" | "pickup" | "local_delivery";
  option_id: string;
  item_ids: string[];
};

export type ACPMessage =
  | {
      type: "info";
      severity?: "info" | "low" | "medium" | "high" | "critical";
      content_type: "plain" | "markdown";
      content: string;
      param?: string;
    }
  | {
      type: "error";
      code:
        | "missing"
        | "invalid"
        | "out_of_stock"
        | "payment_declined"
        | "requires_3ds"
        | "requires_sign_in"
        | "unsupported"
        | "not_found"
        | "conflict"
        | "expired"
        | "intervention_required";
      severity?: "info" | "low" | "medium" | "high" | "critical";
      content_type: "plain" | "markdown";
      content: string;
      param?: string;
    };

export type ACPOrder = {
  id: string;
  checkout_session_id: string;
  permalink_url: string;
  order_number?: string;
  status?: "confirmed" | "processing" | "shipped" | "delivered";
};

export type ACPCheckoutSession = {
  id: string;
  protocol: {
    version: string;
  };
  capabilities: Record<string, JSONValue>;
  buyer?: Record<string, JSONValue>;
  status:
    | "incomplete"
    | "not_ready_for_payment"
    | "requires_escalation"
    | "authentication_required"
    | "ready_for_payment"
    | "pending_approval"
    | "complete_in_progress"
    | "completed"
    | "canceled"
    | "in_progress"
    | "expired";
  currency: string;
  line_items: ACPLineItem[];
  fulfillment_details?: Record<string, JSONValue>;
  fulfillment_options: ACPFulfillmentOption[];
  selected_fulfillment_options?: ACPSelectedFulfillmentOption[];
  totals: ACPTotal[];
  messages: ACPMessage[];
  links: { type: string; url: string; title?: string }[];
  metadata?: Record<string, JSONValue>;
  created_at: string;
  updated_at: string;
  order?: ACPOrder;
};

export type CreateRequest = {
  buyer?: Record<string, JSONValue>;
  line_items?: ACPItemInput[];
  currency?: string;
  fulfillment_details?: Record<string, JSONValue>;
  capabilities?: Record<string, JSONValue>;
  metadata?: Record<string, JSONValue>;
};

export type UpdateRequest = {
  buyer?: Record<string, JSONValue>;
  line_items?: ACPItemInput[];
  fulfillment_details?: Record<string, JSONValue>;
  selected_fulfillment_options?: ACPSelectedFulfillmentOption[];
  metadata?: Record<string, JSONValue>;
};

export type CompleteRequest = {
  buyer?: Record<string, JSONValue>;
  payment_data?: {
    handler_id?: string;
    instrument?: {
      type?: string;
      credential?: {
        type?: string;
        token?: string;
      };
    };
    purchase_order_number?: string;
  };
  authentication_result?: Record<string, JSONValue>;
};

export type CancelRequest = {
  intent_trace?: Record<string, JSONValue>;
};

const sessions = new Map<string, ACPCheckoutSession>();
const idempotencyStore = new Map<string, { fingerprint: string; status: number; body: unknown }>();

function nowIso(): string {
  return new Date().toISOString();
}

function toMinor(amount: number): number {
  return Math.round(amount);
}

function stableStringify(input: unknown): string {
  if (input === null || typeof input !== "object") {
    return JSON.stringify(input);
  }
  if (Array.isArray(input)) {
    return `[${input.map((item) => stableStringify(item)).join(",")}]`;
  }
  const obj = input as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(",")}}`;
}

function unitAmount(itemId: string): number {
  let hash = 0;
  for (let i = 0; i < itemId.length; i += 1) {
    hash = (hash * 31 + itemId.charCodeAt(i)) >>> 0;
  }
  return 1200 + (hash % 3600);
}

function toLineItem(item: ACPItemInput, idx: number): ACPLineItem {
  const quantity = Math.max(1, item.quantity || 1);
  const unit = item.unit_amount ?? unitAmount(item.id);
  const itemsBase = toMinor(unit * quantity);
  const tax = toMinor(itemsBase * 0.085);
  const subtotal = itemsBase;
  const total = subtotal + tax;

  return {
    id: `line_item_${idx + 1}`,
    item: {
      id: item.id,
    },
    quantity,
    name: item.name,
    unit_amount: unit,
    totals: [
      { type: "items_base_amount", display_text: "Base Amount", amount: itemsBase },
      { type: "subtotal", display_text: "Subtotal", amount: subtotal },
      { type: "tax", display_text: "Tax", amount: tax },
      { type: "total", display_text: "Total", amount: total },
    ],
  };
}

function calculateCartTotals(lineItems: ACPLineItem[], fulfillmentAmount: number): ACPTotal[] {
  const itemsBase = lineItems.reduce(
    (sum, li) => sum + (li.totals.find((t) => t.type === "items_base_amount")?.amount || 0),
    0
  );
  const subtotal = lineItems.reduce((sum, li) => sum + (li.totals.find((t) => t.type === "subtotal")?.amount || 0), 0);
  const tax = lineItems.reduce((sum, li) => sum + (li.totals.find((t) => t.type === "tax")?.amount || 0), 0);
  const total = subtotal + tax + fulfillmentAmount;

  return [
    { type: "items_base_amount", display_text: "Item(s) total", amount: itemsBase },
    { type: "subtotal", display_text: "Subtotal", amount: subtotal },
    { type: "tax", display_text: "Tax", amount: tax },
    { type: "fulfillment", display_text: "Fulfillment", amount: fulfillmentAmount },
    { type: "total", display_text: "Total", amount: total },
  ];
}

function defaultFulfillmentOptions(): ACPFulfillmentOption[] {
  return [
    {
      type: "shipping",
      id: "fulfillment_option_standard",
      title: "Standard Shipping",
      description: "Arrives in 3-5 business days",
      carrier: "USPS",
      totals: [{ type: "fulfillment", display_text: "Shipping", amount: 500 }],
    },
    {
      type: "shipping",
      id: "fulfillment_option_express",
      title: "Express Shipping",
      description: "Arrives in 1-2 business days",
      carrier: "USPS",
      totals: [{ type: "fulfillment", display_text: "Express Shipping", amount: 1200 }],
    },
  ];
}

export function protocolError(code: string, message: string, param?: string): ACPError {
  return {
    type: "invalid_request",
    code,
    message,
    ...(param ? { param } : {}),
  };
}

export function validateHeaders(headers: Headers): ACPError | null {
  const authExpected = process.env.ACP_BEARER_TOKEN;
  if (authExpected) {
    const auth = headers.get("authorization") || "";
    if (auth !== `Bearer ${authExpected}`) {
      return {
        type: "invalid_request",
        code: "unauthorized",
        message: "Missing or invalid bearer token",
        param: "$.headers.Authorization",
      };
    }
  }

  const apiVersion = headers.get("api-version");
  if (!apiVersion) {
    return {
      type: "invalid_request",
      code: "missing_required_field",
      message: "The 'API-Version' header is required",
      param: "$.headers.API-Version",
    };
  }

  if (apiVersion !== ACP_VERSION) {
    return {
      type: "invalid_request",
      code: "unsupported_api_version",
      message: `Unsupported API-Version '${apiVersion}'. Expected '${ACP_VERSION}'.`,
      param: "$.headers.API-Version",
    };
  }

  return null;
}

export function checkIdempotency(operationKey: string, idempotencyKey: string | null, body: unknown) {
  if (!idempotencyKey) return null;

  const key = `${operationKey}:${idempotencyKey}`;
  const fingerprint = stableStringify(body);
  const prior = idempotencyStore.get(key);
  if (!prior) return null;

  if (prior.fingerprint !== fingerprint) {
    return {
      status: 409,
      body: {
        type: "request_not_idempotent",
        code: "idempotency_key_reuse_mismatch",
        message: "Idempotency-Key was reused with a different request payload",
      } satisfies ACPError,
    };
  }

  return {
    status: prior.status,
    body: prior.body,
  };
}

export function storeIdempotency(
  operationKey: string,
  idempotencyKey: string | null,
  requestBody: unknown,
  status: number,
  responseBody: unknown
) {
  if (!idempotencyKey) return;

  const key = `${operationKey}:${idempotencyKey}`;
  idempotencyStore.set(key, {
    fingerprint: stableStringify(requestBody),
    status,
    body: responseBody,
  });
}

export function createSession(request: CreateRequest): ACPCheckoutSession | ACPError {
  if (!request.line_items || request.line_items.length === 0) {
    return protocolError("missing_required_field", "The 'line_items' field is required", "$.line_items");
  }
  if (!request.currency) {
    return protocolError("missing_required_field", "The 'currency' field is required", "$.currency");
  }
  if (!request.capabilities) {
    return protocolError("missing_required_field", "The 'capabilities' field is required", "$.capabilities");
  }

  const id = `checkout_session_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const lineItems = request.line_items.map((item, idx) => toLineItem(item, idx));
  const fulfillmentOptions = defaultFulfillmentOptions();
  const selected = [
    {
      type: "shipping" as const,
      option_id: fulfillmentOptions[0].id,
      item_ids: lineItems.map((li) => li.id),
    },
  ];
  const shipping = fulfillmentOptions[0].totals[0].amount;
  const now = nowIso();

  const session: ACPCheckoutSession = {
    id,
    protocol: { version: ACP_VERSION },
    capabilities: request.capabilities,
    buyer: request.buyer,
    status: "ready_for_payment",
    currency: request.currency.toLowerCase(),
    line_items: lineItems,
    fulfillment_details: request.fulfillment_details,
    fulfillment_options: fulfillmentOptions,
    selected_fulfillment_options: selected,
    totals: calculateCartTotals(lineItems, shipping),
    messages: [],
    links: [
      { type: "terms_of_use", url: "https://merchant.example.com/legal/terms" },
      { type: "return_policy", url: "https://merchant.example.com/legal/returns" },
    ],
    metadata: request.metadata,
    created_at: now,
    updated_at: now,
  };

  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): ACPCheckoutSession | null {
  return sessions.get(id) || null;
}

export function updateSession(id: string, request: UpdateRequest): ACPCheckoutSession | ACPError {
  const existing = sessions.get(id);
  if (!existing) {
    return protocolError("not_found", "Checkout session not found", "$.checkout_session_id");
  }

  const next: ACPCheckoutSession = {
    ...existing,
    updated_at: nowIso(),
    buyer: request.buyer || existing.buyer,
    fulfillment_details: request.fulfillment_details || existing.fulfillment_details,
    metadata: request.metadata || existing.metadata,
  };

  if (request.line_items) {
    next.line_items = request.line_items.map((item, idx) => toLineItem(item, idx));
  }

  if (request.selected_fulfillment_options && request.selected_fulfillment_options.length > 0) {
    const invalid = request.selected_fulfillment_options.find(
      (selected) => !next.fulfillment_options.find((option) => option.id === selected.option_id)
    );
    if (invalid) {
      return protocolError(
        "invalid_fulfillment_option",
        `Unknown fulfillment option '${invalid.option_id}'`,
        "$.selected_fulfillment_options"
      );
    }
    next.selected_fulfillment_options = request.selected_fulfillment_options;
  }

  const chosenOptionId = next.selected_fulfillment_options?.[0]?.option_id || next.fulfillment_options[0].id;
  const chosen = next.fulfillment_options.find((option) => option.id === chosenOptionId) || next.fulfillment_options[0];
  const shipping = chosen.totals[0].amount;
  next.totals = calculateCartTotals(next.line_items, shipping);

  sessions.set(id, next);
  return next;
}

export function completeSession(
  id: string,
  request: CompleteRequest,
  origin: string
): ACPCheckoutSession | ACPError {
  const existing = sessions.get(id);
  if (!existing) {
    return protocolError("not_found", "Checkout session not found", "$.checkout_session_id");
  }

  if (existing.status === "canceled") {
    return protocolError("invalid_status", "Checkout session is already canceled", "$.status");
  }
  if (existing.status === "completed") {
    return existing;
  }

  const payment = request.payment_data;
  const hasInstrument = Boolean(payment?.handler_id && payment.instrument?.credential?.token);
  const hasPurchaseOrder = Boolean(payment?.purchase_order_number);
  if (!payment || (!hasInstrument && !hasPurchaseOrder)) {
    return protocolError(
      "missing_required_field",
      "The 'payment_data' field requires either handler_id+instrument or purchase_order_number",
      "$.payment_data"
    );
  }

  const token = payment.instrument?.credential?.token || payment.purchase_order_number || "";
  if (/requires3ds|3ds_required/i.test(token) && !request.authentication_result) {
    return protocolError(
      "requires_3ds",
      "This checkout session requires issuer authentication. The request must include 'authentication_result' as provided by the issuer authentication flow.",
      "$.authentication_result"
    );
  }

  if (/decline|fail|insufficient/i.test(token)) {
    return protocolError("payment_declined", "Payment was declined by the processor", "$.payment_data");
  }

  const orderId = `ord_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const completed: ACPCheckoutSession = {
    ...existing,
    buyer: request.buyer || existing.buyer,
    status: "completed",
    updated_at: nowIso(),
    messages: [
      {
        type: "info",
        content_type: "plain",
        content: "Checkout session completed successfully.",
      },
    ],
    order: {
      id: orderId,
      checkout_session_id: existing.id,
      permalink_url: `${origin}/orders/${orderId}`,
      order_number: `ORD-${Date.now()}`,
      status: "confirmed",
    },
  };

  sessions.set(id, completed);
  return completed;
}

export function cancelSession(id: string, request?: CancelRequest): ACPCheckoutSession | ACPError {
  void request;
  const existing = sessions.get(id);
  if (!existing) {
    return protocolError("not_found", "Checkout session not found", "$.checkout_session_id");
  }

  if (existing.status === "completed") {
    return protocolError("invalid_status", "Completed checkout sessions cannot be canceled", "$.status");
  }

  const canceled: ACPCheckoutSession = {
    ...existing,
    status: "canceled",
    updated_at: nowIso(),
    messages: [
      {
        type: "info",
        content_type: "plain",
        content: "Checkout session has been canceled.",
      },
    ],
  };

  sessions.set(id, canceled);
  return canceled;
}
