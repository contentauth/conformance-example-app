import { createHash } from "node:crypto";
import { KeyManagementServiceClient } from "@google-cloud/kms";

const kms = new KeyManagementServiceClient();

// Signs C2PA claim bytes with the EC P-256 key held in Google Cloud KMS.
// KMS takes a SHA-256 digest and returns a DER-encoded ECDSA signature,
// which is exactly what the C2PA SDK expects from a raw signing callback.
export function createKmsSigner({ kmsKeyVersionPath, certificateChainPem }) {
  return {
    algorithm: "es256",
    certificateChainPem,
    sign: async (claimBytes) => {
      const digest = createHash("sha256").update(claimBytes).digest();
      const [result] = await kms.asymmetricSign({
        name: kmsKeyVersionPath,
        digest: { sha256: digest },
      });
      return Buffer.from(result.signature);
    },
  };
}
