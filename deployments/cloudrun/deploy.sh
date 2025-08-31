#!/usr/bin/env bash
set -euo pipefail

PROJECT=${PROJECT:-$(gcloud config get-value project)}
REGION=${REGION:-europe-north1}

# Build from new paths
gcloud builds submit --tag "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-api" ./apps/api
gcloud builds submit --tag "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-inference" ./apps/inference

# Deploy with DNS-safe service names
gcloud run deploy enterprise-chat-assistant-with-rag-api \
  --image "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-api" \
  --region "$REGION" --platform managed \
  --allow-unauthenticated \
  --set-env-vars "INFERENCE_BASE_URL=https://enterprise-chat-assistant-with-rag-inference-<hash>-uc.a.run.app,JWT_SECRET=change_me,CORS_ORIGIN=*"

gcloud run deploy enterprise-chat-assistant-with-rag-inference \
  --image "gcr.io/$PROJECT/enterprise-chat-assistant-with-rag-inference" \
  --region "$REGION" --platform managed \
  --allow-unauthenticated \
  --set-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY},INDEX_DIR=/data/index,DOCS_DIR=/data/docs" \
  --memory "2Gi" --cpu "2"
