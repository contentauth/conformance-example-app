# C2PA Generator Product Security Architecture Document Template

---

## 1. Generator Product Information

_(Refers to C2PA Generator Product Security Requirements §1 Scope and §3 Overview)_

### 1.1 Applicant organization details

Example Corp.
123 Main St, Santa Monica, CA 90401

Jane Smith
jane@example.com

### 1.2 C2PA Conformance Program Version

0.2

### 1.3 C2PA Content Credentials Specification Version

2.4

### 1.4 Distinguished name

1. **Common Name (CN)**: Conformance Example App
2. **Organization (O)**: Example Corp.
3. **Organizational Unit (OU)**: N/A
4. **Country (C)**: US

### 1.5 Generator Product Description

Conformance Example App is a web service that accepts user-uploaded JPEG
images, automatically crops them server-side, and returns the cropped image
signed with C2PA Content Credentials.

### 1.6 Generator Product Target of Evaluation (GP TOE) Description

The TOE is the Conformance Example App backend running on a commercial cloud
platform. It comprises an upload endpoint that authenticates the user and
receives the image, a crop engine that produces the cropped output, an
assertion source that derives assertions from the cropping edit the engine
actually performed, a claim generator that builds the manifest from those
assertions and requests signing, and the cloud KMS which holds the only copy
of the claim signing key. The crop engine, assertion source, and claim
generator run as components within a single service process, so the signer
operates only on server-rendered output. The user's browser uploads the image
and displays the result but performs no cropping, assertion generation, or
claim signing.

### 1.7 Implementation Class

Backend

### 1.8 Target Max Assurance Level

Level 1

### 1.9 Target Generator Product capabilities

1. Claim generation:
   * Still image media types:
     * `image/jpeg`
2. Claim validation:
   * Still image media types:
     * `image/jpeg`

---

## 2. Security Architecture Details by Objective

### 2.1 [O.1] Automated Certificate Enrollment Proof of Eligibility (§6.1)

_(Refers to C2PA Generator Product Security Requirements §6.1 / Objective O.1)_

#### 2.1.1 Assurance Level 1 & 2 Base Evidence (Enrollment Process & Secret Management)

_**Applicability:** Required for Assurance Level 1 and Level 2_

1. **Certificate Enrollment Process**: Certificate enrollment is a manual
   process performed by an administrator. Conformance Example App instances
   never enroll or rotate certificates themselves. The administrator
   generates a non-exportable signing key in the cloud KMS, creates a CSR,
   and submits it through the CA's portal. The issued certificate is stored
   in access-controlled configuration where the signing service reads it.
2. **Authentication Method & API Details**: There is no automated enrollment
   API. The administrator authenticates to the CA's portal with an account
   protected by two-factor authentication.
3. **Management of Authentication Secrets**: The only enrollment
   authentication secrets are the administrator's CA portal credentials,
   which are protected by two-factor authentication and are never stored by
   the Generator Product.

#### 2.1.2 Assurance Level 2 Additional Evidence (Hardware Root of Trust Binary Identity)

_**Applicability:** Required for Assurance Level 2_

Not applicable.

---

### 2.2 [O.2] Confidentiality of the Claim Signing Key (§6.2)

_(Refers to C2PA Generator Product Security Requirements §6.2 / Objective O.2)_

#### 2.2.1 Assurance Level 1 & 2 Base Evidence (Key Generation, Least Privilege & Rotation)

_**Applicability:** Required for Assurance Level 1 and Level 2_

1. **Key Generation & Storage**: The claim signing key is a P-256 ECDSA key
   (NIST-approved) generated and stored in the cloud KMS, non-exportable and
   encrypted at rest.
2. **Access Controls & Encryption**: Only the signing service's service
   account can invoke signing, following least privilege. The key is
   encrypted at rest in the KMS and never leaves it.
3. **Ephemeral Plaintext Key Handling**: Not applicable. The key is
   non-exportable and plaintext key material never leaves the KMS.
4. **Key Rotation Process**: Rotation is performed by generating a new KMS
   key and re-enrolling for a certificate.
5. **Subsystem Mutual Authentication & Role Validation**: Upload requests
   are authenticated with user session tokens before any signing occurs.

#### 2.2.2 Assurance Level 2 Additional Evidence (Key Management Environment & Hardware Attestation)

_**Applicability:** Required for Assurance Level 2_

Not applicable.

#### 2.2.3 Assurance Level 2 Additional Evidence for Distributed & Backend Classes (Calling Client Attestation)

_**Applicability:** Required for Assurance Level 2 for Distributed and Backend Implementation Classes only_

Not applicable.

---

### 2.3 [O.3] Protection of the Claim Generator (§6.3)

_(Refers to C2PA Generator Product Security Requirements §6.3 / Objective O.3)_

#### 2.3.1 Assurance Level 1 & 2 Base Evidence (SCA/SBOM Scan Tools & 90-Day Remediation Policy)

_**Applicability:** Required for Assurance Level 1 and Level 2_

1. **SCA / SBOM Scanning Tools**: OSV-Scanner is run against the dependency
   lockfile before every deploy, as a documented operational convention of
   the deployment process.
2. **90-Day Remediation Policy**: Deployment is a manual administrator
   action. Any CRITICAL or HIGH finding (CVSS v3+) blocks the deploy until
   the affected dependency is updated, satisfying the 90-day remediation
   requirement.

#### 2.3.2 Assurance Level 2 Additional Evidence (Exploit Countermeasures, Static Analysis & Patch Recency)

_**Applicability:** Required for Assurance Level 2_

Not applicable.

---

### 2.4 [O.4] Protection of Assets & Assertions at Generation (§6.4)

_(Refers to C2PA Generator Product Security Requirements §6.4 / Objective O.4)_

#### 2.4.1 Assurance Level 1 & 2 Base Evidence (SCA/SBOM Scan Tools & Remediation for Content Software)

_**Applicability:** Required for Assurance Level 1 and Level 2_

1. **SCA / SBOM Scanning Tools**: The upload handler, crop engine, and
   signer live in one codebase covered by the same OSV-Scanner scan
   described in 2.3.1.
2. **90-Day Remediation Policy**: The same convention applies: CRITICAL or
   HIGH findings in content-processing software block deployment until the
   affected dependency is updated.

#### 2.4.2 Assurance Level 2 Additional Evidence (Countermeasures, Static Analysis, Kernel Isolation & Patch Recency)

_**Applicability:** Required for Assurance Level 2_

Not applicable.

---

### 2.5 [O.5] Protection of Traffic Between Subsystems (§6.5)

_(Refers to C2PA Generator Product Security Requirements §6.5 / Objective O.5)_

#### 2.5.1 Assurance Level 1 & 2 Base Evidence for Distributed & Backend Classes (TLS 1.3 & Cryptographic Protocols)

_**Applicability:** Required for Assurance Level 1 and Level 2 for Distributed and Backend Implementation Classes only_

1. **TLS 1.3 & Cryptographic Protocols**: Communication between subsystems
   is encrypted in transit with TLS terminated by the cloud provider. The
   signing service's calls to KMS and storage negotiate TLS 1.3. Cropping
   and signing run in a single process, so there is no other inter-subsystem
   network traffic.

#### 2.5.2 Assurance Level 2 Additional Evidence (Kernel-Level IPC Isolation & Thread/Process Separation)

_**Applicability:** Required for Assurance Level 2_

Not applicable.

---

### 2.6 [O.6] Protection of the Hosting Environment (§6.6)

_(Refers to C2PA Generator Product Security Requirements §6.6 / Objective O.6)_

#### 2.6.1 Assurance Level 1 & 2 Base Evidence for Distributed & Backend Classes (IAM, RBAC, Cloud Resource Policies & OWASP Top 10)

_**Applicability:** Required for Assurance Level 1 and Level 2 for Distributed and Backend Implementation Classes only_

1. **IAM & Role-Based Access Control (RBAC)**: Cloud IAM with role-based
   access control governs all resources in the TOE.
2. **Principal Access Policies**: The service runs under a dedicated service
   account with only the permissions the signing pipeline needs;
   administrators use accounts protected by two-factor authentication.
3. **Cloud Resource IAM Policies**: IAM policies restrict the KMS key,
   storage buckets, and signing configuration to the signing service's
   service account and administrators.
4. **Vulnerability Scanning & OWASP Top 10 Coverage**: Dependency scanning
   is performed before every deploy (2.3.1), and a periodic security review
   covers the OWASP Top 10 web application vulnerabilities.
5. **Timely Remediation Policy**: CRITICAL and HIGH dependency findings
   block deployment until resolved; identified vulnerabilities are tracked
   and remediated within the required timelines (30 days High, 90 days
   Moderate, 180 days Low). OS patching is handled by the managed cloud
   platform.

#### 2.6.2 Assurance Level 2 Additional Evidence for Distributed & Backend Classes (Audit Logging, HIDS, Network Segmentation & Attached Reports)

_**Applicability:** Required for Assurance Level 2 for Distributed and Backend Implementation Classes only_

Not applicable.
