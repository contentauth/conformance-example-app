// Stores the signed certificate chain in Firestore so the backend can sign.
//
// Usage: node saveCertificate.js chain.pem
import { readFileSync } from "node:fs";
import { signingConfigDoc } from "./firebase.js";

const [chainFile] = process.argv.slice(2);
if (!chainFile) {
  console.error("Usage: node saveCertificate.js <certificate-chain.pem>");
  process.exit(1);
}

const certificateChainPem = readFileSync(chainFile, "utf8");
const certificateCount = (certificateChainPem.match(/BEGIN CERTIFICATE/g) ?? []).length;
if (certificateCount < 2) {
  console.error(
    `${chainFile} holds ${certificateCount} certificate(s); expected the signed certificate plus the root. Did \`step certificate sign\` succeed?`,
  );
  process.exit(1);
}

await signingConfigDoc.set({ certificateChainPem }, { merge: true });
console.log("Saved the certificate chain. The backend is ready to sign.");
process.exit(0);
