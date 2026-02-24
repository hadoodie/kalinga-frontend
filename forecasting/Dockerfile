# ── Kalinga Forecasting API ──────────────────────────────────
# Lightweight Python image for the ML microservice.
# Render injects $PORT at runtime.
#
# Build:  docker build -t kalinga-forecast-api ./forecasting
# Run:    docker run -p 8001:8001 -e PORT=8001 kalinga-forecast-api
# ─────────────────────────────────────────────────────────────

FROM python:3.11-slim

# System deps for psycopg2 and LightGBM
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . ./forecasting/

# Create artifacts directory (models will be saved here at runtime)
RUN mkdir -p /app/forecasting/artifacts

# Render injects PORT; default to 8001 for local Docker
ENV PORT=8001

EXPOSE ${PORT}

# Health check for Render / Docker Compose
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/api/v1/health || exit 1

# Start uvicorn — Render sets $PORT automatically
CMD ["sh", "-c", "uvicorn forecasting.api:app --host 0.0.0.0 --port ${PORT}"]
