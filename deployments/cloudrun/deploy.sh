#!/usr/bin/env bash
set -euo pipefail

PROJECT=${PROJECT:-$(gcloud config get-value project)}
REGION=${REGION:-us-central1}
JWT_SECRET=${JWT_SECRET:-change_me}
CORS_ORIGIN=${CORS_ORIGIN:-*}

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY must be set" >&2
  exit 1
fi

# Build from new paths
gcloud builds submit --tag "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-inference" ./apps/inference
gcloud builds submit --tag "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-api" ./apps/api
if [[ "${DEPLOY_WEB:-true}" == "true" ]]; then
  gcloud builds submit --tag "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-web" ./apps/web
fi

# Deploy inference first to capture URL
gcloud run deploy enterprise-chat-assistant-with-rag-inference \
  --image "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-inference" \
  --region "$REGION" --platform managed \
  --allow-unauthenticated \
  --set-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY},INDEX_DIR=/data/index,DOCS_DIR=/data/docs" \
  --memory "2Gi" --cpu "2"

INFERENCE_URL=$(gcloud run services describe enterprise-chat-assistant-with-rag-inference --region "$REGION" --format 'value(status.url)')

gcloud run deploy enterprise-chat-assistant-with-rag-api \
  --image "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-api" \
  --region "$REGION" --platform managed \
  --allow-unauthenticated \
  --set-env-vars "INFERENCE_BASE_URL=${INFERENCE_URL},JWT_SECRET=$JWT_SECRET,CORS_ORIGIN=$CORS_ORIGIN"

if [[ "${DEPLOY_WEB:-true}" == "true" ]]; then
  gcloud run deploy enterprise-chat-assistant-with-rag-web \
    --image "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-web" \
    --region "$REGION" --platform managed \
    --allow-unauthenticated
fi
