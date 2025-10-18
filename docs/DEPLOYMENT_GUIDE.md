# Deployment Guide

This guide covers deploying the Enterprise Chat Assistant with RAG system across different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Run Deployment](#cloud-run-deployment)
- [Production Considerations](#production-considerations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **CPU**: 2+ cores recommended
- **Memory**: 4GB+ RAM recommended
- **Storage**: 10GB+ available space
- **Network**: Internet access for model downloads

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)
- kubectl (for Kubernetes deployment)
- gcloud CLI (for Cloud Run deployment)

### External Services

- **OpenAI API Key**: Required for LLM generation
- **Firebase Project**: For user authentication and chat storage
- **Google Cloud Storage** (optional): For document storage

## Local Development

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Enterprise_Chat_Assistant_with_RAG
```

### 2. Environment Configuration

Create environment files:

```bash
# Root .env
cp .env.example .env

# API service
cp apps/api/.env.example apps/api/.env

# Inference service
cp apps/inference/.env.example apps/inference/.env

# Web service
cp apps/web/.env apps/web/.env
```

Configure environment variables:

```bash
# .env
NODE_ENV=development
DEBUG=true

# apps/api/.env
PORT=8080
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:5173
INFERENCE_BASE_URL=http://localhost:8000
FIREBASE_PROJECT_ID=your-firebase-project

# apps/inference/.env
PORT=8000
OPENAI_API_KEY=sk-your-openai-api-key
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
INDEX_DIR=/data/index
DOCS_DIR=/data/docs
TOP_K=5
RERANK_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2

# apps/web/.env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
```

### 3. Firebase Setup

1. Create a Firebase project
2. Enable Firestore
3. Download service account key as `apps/api/serviceAccount.json`

### 4. Start Services

```bash
# Using Docker Compose (recommended)
docker compose -f deployments/docker-compose.yml up --build

# Or start individually
npm run dev:api
npm run dev:inference
npm run dev:web
```

### 5. Verify Deployment

```bash
# Check API health
curl http://localhost:8080/health

# Check inference health
curl http://localhost:8000/health

# Access web interface
open http://localhost:5173
```

## Docker Deployment

### 1. Build Images

```bash
# Build all images
./scripts/build-images.sh

# Or build individually
docker build -f infra/docker/api.Dockerfile -t chat-api .
docker build -f infra/docker/inference.Dockerfile -t chat-inference .
docker build -f infra/docker/web.Dockerfile -t chat-web .
```

### 2. Run with Docker Compose

```bash
# Production compose
docker compose -f deployments/docker-compose.yml up -d

# With custom environment
docker compose -f deployments/docker-compose.yml --env-file .env up -d
```

### 3. Environment Variables

Create a production `.env` file:

```bash
# Production environment
NODE_ENV=production
DEBUG=false

# API Configuration
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-domain.com
INFERENCE_BASE_URL=http://inference:8000

# Inference Configuration
OPENAI_API_KEY=sk-your-production-openai-key
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
INDEX_DIR=/data/index
DOCS_DIR=/data/docs

# Firebase Configuration
FIREBASE_PROJECT_ID=your-production-project
```

## Kubernetes Deployment

### 1. Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install helm (optional)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 2. Create Namespace

```bash
kubectl create namespace chat-assistant
```

### 3. Configure Secrets

```bash
# Create secrets
kubectl create secret generic chat-secrets \
  --from-literal=openai-api-key=sk-your-key \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=firebase-project-id=your-project \
  --namespace=chat-assistant

# Or use the example file
cp deployments/k8s/secrets.example.yaml deployments/k8s/secrets.yaml
# Edit secrets.yaml with your values
kubectl apply -f deployments/k8s/secrets.yaml
```

### 4. Deploy Services

```bash
# Deploy all services
kubectl apply -f deployments/k8s/namespace.yaml
kubectl apply -f deployments/k8s/api-deployment.yaml
kubectl apply -f deployments/k8s/api-service.yaml
kubectl apply -f deployments/k8s/inference-deployment.yaml
kubectl apply -f deployments/k8s/inference-service.yaml
kubectl apply -f deployments/k8s/web-deployment.yaml
kubectl apply -f deployments/k8s/web-service.yaml
kubectl apply -f deployments/k8s/ingress.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n chat-assistant

# Check services
kubectl get services -n chat-assistant

# Check ingress
kubectl get ingress -n chat-assistant
```

## Cloud Run Deployment

### 1. Prerequisites

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable firestore.googleapis.com
```

### 3. Build and Push Images

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chat-api ./apps/api
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chat-inference ./apps/inference
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chat-web ./apps/web
```

### 4. Deploy Services

```bash
# Deploy API service
gcloud run deploy chat-api \
  --image gcr.io/YOUR_PROJECT_ID/chat-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars JWT_SECRET=your-secret,INFERENCE_BASE_URL=https://chat-inference-xxx.run.app

# Deploy inference service
gcloud run deploy chat-inference \
  --image gcr.io/YOUR_PROJECT_ID/chat-inference \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=sk-your-key

# Deploy web service
gcloud run deploy chat-web \
  --image gcr.io/YOUR_PROJECT_ID/chat-web \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 5. Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service chat-web \
  --domain your-domain.com \
  --region us-central1
```

## Production Considerations

### Security

1. **Use strong JWT secrets** (32+ characters)
2. **Enable HTTPS** for all services
3. **Implement rate limiting**
4. **Use secrets management** (Google Secret Manager, AWS Secrets Manager)
5. **Regular security updates**

### Performance

1. **Resource allocation**:
   - API: 1 CPU, 2GB RAM
   - Inference: 2 CPU, 4GB RAM
   - Web: 0.5 CPU, 1GB RAM

2. **Caching**:
   - Enable Redis for session storage
   - Cache embeddings and model weights

3. **Scaling**:
   - Configure auto-scaling policies
   - Use load balancers for high availability

### Database

1. **Firestore configuration**:
   - Enable automatic backups
   - Configure security rules
   - Set up monitoring

2. **Vector storage**:
   - Use persistent volumes for FAISS indexes
   - Implement backup strategies

### Monitoring

1. **Health checks**:
   ```bash
   # API health
   curl https://your-api.com/health
   
   # Inference health
   curl https://your-inference.com/health
   ```

2. **Logging**:
   - Configure structured logging
   - Set up log aggregation (ELK stack, Fluentd)
   - Monitor error rates and response times

3. **Metrics**:
   - Request latency (P50, P95, P99)
   - Error rates
   - Resource utilization
   - OpenAI API usage

## Monitoring and Logging

### Application Metrics

```bash
# Check service status
kubectl get pods -n chat-assistant
kubectl logs -f deployment/chat-api -n chat-assistant

# Monitor resource usage
kubectl top pods -n chat-assistant
```

### Log Analysis

```bash
# View API logs
kubectl logs -f deployment/chat-api -n chat-assistant | grep ERROR

# View inference logs
kubectl logs -f deployment/chat-inference -n chat-assistant | grep WARNING
```

### Health Monitoring

Create monitoring scripts:

```bash
#!/bin/bash
# health-check.sh

API_URL="https://your-api.com"
INFERENCE_URL="https://your-inference.com"

# Check API health
if curl -f "$API_URL/health" > /dev/null 2>&1; then
  echo "✅ API is healthy"
else
  echo "❌ API is down"
  exit 1
fi

# Check inference health
if curl -f "$INFERENCE_URL/health" > /dev/null 2>&1; then
  echo "✅ Inference is healthy"
else
  echo "❌ Inference is down"
  exit 1
fi
```

## Troubleshooting

### Common Issues

1. **API not starting**:
   ```bash
   # Check logs
   docker logs chat-api
   
   # Check environment variables
   docker exec chat-api env | grep -E "(JWT_SECRET|FIREBASE)"
   ```

2. **Inference service errors**:
   ```bash
   # Check OpenAI API key
   docker exec chat-inference env | grep OPENAI_API_KEY
   
   # Check model loading
   docker logs chat-inference | grep "Loading"
   ```

3. **WebSocket connection issues**:
   ```bash
   # Check CORS configuration
   curl -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS \
        http://localhost:8080/health
   ```

### Performance Issues

1. **Slow response times**:
   - Check OpenAI API rate limits
   - Monitor CPU and memory usage
   - Optimize embedding model size

2. **High memory usage**:
   - Reduce batch sizes
   - Implement model caching
   - Use smaller embedding models

### Security Issues

1. **Authentication failures**:
   - Verify JWT secret configuration
   - Check Firebase project settings
   - Validate token expiration

2. **CORS errors**:
   - Update CORS_ORIGIN environment variable
   - Check web service configuration

### Recovery Procedures

1. **Service restart**:
   ```bash
   # Docker Compose
   docker compose restart chat-api
   
   # Kubernetes
   kubectl rollout restart deployment/chat-api -n chat-assistant
   ```

2. **Data recovery**:
   ```bash
   # Restore from backup
   kubectl cp backup/index.faiss chat-inference-pod:/data/index/
   kubectl cp backup/meta.jsonl chat-inference-pod:/data/index/
   ```

3. **Full system reset**:
   ```bash
   # Stop all services
   docker compose down -v
   
   # Remove volumes
   docker volume prune
   
   # Restart services
   docker compose up --build
   ```

## Support

For additional support:

1. Check the [troubleshooting section](#troubleshooting)
2. Review application logs
3. Check system resource usage
4. Verify network connectivity
5. Contact the development team

## Changelog

### v1.0.0
- Initial deployment guide
- Docker and Kubernetes support
- Cloud Run deployment instructions
- Production considerations
