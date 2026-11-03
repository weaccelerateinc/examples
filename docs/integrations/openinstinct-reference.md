---
description: Reference configuration for an agent platform using private messaging and its existing checkout browser.
---

# OpenInstinct configuration reference

OpenInstinct is an example of an agent platform that connects its existing browser and private customer conversation to Accelerate. Clients can implement the same boundaries with their own framework, supported browser connector, and messaging provider. Start with the general [agentic platforms guide](agentic-platforms.md).

This page describes the repository implementation. It does not inspect deployed secret values or establish that a deployment is qualified for live purchases. OpenInstinct uses an application-specific integration and a pinned SDK runtime with recorded compatibility patches. New clients should use the current npm SDK and partner starter instead of copying its vendored files.

The described pinned application predates the **published 0.11.0 customer-final-click release**. Do not treat its older submit integration as an implementation of the new contract. That migration requires the 0.11.0 SDK and a trusted customer-browser click callback; it is not established by this reference. The matching managed stack is deployed in sandbox. See [Purchase mode](purchase-mode.md).

## Backend configuration

OpenInstinct configures these integration values in its protected server environment:

| Setting | Purpose |
| --- | --- |
| `ACCELERATE_API_KEY` | Tenant API key for the managed checkout service. |
| `ACCELERATE_MERCHANT_ID` | Merchant UUID for the platform and environment. |
| `ACCELERATE_BASE_URL` | Managed-service origin. The default `https://accelerate-agent-sdk.vercel.app` uses the sandbox wallet environment. Real-money production requires the explicitly configured, validated production origin. |
| `BROWSER_USE_API_KEY` | Browser project key used by OpenInstinct's browser backend. This is specific to its selected provider. |
| `ACCELERATE_AGENT_BROWSER_USE_EXTENSION_ID` | Approved extension upload ID in that browser project. |
| `ACCELERATE_AGENT_BROWSER_USE_EXTENSION_SHA256` | Exact ZIP checksum from the verified upload record. |
| `ACCELERATE_AGENT_BROWSER_USE_EXTENSION_VERSION` | Approved installed manifest version. |
| `LINQ_CONNECTOR` | Existing Linq connection used for the private iMessage channel. |

The application also needs its existing authentication, database, and encrypted-state configuration. These systems provide the verified customer, workspace ownership, browser reservation, and private conversation binding.

The ordinary `AccelerateClient` and separate `AcceleratePrivateChatClient` use the same Accelerate key and Merchant ID. The private client is called only by trusted server handlers. Its OTP/CVV reply methods are absent from the agent's tool schema.

Source references: [configuration](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/shared/accelerate/config.ts), [environment validation](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/shared/environment/env.ts), and [SDK provenance](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/docs/vendor/accelerate-agent-sdk/provenance.json).

## Browser setup and attachment

OpenInstinct creates its browser before shopping. Its provider request installs the configured Accelerate extension and sets `enableRecording: false`. For payment attachment, it uses an ephemeral browser. It checks the approved installation, extension runtime, customer/workspace ownership, current document, and remaining browser lifetime.

The agent receives an opaque session ID. Provider keys and connection URLs remain in the backend. The cart, cookies, merchant login, and checkout stay in that same session.

At payment:

1. The coordinator invokes its application-specific `accelerate_wallet_start` tool with the owned browser session and exact checkout URL.
2. The backend checks authenticated ownership and durably reserves the browser for payment. It blocks new ordinary browser operations and drains existing operations.
3. It disconnects the cached ordinary browser executor and checks the current document again.
4. It creates the Accelerate checkout with `interaction_mode: 'chat'`, `approval_policy: 'after_fill'`, `fill_after_verification: true`, and the existing browser binding.
5. It requires the service to acknowledge `fill_after_verification: true` before starting private verification.

OpenInstinct's browser binding uses `provider: 'browser_use'` and `custody_mode: 'customer_backend_trusted'`. A different client uses its own provisioned connector, as shown in [Connect your existing browser](agentic-platforms.md#connect-your-existing-browser).

The workspace's **Use Accelerate by default** setting controls payment-method selection. It does not approve a purchase or bypass private verification.

Source references: [browser setup](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/docs/browser-use.md), [browser creation](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/agent/subagents/browser-agent/lib/browser-use.ts), and [managed checkout orchestration](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/agent/lib/accelerate/managed.ts).

## Private iMessage replies

OpenInstinct handles sensitive messages before the framework constructs chat history or invokes the model:

1. Its webhook verifier authenticates the trusted Vercel forwarder with OIDC.
2. It maps the sender's phone to a verified application user and resolves the direct conversation. Group, unknown, or unrelated conversations cannot advance the checkout.
3. Under the authenticated checkout lock, the private handler sends the reply to `AcceleratePrivateChatClient.chat.reply`. The request includes the existing customer/workspace/conversation binding and the provider's stable message ID.
4. During an OTP or CVV challenge, the handler consumes the message privately, including invalid input and processing failures. It overwrites the mutable webhook body before downstream framework parsing and history caching.
5. If progress must reach the agent, the handler constructs a new event containing allowlisted identifiers and fixed safe progress text. It does not copy the sensitive reply into that event.

The integration also blocks provider-history and single-message backfill in its pinned messaging adapter. This prevents a later history request from retrieving a previously withheld code.

This ordering matters. An ordinary `onMessage` callback can run after a framework has cached the original message. Each client must place its sensitive handler before its own logging, history, tracing, queues, and model admission. A framework upgrade must preserve that ordering.

The iMessage provider and private server handler still receive the customer's raw reply. See [Private CVV and credential delivery](agentic-platforms-private-payments.md) for the complete data path and trust boundary.

Source references: [private webhook verifier](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/agent/channels/linq.ts), [bundled adapter regression test](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/tests/agent/channels/linq-bundled-adapter.test.ts), and [sensitive ingress notes](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/docs/accelerate-wallet.md#sensitive-ingress-and-retention-boundary).

## CVV, private review, and final submission

The worker starts private verification through its `accelerate_checkout` payment action. It then applies the selected address and verifies the merchant's final total. Its quote request repeats `fill_after_verification: true` and requires the matching service acknowledgement before private CVV collection.

When the customer replies with CVV, the private handler completes verification. The acknowledged v2 service continues the single armed fill in the backend. The reply returns `review_delivery_required`; the agent does not receive CVV or call a separate fill tool.

OpenInstinct calls `deliverPrivateCheckoutReview` from its private handler. It retrieves the masked PNG, checks the review metadata, sends the image and exact amount together through the native Linq transport, and acknowledges the actual sent receipt. A purchase decision has five minutes from that confirmed receipt. The customer's approval reply uses the provider-authenticated `sent_at` timestamp and optional reply-to message ID.

In this older integration, private approval still precedes a separate explicit submit request. The new contract disables direct executor submission and requires preflight → arm → customer host click → complete instead. The completion token stays in its SDK orchestrator. Do not enable purchases in the pinned app by changing a flag alone. For `sandbox_fill_only`, OpenInstinct cancels the same checkout after confirmed informational review delivery. An uncertain fill, delivery, cancellation, or click cannot authorize a new payment attempt.

Source references: [managed private reply and review handlers](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/agent/lib/accelerate/managed.ts), [native message receipts](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-platform-demo/agent/lib/linq/transport.ts), and [private payment flow](agentic-platforms-private-payments.md).
