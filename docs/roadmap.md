# Roadmap & Enhancements

## Near Term (0–1 month)

- **Authentication** – Swap username/password for SSO (Azure AD / Okta) and rotate JWT signing keys via Secret Manager.
- **Observability** – Introduce structured logging (pino/opaleye) and trace request IDs through API → inference.
- **Document Lifecycle** – Add soft-delete and reindex jobs so expired documents are purged automatically.

## Mid Term (1–3 months)

- **Conversation Memory** – Persist summaries per `chatId` to maintain context across multiple turns without resending entire history.
- **Feedback Loop** – Allow users to thumbs-up/down answers, capture signals in Firestore, and feed them into retriever tuning.
- **Evaluation Harness** – Assemble golden question/answer sets and build an automated benchmarking workflow (e.g., `ragas`, `trulens`).
- **Multi-Tenant Support** – Namespacing indexes per tenant and enforcing tenant-based isolation in Firestore.

## Long Term (>3 months)

- **Bring Your Own Model** – Abstract the LLM gateway to optionally call local models (e.g., `llama.cpp`, Bedrock) with feature parity.
- **Streaming Answers** – Upgrade inference + API to support streamed tokens over WebSockets for faster perceived latency.
- **Policy Guardrails** – Integrate content classification (PII, secrets) before indexing documents; auto-block high-risk uploads.

## Adoption Checklist

- Align with security review (pen-test, threat modeling).
- Roll out pilot to one business unit; gather feedback via built-in thumbs feedback.
- Mature CI/CD to include Terraform plan/apply with change review gates.
