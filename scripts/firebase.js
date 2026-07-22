import { readFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// The project id comes from .firebaserc, written when you run `firebase use --add`.
export const projectId = readProjectId();

function readProjectId() {
  try {
    const { projects } = JSON.parse(
      readFileSync(new URL("../.firebaserc", import.meta.url), "utf8"),
    );
    const projectId = projects.default ?? Object.values(projects)[0];
    if (!projectId) throw new Error("no project in .firebaserc");
    return projectId;
  } catch {
    console.error("No project found in .firebaserc. Run `firebase use --add` in the project root first.");
    process.exit(1);
  }
}

initializeApp({ projectId });

// Both scripts write to this one document; the backend reads it when signing.
export const signingConfigDoc = getFirestore().doc("config/signing");
