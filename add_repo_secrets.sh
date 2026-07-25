#!/usr/bin/env bash
set -euo pipefail

# Repository identifier (owner/repo)
REPO="mohtasham-kali/VultaCore"

# Declare secrets (name => value). Update values as needed.
declare -A SECRETS=(
  [LS_API_KEY]="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJmOTliNGQ1MDQyYTI1YTJmODE4NzZhM2JiMDVlZWViOTljNmNjZGFlMmFlYWFkN2QzNmFhNzc5OTA4YzllZDljYjJiMzdiMWVlNThiMzZjYyIsImlhdCI6MTc4Mjk0MjgyOC4zMzg5ODgsIm5iZiI6MTc4Mjk0MjgyOC4zMzg5OSwiZXhwIjoxOTU2NTI4MDAwLjAyOTQ1LCJzdWIiOiI3NDE0NTA3Iiwic2NvcGVzIjpbXX0.N5Qco32qBAtUG5uBfjJ651Q3JYaCYogAgwIUrwFkAwM0ZhOg4amlUEJnQLAUjJGYv_75gZ1xDg8fLbtduxshu8m3gGtcJWEniGWuklgwf93Uoxe6dVAr7ZmePkOlLZa_UYg7l8QSq12tNzzynuCYxp4rNtUSz3URYZePDHheh_oVHt5Iwk9JrMd4_1IdGwYNT47rGLqIjGX3zBJLog12HAXzh3mLBax4OFepMavrrBp47XUF6pudL_RtVBth0FrkqzOcdV5KnUmBuS3tqbCV439hT6LMOS_9T9IjZprC9HYQ937lGnH02NqDzgc6S0YPpdn-5Q3K257Cy_SNW9Z2IScMrIOG51kANaLzEY_Annx399_547WpS1Z9YfYM_Au4sPCd3mCOvWMvSc5Hxmbrju5eQu7xbKN1EI9zUItIO9limHvJ-bOSy0Qkk0ylDNrTBSjtlrRNc0PIwrnrlo_ySXo698Co5goKcRhU-R-5q1mPghvXhY1PRYpwPW77oyz0LxoBji73-tW6DwoT45Fm_ljsLrZPIhvOa-mBtBCtcmN_Bi6BTf0jMb17E1L0LaEUEedhow3mFNYvqQDjKnNK8Cui1tY2rKiZSZ5YqI8es2b5BTGrb9SLVtB_SK-A7ha5Mp8ttEntq1BN1dubnYvdIPxbeZILtdUYxL05FaXEmD4"
  [LS_VARIANT_ENTERPISE]="1820708"
  [APP_URL]="https://vultacore.techprogression.com"
  [LS_VARIANT_PREMIUM]="1820708"
  [LS_VARIANT_STANDARD]="1820715"
  [LS_STORE_ID]="410740"
  [LS_WEBHOOK_SECRET]="7f3a9c2e1b4d8f0a5c6e3d9b2f7a4c1e8d5b0f3"
  [OPENROUTER_API_KEY]="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"
  [GEMINI_API_KEY]="AIzaSyDzNGOxphsRq3KmWKAsQ_i7mdMD1yfEErY"
  [GROQ_API_KEYV]="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"
)

# Add each secret to the repository
for name in "${!SECRETS[@]}"; do
  echo "🔐 Setting secret: $name"
  printf "%s" "${SECRETS[$name]}" | gh secret set "$name" --repo "$REPO" --body -
  if [[ $? -eq 0 ]]; then
    echo "✅ $name added"
  else
    echo "❗️Failed to set $name"
  fi
done

echo "🎉 All secrets processed."
