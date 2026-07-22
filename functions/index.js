// The one backend endpoint: takes an uploaded JPEG, crops it to a square,
// and signs the result with a C2PA manifest.
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { AssertionManager } from "./assertionManager.js";
import { cropToSquare } from "./imageEditor.js";
import { createKmsSigner } from "./kmsSigner.js";
import { signWithManifest } from "./manifestManager.js";
import { loadSigningConfig } from "./signingConfig.js";

initializeApp();

export const processUpload = onCall(
  { cors: true, memory: "1GiB", timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in to upload.");
    }
    const { uploadId, fileName } = request.data ?? {};
    if (!/^[0-9a-f-]{36}$/.test(uploadId ?? "")) {
      throw new HttpsError("invalid-argument", "Bad upload id.");
    }

    const userId = request.auth.uid;
    const originalPath = `uploads/${userId}/${uploadId}/original.jpg`;
    const signedPath = `uploads/${userId}/${uploadId}/signed.jpg`;
    const title = typeof fileName === "string" && fileName ? fileName : "original.jpg";

    const bucket = getStorage().bucket();
    const [originalJpeg] = await bucket.file(originalPath).download();

    const assertionManager = new AssertionManager();
    const croppedJpeg = await cropToSquare(originalJpeg, assertionManager);

    const signedJpeg = await signWithManifest({
      title,
      originalJpeg,
      croppedJpeg,
      editActions: assertionManager.toActions(),
      signer: createKmsSigner(await loadSigningConfig()),
    });

    await bucket.file(signedPath).save(signedJpeg, { contentType: "image/jpeg" });
    await getFirestore().doc(`users/${userId}/uploads/${uploadId}`).set({
      fileName: title,
      originalPath,
      signedPath,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { uploadId, originalPath, signedPath };
  },
);
