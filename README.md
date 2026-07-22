# CropSign

A basic demo of a C2PA signing app. You sign in, upload a JPEG, and the backend
crops it to a 500×500 square and signs the result with a C2PA manifest built
with the CAI Node SDK. The manifest records the original upload as its
parentOf ingredient plus the opened, resized, and cropped actions (all as
created assertions), validates ingredients against the official C2PA trust
lists, and gets timestamped by the SSL.com C2PA TSA. The signing key lives in
Google Cloud KMS and never leaves it.

> **Heads up:** this is a tutorial project, for learning and demos only. It
> relies on paid services — the Firebase Blaze plan and Google Cloud KMS — and
> it is not intended for production use. Delete the project when you're done
> so you don't keep getting billed.

Firebase (Auth, Storage, Firestore, Functions) + Node + Vue + Tailwind.

## You need

- Node 22 or newer
- A Firebase account. Cloud KMS needs billing, so the project has to be on
  the Blaze plan.
- The `firebase`, `gcloud`, and `step` CLIs
  (`brew install firebase-cli google-cloud-sdk step`)

## 1. Set up the project

Create a project at console.firebase.google.com and upgrade it to Blaze. In
the console, turn on **Authentication → Email/Password** and click Get
started under **Storage**. Add a web app under Project settings and paste its
config into `web/src/firebaseConfig.js`.

Then sign in on the command line and wire everything up:

```sh
firebase login
firebase use --alias default YOUR_PROJECT_ID
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable cloudkms.googleapis.com compute.googleapis.com
gcloud firestore databases create --location=nam5
```

## 2. Make the signing key and certificate

The key is created in Cloud KMS, and the certificate comes from a small demo
CA you make with the step CLI. (A real conforming product gets its
certificate from a CA on the C2PA trust list — the demo CA stands in for
that.)

```sh
cd scripts
npm install
node createCsr.js "CropSign" "Example Corp."
```

That creates the KMS key, writes `csr.pem`, and records the key paths in
Firestore. The CN is the product name and O is the organization. Now make a
root CA and sign the CSR — one year, with the C2PA claim signing EKU from
`c2pa-cert.tpl`:

```sh
step certificate create --profile root-ca "CropSign Demo Root" root.crt root.key
step certificate sign --template c2pa-cert.tpl --not-after 8760h csr.pem root.crt root.key > cert.pem
cat cert.pem root.crt > chain.pem
node saveCertificate.js chain.pem
cd ..
```

If step says `csr.pem` is missing, the createCsr.js run above didn't finish —
fix that first. Otherwise the chain is now in Firestore next to the key
paths — everything the backend needs.

## 3. Deploy

Let the functions runtime use the KMS key. (Functions run as the default
compute service account, which appeared when Compute Engine was enabled in
step 1.)

```sh
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
  --role="roles/cloudkms.signer"
```

Then install and deploy everything — the functions, the rules, and the web
app on Firebase Hosting:

```sh
cd functions && npm install && cd ..
cd web && npm install && cd ..
firebase deploy
```

## 4. Try it

Your app is live at `https://YOUR_PROJECT_ID.web.app`.

Open it, create an account, and upload a JPEG. You get download
links for the original and the cropped, signed copy. Drop the signed one on
https://verify.contentauthenticity.org — you'll see the parent ingredient,
the opened, resized, and cropped actions, and the SSL.com timestamp. The
signer shows as untrusted because your demo CA isn't on the C2PA trust list;
that's expected.

For local development, `npm run dev` inside `web/` serves the same app
against your deployed backend.

## Where things happen

- `functions/imageEditor.js` — crops to 500×500 with sharp
- `functions/assertionManager.js` — turns the edits into C2PA actions
- `functions/manifestManager.js` — builds the manifest: parentOf ingredient,
  edit intent, created assertions, trust lists, TSA
- `functions/kmsSigner.js` — signs claim bytes with Cloud KMS
- `scripts/createCsr.js` — makes the KMS key and a CSR signed by it
- `scripts/saveCertificate.js` — puts the certificate chain in Firestore
