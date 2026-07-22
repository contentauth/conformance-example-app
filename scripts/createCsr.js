// Creates the C2PA signing key in Cloud KMS (if it doesn't exist yet), writes
// csr.pem for your certificate authority to sign, and records the key paths
// in Firestore. Runs with your gcloud application-default credentials.
//
// Usage: node createCsr.js "Product Name" "Organization"
import "reflect-metadata";
import { writeFileSync } from "node:fs";
import { createHash, webcrypto } from "node:crypto";
import { KeyManagementServiceClient } from "@google-cloud/kms";
import * as x509 from "@peculiar/x509";
import { projectId, signingConfigDoc } from "./firebase.js";

const [productName, organization] = process.argv.slice(2);
if (!productName || !organization) {
  console.error('Usage: node createCsr.js "Product Name" "Organization"');
  process.exit(1);
}

const kms = new KeyManagementServiceClient();
const keyRingPath = kms.keyRingPath(projectId, "global", "cropsign");
const keyVersionPath = `${keyRingPath}/cryptoKeys/c2pa-claim-signing/cryptoKeyVersions/1`;

async function ensureSigningKey() {
  await kms
    .createKeyRing({ parent: kms.locationPath(projectId, "global"), keyRingId: "cropsign" })
    .catch(ignoreAlreadyExists);
  await kms
    .createCryptoKey({
      parent: keyRingPath,
      cryptoKeyId: "c2pa-claim-signing",
      cryptoKey: {
        purpose: "ASYMMETRIC_SIGN",
        versionTemplate: { algorithm: "EC_SIGN_P256_SHA256" },
      },
    })
    .catch(ignoreAlreadyExists);

  for (let attempt = 0; attempt < 10; attempt++) {
    const [version] = await kms.getCryptoKeyVersion({ name: keyVersionPath });
    if (version.state === "ENABLED") return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("The KMS key never became ready.");
}

function ignoreAlreadyExists(error) {
  if (error.code !== 6) throw error; // gRPC code 6 = ALREADY_EXISTS
}

async function createCsr() {
  const [{ pem }] = await kms.getPublicKey({ name: keyVersionPath });
  const publicKey = await webcrypto.subtle.importKey(
    "spki",
    pemToDer(pem),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );

  const request = await x509.Pkcs10CertificateRequestGenerator.create(
    {
      name: `CN=${productName}, O=${organization}`,
      keys: { publicKey, privateKey: { type: "private", algorithm: { name: "ECDSA" } } },
      signingAlgorithm: { name: "ECDSA", hash: "SHA-256" },
    },
    kmsBackedCrypto(),
  );
  return request.toString("pem");
}

// A minimal WebCrypto stand-in whose sign() calls KMS instead of a local key.
function kmsBackedCrypto() {
  return {
    getRandomValues: (array) => webcrypto.getRandomValues(array),
    subtle: {
      digest: (...args) => webcrypto.subtle.digest(...args),
      importKey: (...args) => webcrypto.subtle.importKey(...args),
      exportKey: (...args) => webcrypto.subtle.exportKey(...args),
      sign: async (_algorithm, _key, data) => {
        const digest = createHash("sha256").update(Buffer.from(data)).digest();
        const [result] = await kms.asymmetricSign({
          name: keyVersionPath,
          digest: { sha256: digest },
        });
        return derSignatureToRaw(Buffer.from(result.signature));
      },
    },
  };
}

function pemToDer(pem) {
  return Buffer.from(pem.replace(/-----[^-]+-----|\s/g, ""), "base64");
}

// KMS returns DER-encoded ECDSA signatures; WebCrypto callers expect raw r||s.
function derSignatureToRaw(der) {
  let offset = 2; // skip the SEQUENCE header
  const readInteger = () => {
    offset += 1; // skip the INTEGER tag
    const length = der[offset];
    offset += 1;
    let bytes = der.subarray(offset, offset + length);
    offset += length;
    while (bytes.length > 32) bytes = bytes.subarray(1); // drop leading zero padding
    return Buffer.concat([Buffer.alloc(32 - bytes.length), bytes]);
  };
  return Buffer.concat([readInteger(), readInteger()]);
}

await ensureSigningKey();
writeFileSync("csr.pem", await createCsr());
await signingConfigDoc.set({ kmsKeyRingPath: keyRingPath, kmsKeyVersionPath: keyVersionPath }, { merge: true });

console.log(`Wrote csr.pem with CN=${productName}, O=${organization}.`);
console.log("Next: sign it with your CA (see the README), then run saveCertificate.js");
process.exit(0);
