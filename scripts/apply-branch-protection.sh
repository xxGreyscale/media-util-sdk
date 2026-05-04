#!/usr/bin/env bash
set -euo pipefail

# Applies branch protection for main, requiring CI check `validate`.
# Usage:
#   GH_TOKEN=... ./scripts/apply-branch-protection.sh
# Optional overrides:
#   GITHUB_OWNER=xxGreyscale GITHUB_REPO=media-util-sdk GH_TOKEN=... ./scripts/apply-branch-protection.sh

OWNER="${GITHUB_OWNER:-xxGreyscale}"
REPO="${GITHUB_REPO:-media-util-sdk}"
BRANCH="${GITHUB_BRANCH:-main}"

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "GH_TOKEN is required."
  echo "Create a GitHub token with repo administration permission, then run:"
  echo "  GH_TOKEN=your_token ./scripts/apply-branch-protection.sh"
  exit 1
fi

api_url="https://api.github.com/repos/${OWNER}/${REPO}/branches/${BRANCH}/protection"

response_file="$(mktemp)"
status_code="$(curl -sS -o "$response_file" -w "%{http_code}" -X PUT "$api_url" \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GH_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": ["validate"]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false,
      "require_last_push_approval": false
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_conversation_resolution": true
  }')"

if [[ "$status_code" != "200" ]]; then
  echo "Failed to apply branch protection (HTTP $status_code)."
  cat "$response_file"
  rm -f "$response_file"
  exit 1
fi

rm -f "$response_file"
echo "Branch protection updated for ${OWNER}/${REPO}:${BRANCH}."
echo "Required status check: validate"
