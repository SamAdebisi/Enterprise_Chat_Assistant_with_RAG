# Deployment Playbooks

## Docker Compose

Use for local or single-host demos.

```bash
scripts/dev-up.sh
# tails logs
docker compose -f deployments/docker-compose.yml logs -f api inference web
```

Environment variables are sourced from `apps/*/.env`. Update `deployments/docker-compose.yml` to mount any additional secrets or volumes.

## Cloud Run

1. Export variables (see `deployments/cloudrun/service-env.example`).
2. Run `deployments/cloudrun/deploy.sh`.
3. Script builds and deploys inference first, retrieves its URL, then deploys the API and optional web frontend using the captured endpoint.
4. Protect the services with Cloud Armor and restrict CORS origins in production.

## Kubernetes (GKE)

1. Create the namespace: `kubectl apply -f deployments/k8s/namespace.yaml`.
2. Provision secrets from `deployments/k8s/secrets.example.yaml` (update keys before applying).
3. Apply inference + API Deployments and Services. For persistent vector storage, replace the emptyDir volumes with a PersistentVolumeClaim that maps to SSD-backed storage.
4. Ingress options:
   - For internal-only deployments, use an Internal HTTP(S) Load Balancer.
   - For public access, configure TLS certificates (Cert-Manager) and WAF rules.

## Terraform Automation

`infra/terraform` bootstraps Artifact Registry, Cloud Run services, service accounts, and Secret Manager secrets. Example usage:

```bash
cd infra/terraform
terraform init
terraform apply -var-file=env/dev.tfvars
```

Outputs include service URLs and the Artifact Registry repository path. Push container images before applying or use Cloud Build triggers.

## Release Workflow

1. Merge to `main` triggers CI: run API + inference tests, build Docker images, and publish to Artifact Registry.
2. Tag release (e.g., `v1.3.0`).
3. Use Terraform to roll out to staging; smoke test with the E2E checklist.
4. Promote the same images to production via `terraform apply -var-file=env/prod.tfvars` or `deploy.sh` depending on platform.
5. Monitor for 30 minutes post-release (latency, error rate, OpenAI usage).
