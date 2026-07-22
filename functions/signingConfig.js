import { getFirestore } from "firebase-admin/firestore";

// The scripts in ../scripts write this document: the KMS key that signs
// and the certificate chain that says who signed.
export async function loadSigningConfig() {
  const snapshot = await getFirestore().doc("config/signing").get();
  const config = snapshot.data();
  if (!config?.kmsKeyVersionPath || !config?.certificateChainPem) {
    throw new Error("Signing is not set up yet. Run the scripts in ./scripts first.");
  }
  return config;
}
