# Waste2Worth AI - Deployment & Public Access Guide

This guide explains how to share Waste2Worth AI publicly so anyone in the world can test it from their phone or computer, both via an **instant live demo** and **permanent 24/7 cloud deployment**.

---

## 🚀 Option 1: Instant Live Demo (Active Right Now!)

Your application is currently running live on a secure, public HTTPS tunnel:

> **Live Public URL**: [https://56675f9b2597fc.lhr.life](https://56675f9b2597fc.lhr.life)
> **Scanner Direct Link**: [https://56675f9b2597fc.lhr.life/scanner](https://56675f9b2597fc.lhr.life/scanner)

### Why this works immediately:
- **Full HTTPS (TLS Encryption)**: Enables phone camera and device GPS without insecure origin restrictions.
- **Real PyTorch ResNet-18 Model**: Classifies waste in real-time using your local machine's GPU/MPS.
- **Interactive GIS Map**: Draggable Apple pin, live place search, and street-level reverse geocoding work seamlessly.
- **All 3 Roles Supported**: Citizen, Collector, and Municipal Administrator.

---

## 🌐 Option 2: Permanent 24/7 Cloud Hosting

To keep the application running 24/7 even when your laptop is closed, follow these 3 steps:

### Step 1: Push Code to GitHub

1. Create a new repository on [GitHub](https://github.com/new) named `Waste2Worth-AI` (set to Public or Private).
2. Run these commands in your project terminal:
   ```bash
   cd /Users/chaitanya/Desktop/Waste2Worth_AI
   git add .
   git commit -m "feat: complete Apple-inspired Waste2Worth AI platform with ResNet-18"
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/Waste2Worth-AI.git
   git push -u origin main
   ```

---

### Step 2: Deploy Free Cloud Database (PostgreSQL)

Use **[Neon.tech](https://neon.tech)** or **[Supabase](https://supabase.com)** (both offer free, high-performance PostgreSQL):
1. Sign up on [Neon.tech](https://neon.tech).
2. Create a project named `waste2worth`.
3. Copy the **Connection String** (e.g., `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/waste2worth?sslmode=require`).

---

### Step 3: Deploy Backend (FastAPI + PyTorch) on Render

1. Sign up on **[Render.com](https://render.com)**.
2. Click **New +** → **Blueprint** and connect your `Waste2Worth-AI` GitHub repository.
3. Render will automatically read [`render.yaml`](./render.yaml) and configure:
   - Python environment with PyTorch ResNet-18.
   - Database connection.
   - API endpoints (`/predict`, `/api/citizen/*`, `/api/admin/*`, `/api/collector/*`).
4. Paste your Neon PostgreSQL connection string into `DATABASE_URL`.
5. Click **Apply** to deploy. Render will give you a backend URL like `https://waste2worth-backend.onrender.com`.

---

### Step 4: Deploy Frontend (Next.js) on Vercel

1. Sign up on **[Vercel.com](https://vercel.com)**.
2. Click **Add New...** → **Project** and select your `Waste2Worth-AI` repository.
3. Set **Root Directory** to `frontend`.
4. In **Environment Variables**, add:
   - `BACKEND_INTERNAL_URL` = `https://waste2worth-backend.onrender.com`
5. Click **Deploy**. In under 2 minutes, Vercel will give you a custom production domain (e.g., `https://waste2worth-ai.vercel.app`) with automatic SSL and global CDN caching.

---

## 🐳 Option 3: Single-Command Docker Deployment (VPS / Self-Hosted)

If you have a Linux VPS (DigitalOcean, AWS EC2, Linode, Hetzner), you can run the entire platform with one command:

```bash
docker compose up -d --build
```

This automatically spins up:
- PostgreSQL 16 container (`waste2worth_db`) on port 5432
- FastAPI container (`waste2worth_backend`) on port 8000
- Next.js container (`waste2worth_frontend`) on port 3000
