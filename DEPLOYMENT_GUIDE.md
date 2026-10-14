# Waste2Worth AI — Live URL & Deployment Guide

This guide explains how to get and maintain a **permanent, stable live URL** for Waste2Worth AI so that it never resets or generates random URLs.

---

## ⚡ The Problem: Why Did the Old Tunnel Keep Changing?

Previously, `start.sh` ran `ssh ... nokey@localhost.run`.
- **`localhost.run`** generates a random hash domain (e.g. `c47d91487cc08f.lhr.life`).
- When the connection was idle or experienced network latency, the SSH session dropped.
- Each time it reconnected, a **completely new random URL** was generated.
- This broke links shared with testers and required continually re-entering the URL in the mobile app.

---

## 🛠️ Solution 1: Persistent Local Live Tunnel (Zero Random Domains)

We have upgraded [`start.sh`](./start.sh) and [`tunnel.sh`](./tunnel.sh) to use a **persistent tunnel manager**.

### 1. Default: Fixed Subdomain Tunnel (localtunnel)
Run:
```bash
./start.sh
# or standalone tunnel:
./tunnel.sh
```
- **Fixed URL**: `https://waste2worth-live.loca.lt`
- **Scanner Direct Link**: `https://waste2worth-live.loca.lt/scanner`
- **Auto-Reconnect**: If your Wi-Fi blips or times out, the script automatically reconnects to the **exact same subdomain** without generating a random address!
- **Custom Subdomain**: You can change your subdomain in `.env`:
  ```bash
  TUNNEL_SUBDOMAIN="my-custom-name"
  # Produces: https://my-custom-name.loca.lt
  ```
> **First-time Browser Visit**: Localtunnel displays a one-time reminder page asking for your Public IP. You can find your IP printed directly in your terminal, or click to proceed.

---

### 1. Recommended: Ngrok Permanent Static Domain (100% Zero-Drop, Never Changes)
`ngrok` has already been installed on your Mac.

To configure your permanent URL in 1 minute, run:
```bash
./setup_ngrok.sh
```
This interactive script will:
1. Ask for your free authtoken from [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
2. Ask for your free static domain from [dashboard.ngrok.com/cloud-edge/domains](https://dashboard.ngrok.com/cloud-edge/domains) (e.g. `your-app.ngrok-free.app`)
3. Automatically save it to `.env`

Once setup, simply run:
```bash
./start.sh
```
Your live URL will **NEVER CHANGE**, **NEVER EXPIRE**, and **NEVER DROP**!
- **Permanent Website URL**: `https://<your-domain>.ngrok-free.app`
- **Permanent Scanner Link**: `https://<your-domain>.ngrok-free.app/scanner`

---

### 3. Alternative: Cloudflare Named Tunnel
If you have a domain managed on Cloudflare:
1. Create a Cloudflare Tunnel in the Cloudflare Zero Trust dashboard.
2. Add your tunnel token to `.env`:
   ```bash
   CLOUDFLARE_TUNNEL_TOKEN="your-token-here"
   ```
3. Run `./tunnel.sh`. It connects directly with zero downtime.

---

## 📱 Mobile App (Flutter) Persistence

The mobile app has been updated to **remember your backend URL across reboots**:
- Open the app → Navigate to **Account Profile** tab.
- Tap the **Server URL** setting.
- Enter your live URL (e.g. `https://waste2worth-live.loca.lt` or `https://waste2worth-ai.ngrok-free.app`).
- Tap **Save**. The URL is saved permanently in device storage (`SharedPreferences`) and will not reset when you restart the app.

---

## ☁️ Solution 2: Permanent 24/7 Cloud Hosting (No Laptop Needed)

If you want a live URL that stays active 24/7 even when your laptop is closed:

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: persistent live tunnel and cloud deployment config"
git push origin main
```

### Step 2: Create Free PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com) and create a free project named `waste2worth`.
2. Copy the PostgreSQL connection URI:
   ```
   postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/waste2worth?sslmode=require
   ```

### Step 3: Deploy Backend on Render
1. Go to [Render.com](https://render.com) → **New +** → **Blueprint**.
2. Connect your `Waste2Worth-AI` GitHub repository.
3. Render reads [`render.yaml`](./render.yaml).
4. Set `DATABASE_URL` to your Neon connection string.
5. Click **Apply**. Render assigns a permanent backend URL like:
   `https://waste2worth-backend.onrender.com`

### Step 4: Deploy Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com) → **Add New...** → **Project**.
2. Select your `Waste2Worth-AI` repository.
3. Set **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:
   - `BACKEND_INTERNAL_URL` = `https://waste2worth-backend.onrender.com`
5. Click **Deploy**. Vercel will give you a permanent live production domain:
   `https://waste2worth-ai.vercel.app`

---

## 🛑 Stopping Services
To cleanly stop all local servers and background tunnels at any time:
```bash
./stop.sh
```
