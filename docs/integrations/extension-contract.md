---
description: Verify the extension artifact, live runtime, provider compatibility, and checkout qualification before payment use.
---

# Extension contract

Install the approved Accelerate extension through your platform's existing browser image, profile, or launch configuration before shopping starts. Accelerate supplies the ZIP and a release manifest approved for your connector and intended checkout use. Your platform keeps browser creation and the original shopping session.

The extension provides document-bound, one-use card filling. The backend and private executor enforce customer ownership, private CVV collection, review delivery, purchase approval, and cleanup. In source candidate 0.11.0, the customer's trusted browser backend performs the final physical purchase click. Installing the extension alone does not establish those controls or the new, unpublished and undeployed purchase contract.

## Trusted release manifest

Keep the manifest in protected backend configuration. It records:

| Field group | Meaning |
| --- | --- |
| Release status and version | Approved release identity and exact extension manifest version. |
| Artifact | ZIP format, exact SHA-256, and byte size. |
| Bridge | Protocol and runtime reporting requirements. |
| Capabilities | Manual card fill, document-bound single use, disabled autosave, no automatic submit, and maximum retention. |
| Compatibility | Allowed SDK versions and executor contract. |
| Qualifications | Provider and checkout scope supported by recorded acceptance evidence. |

For a generic provider, the approved manifest must cover `provider: 'connector'` and the intended checkout use. The packaged `approved-extension-releases/0.0.0.1.json` manifest covers the Browser Use sandbox demo baseline. It cannot qualify another provider simply because that provider installs the same ZIP.

Manifest validation checks trusted metadata. It is not a publisher signature or a substitute for provider and checkout qualification. Never accept release metadata from a model tool argument.

## Verify the ZIP before installation

```js
import { readFile } from 'node:fs/promises';
import {
  validateApprovedExtensionRelease,
  verifyApprovedExtensionArtifact,
} from '@weaccelerateinc/agent-sdk/approved-extension';

const release = validateApprovedExtensionRelease(
  JSON.parse(await readFile('/private/config/accelerate-extension-release.json', 'utf8')),
);
const zip = await readFile('/private/releases/accelerate-extension.zip');
verifyApprovedExtensionArtifact(zip, release);
```

These paths refer to files supplied through your trusted deployment process. Install the verified bytes using your browser's extension mechanism, then preserve the installation/upload record. A version string or successful upload does not prove which bytes are installed.

The [GitHub release assets](https://github.com/weaccelerateinc/accelerate-extension-downloads/releases/tag/extension-v0.0.0.1) include the approved baseline ZIP and checksum files. Coordinate the manifest and qualification for your own connector with Accelerate.

## Verify the live runtime

Before payment, the trusted host combines the installation record with live extension observations. `verifyApprovedExtensionRuntime` checks these against the approved manifest:

```js
import { verifyApprovedExtensionRuntime } from '@weaccelerateinc/agent-sdk/approved-extension';

verifyApprovedExtensionRuntime({
  extension_version: installedVersion,
  artifact_sha256: installationRecord.sha256,
  bridge_protocol: ready.bridge_protocol,
  success: ready.success,
  initialized: ready.initialized,
  wasmInitialized: ready.wasmInitialized,
  autosaveDisabled: ready.autosaveDisabled,
  boundedRetentionSupported: ready.boundedRetentionSupported,
  maximumRetentionMs: ready.maximumRetentionMs,
}, release, {
  executorContract: 'accelerate_manual_checkout_v1',
  provider: 'connector',
});
```

Your trusted browser integration supplies `installedVersion`, `installationRecord`, `ready`, and the approved `release` from the previous step. These must represent actual observations of the installed worker. The helper uses its installed SDK version by default; the approved manifest must include that version. Do not pass an older version to bypass compatibility or fill readiness flags with constants.

The verification helpers make no network requests. They do not install the extension or prove customer ownership, recording policy, sufficient browser lifetime, paused automation, or independent cleanup. The [browser connector](browser-connector-interface.md) and [private provider connector](provider-connector-contract.md) check those separately before private OTP/CVV collection.

## Fill and retention boundaries

The bridge restricts filling to the bound tab, document, and permitted payment frames. It supports one-use manual card fill and disables autosave. Its `automatic_submit: false` capability means that the extension does not click purchase. It does not mean that every checkout must be fill-only. Candidate 0.11.0 uses a separate customer-backend click after private approval; the Accelerate executor does not click. See [Purchase mode](purchase-mode.md). The extension's maximum advertised retention is 480,000 ms; checkout and authorization lifetimes remain separate limits.

The executor supplies transient credentials through its private background-worker call. The merchant's actual payment fields contain the native values during the allowed review/submit period. Display masking changes presentation; it does not encrypt those fields or revoke provider-owner access. See [Private CVV and credential delivery](agentic-platforms-private-payments.md).

## Release status and upgrades

The exact `0.0.0.1` baseline ZIP requires its checksum pin because historical packages reused that manifest version. Its legacy reporting exception applies only to that exact approved artifact. The `0.0.0.2` build remains a candidate and cannot replace an approved artifact until qualification is complete.

For an upgrade, qualify the new artifact with its provider and checkout scope, update new-session configuration, and let active sessions finish on their original release. Retain the previous artifact and installation for rollback. Do not replace an extension or browser during payment.

A successful synthetic test, upload, or SDK installation does not approve purchase submission. Extension compatibility, provider support, checkout layout, private review delivery, and purchase execution require their own evidence.

The approved manifest's demo qualification is its recorded baseline, not a runtime demo-domain filter in universal admission. Later sandbox merchant fills do not expand every provider's qualification or establish customer-click purchase support. See [Universal checkout rollout](universal-card-rollout.md).

For the underlying types and release policy, see the [SDK extension source reference](https://github.com/weaccelerateinc/accelerate/blob/main/products/agent-sdk/docs/extension-release-contract.md). Return to [Agentic platforms](agentic-platforms.md) for setup.
