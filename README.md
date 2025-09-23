# open-philsys

Developer-focused toolkit for integrating Philippine National ID (PhilSys) QR verification. Built on Next.js with a mobile-first UI and server APIs that mirror the official PhilSys flows—so you can embed scanning and verification into your own applications quickly.

<center>
  <img width="1254" height="1074" alt="CleanShot 2025-09-23 at 19 39 24@2x" src="https://github.com/user-attachments/assets/7dbaaf01-af7a-4865-ba03-ddfcbd2bea37" />
</center>

## What You Get

- **Unified verification pipeline** – Detect Version 1 legacy PhilIDs and Version 3 ePhilIDs, perform signature checks, and normalize the data.
- **Server proxy to PhilSys** – `/api/verify` forwards requests to `https://verify.philsys.gov.ph/api/verify` with the required headers, user agent, and cookies. Optional automated session bootstrapping.
- **Image-to-QR endpoint** – `/api/scan-image` accepts uploads, extracts QR codes (Jimp + jsQR), and routes them through the same verifier.
- **Pragmatic logging** – `[PhilSys]` console diagnostics for every decoding and verification step.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | Mobile-first verification console UI |
| `src/hooks/usePhilSysVerification.ts` | Client hook orchestrating legacy/ePhilID flows |
| `src/lib/philsys/verification.ts` | Signature validation, CBOR decoding, formatting helpers |
| `src/lib/philsys/session.ts` | PhilSys session bootstrapper and cookie cache |
| `src/app/api/verify/route.ts` | Proxy to the official PhilSys `/api/verify` |
| `src/app/api/scan-image/route.ts` | Image upload & QR decoding endpoint |
| `src/app/api/cose/route.ts` | CBOR decoding smoke test |

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

Type checking:

```bash
npx tsc --noEmit
```

## Environment Variables

Create `.env.local` (and `.env.production` for deployments) to override defaults:

| Variable | Description | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_PHILSYS_PUBLIC_KEY` | Base64 Ed25519 public key for legacy PhilID verification | Falls back to the original dump’s key if unset. |
| `PHILSYS_VERIFY_COOKIE` | Optional PhilSys cookie string | Include `__verify-token`, `_ga`, `_ga_9P2BTMLQFL`, etc. If omitted, the proxy will fetch the site once and cache issued cookies for 5 minutes. |

## REST Endpoints

### `POST /api/scan-image`

Primary integration point. Send a multipart form with an image then the server extracts the QR code, runs the verification pipeline, and returns the result.

- **Form field** – `file` (required)
- **Response** – `{ qrString: string, result: VerificationResult }`

```bash
curl -X POST http://localhost:3000/api/scan-image \
  -F 'file=@/path/to/qr-photo.jpg'
```

### `POST /api/verify`

Forwards a normalized PhilID/ePhilID payload to the official PhilSys verifier.

```bash
curl -X POST http://localhost:3000/api/verify \
  -H 'Content-Type: application/json' \
  -d '{"d":"2022-05-11","i":"PSA","img":"","sb":{"BF":"[6,3]","DOB":"2003-05-27","PCN":"2795801750683042","POB":"City of Cabanatuan,Nueva Ecija","fn":"JARIEL","ln":"QUE","mn":"ATIENZA","s":"Male","sf":""}}'
```

### `POST /api/cose`

Quick CBOR sanity check—useful for gating requests before going upstream. Returns boolean JSON.

## Verification Pipeline

1. **Detect version** (`checkVersion`) – JSON payload ⇒ v1 (legacy), otherwise v3 (ePhilID).
2. **Legacy PhilID**
   - Normalize payload (`formatVersion1`) and sanitize text.
   - Verify Ed25519 signature (`verifyEddsa`).
   - Format data for display (`formatLegacyData` / `formatDisplayData`).
   - Optional online check via `/api/verify` (results: ACTIVATED, REVOKED, etc.).
3. **ePhilID**
   - Strip prefix, base45 decode, inflate, and CBOR decode (`cborToJson`).
   - Validate country code, convert embedded image to base64.
   - Submit to `/api/verify` for activation status.
4. **Result packaging** – UI receives the structured data, statuses, and helper messages.

## Troubleshooting

- **HTTP 400 from `/api/verify`** – Cookie missing/expired. Supply a fresh `PHILSYS_VERIFY_COOKIE` or let the proxy bootstrap a new one (ensure outbound access).
- **`hashes.sha512 not set`** – Restart after `npm install`; the verification module wires `@noble/hashes` on load.
- **`/api/scan-image` returns 422** – QR not detected. Provide clearer/larger images with the code centered.
