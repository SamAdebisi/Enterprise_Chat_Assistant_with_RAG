# Product Specification

## Vision
Deliver a secure, role-aware chatbot that lets employees interrogate internal knowledge bases with natural language. Answers must cite primary sources so users can verify accuracy quickly.

## Personas & Jobs To Be Done

- **Sales Rep** – Needs quick access to the latest collateral, pricing, and enablement decks filtered to the sales org.
- **Engineer** – Searches through RFCs and architecture notes without exposing sensitive platform details to other departments.
- **Support Analyst** – Uploads fresh runbooks or troubleshooting guides and confirms they are searchable minutes later.

## Core User Stories

1. As an employee, I can authenticate with my corporate email and receive a JWT scoped to my roles.
2. As an authenticated user, I can ask a question and receive a concise answer with inline citations referencing the underlying documents.
3. As an uploader, I can drop a PDF/Docx/Markdown file, tag it with the audiences allowed to read it, and see confirmation when indexing completes.
4. As an admin, I can blacklist sensitive documents by removing role membership or deleting the file from the index.

## Success Metrics

- **Latency** – P50 < 2.5 s per question on warm cache; P95 < 6 s with cold FAISS loads.
- **Freshness** – New documents are chunked and discoverable within 10 minutes of upload.
- **Accuracy** – ≥90% of automated evaluation prompts return at least one correct citation (see `docs/testing.md`).
- **Adoption** – 70% of pilot users ask ≥5 questions per week and report “useful” answers in feedback surveys.

## Out of Scope

- Multi-turn conversational memory beyond a single `chatId` (extensions documented in the roadmap section of `docs/roadmap.md`).
- Automatic document lifecycle management (retention policies, redaction). Current approach assumes manual curation.
