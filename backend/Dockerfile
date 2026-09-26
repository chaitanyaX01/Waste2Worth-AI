FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV, Pillow-heif, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libheif-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy PyTorch AI model, class names, and application code
COPY waste2worth_resnet18.pth /app/waste2worth_resnet18.pth
COPY class_names.json /app/class_names.json
COPY backend/ /app/backend/

ENV PYTHONUNBUFFERED=1
ENV MODEL_PATH=/app/waste2worth_resnet18.pth
ENV CLASS_NAMES_PATH=/app/class_names.json
ENV UPLOAD_DIR=/app/backend/uploads

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
