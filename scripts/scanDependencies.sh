#!/bin/sh
# Scans the backend's dependencies for known vulnerabilities.
# Operational convention: run this before every deploy. High and Critical
# findings block the deploy until the affected package is updated
# (usually `npm audit fix` in functions/). Lower severities are reviewed
# and may be deferred at the administrator's judgment.
cd "$(dirname "$0")/.." && osv-scanner scan source --lockfile=functions/package-lock.json
