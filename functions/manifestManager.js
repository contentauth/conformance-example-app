import { Builder } from "@contentauth/c2pa-node";

// The official C2PA trust lists and the SSL.com C2PA timestamp authority.
const C2PA_TRUST_LIST_URL =
  "https://raw.githubusercontent.com/c2pa-org/conformance-public/main/trust-list/C2PA-TRUST-LIST.pem";
const C2PA_TSA_TRUST_LIST_URL =
  "https://raw.githubusercontent.com/c2pa-org/conformance-public/main/trust-list/C2PA-TSA-TRUST-LIST.pem";
const TIMESTAMP_AUTHORITY_URL = "http://ts-c2pa.ssl.com/ecc";

// Assertions we author ourselves are marked "created" in the claim;
// everything else stays "gathered".
const CREATED_ASSERTION_LABELS = ["c2pa.actions", "c2pa.thumbnail.claim", "c2pa.ingredient"];

let cachedSettings;

// SDK settings, using the snake_case keys of the underlying Rust SDK:
// validate ingredients and timestamps against the C2PA trust lists, and mark
// our actions, thumbnail, and ingredient assertions as created assertions.
// Our own certificate chain is added as a user anchor so that re-uploading an
// image this app signed validates too.
async function loadSettings(ourCertificateChainPem) {
  if (!cachedSettings) {
    const [contentTrustList, tsaTrustList] = await Promise.all([
      fetchPem(C2PA_TRUST_LIST_URL),
      fetchPem(C2PA_TSA_TRUST_LIST_URL),
    ]);
    cachedSettings = {
      trust: {
        trust_anchors: contentTrustList + tsaTrustList,
        user_anchors: ourCertificateChainPem,
      },
      verify: { verify_trust: true, verify_timestamp_trust: true },
      builder: { created_assertion_labels: CREATED_ASSERTION_LABELS },
    };
  }
  return cachedSettings;
}

async function fetchPem(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch ${url}: ${response.status}`);
  }
  return await response.text();
}

// Builds and signs the C2PA manifest for the cropped image. The original
// upload goes in as a parentOf ingredient, and the "edit" intent makes the
// SDK add the c2pa.opened action with that ingredient as its parameter.
export async function signWithManifest({ title, originalJpeg, croppedJpeg, editActions, signer }) {
  const builder = Builder.withJson(
    {
      title,
      claim_version: 2,
      claim_generator_info: [{ name: "CropSign", version: "1.0.0" }],
    },
    await loadSettings(signer.certificateChainPem),
  );

  builder.setIntent("edit");
  await builder.addIngredient(
    JSON.stringify({ title, format: "image/jpeg", relationship: "parentOf" }),
    { buffer: originalJpeg, mimeType: "image/jpeg" },
  );
  for (const action of editActions) {
    builder.addAction(JSON.stringify(action));
  }

  const signed = { buffer: null };
  await builder.signConfigAsync(
    signer.sign,
    {
      alg: signer.algorithm,
      certs: [Buffer.from(signer.certificateChainPem)],
      reserveSize: 20000, // room for the signature, certificate chain, and timestamp
      tsaUrl: TIMESTAMP_AUTHORITY_URL,
      directCoseHandling: false,
    },
    { buffer: croppedJpeg, mimeType: "image/jpeg" },
    signed,
  );
  return signed.buffer;
}
