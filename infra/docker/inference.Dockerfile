# syntax=docker/dockerfile:1.6
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

COPY apps/inference/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY apps/inference/app ./app

EXPOSE 8000
ENV INDEX_DIR=/data/index \
    DOCS_DIR=/data/docs

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
