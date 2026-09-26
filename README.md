# 🌍 Waste2Worth AI
### AI-Powered Community Waste Reporting, Classification & Rewards Platform
**Theme: "Waste-to-Worth Innovation Challenge"**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-000000.svg?style=flat&logo=next.js)](https://nextjs.org)
[![PyTorch ResNet18](https://img.shields.io/badge/AI_Model-PyTorch%20ResNet18-EE4C2C.svg?style=flat&logo=pytorch)](https://pytorch.org)
[![Accuracy](https://img.shields.io/badge/Val_Accuracy-87.89%25-brightgreen.svg)]()
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2018-336791.svg?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Hardware Acceleration](https://img.shields.io/badge/Inference-Apple%20Silicon%20MPS-black.svg)]()

---

## 📌 Executive Overview

**Waste2Worth** is an end-to-end, production-grade civic sanitation platform engineered for the **Waste-to-Worth Innovation Challenge**. It converts everyday municipal litter and improper dumping into a transparent, circular economy through a verified three-role workflow:

1. **Citizens** identify and report municipal waste using a real-time **WebRTC camera scanner** powered by our custom-trained **ResNet-18 neural network**, earning gamified **Eco-Points** for verified civic participation.
2. **Waste Collectors** receive geocoded collection dispatches, plan optimized routes via an interactive **GIS Map**, execute cleanups, and submit **before/after photographic proof**.
3. **Municipal Administrators** operate an executive command center to verify incidents, monitor automated **density-based waste hotspots**, dispatch collection crews, audit cleanup evidence, and track **landfill diversion rates** and **avoided CO₂ emissions**.

---

## 🧠 The AI Classification Engine

The core machine learning engine uses a custom-trained **PyTorch ResNet-18** model trained specifically on real-world municipal waste streams.

| Metric | Specification |
| :--- | :--- |
| **Model Weights** | `waste2worth_resnet18.pth` (44.8 MB) |
| **Class Mapping** | `class_names.json` (7 discrete waste categories) |
| **Total Dataset** | **14,279 images** (11,423 training / 2,856 validation) |
| **Validation Accuracy** | **87.89%** |
| **Inference Hardware** | Apple Silicon MPS (`torch.backends.mps.is_available()`) with CUDA and CPU fallback |
| **Input Shape** | 224 × 224 × 3 RGB Tensor (Bilinear resize to 256 + center crop) |
| **Normalization** | ImageNet standard: mean `[0.485, 0.456, 0.406]`, std `[0.229, 0.224, 0.225]` |
| **Inference Latency** | **~22 ms** on Apple Silicon Metal Performance Shaders |

### 7 Target Waste Classes

```
0: cardboard  ──► Biodegradable packaging, shipping boxes, corrugated fiberboard
1: e-waste    ──► Circuit boards, lithium batteries, peripherals, cables, appliances
2: glass      ──► Clear/colored beverage bottles, glass jars, cullet
3: medical    ──► PPE, blister packs, bio-waste packaging (flagged for priority handling)
4: metal      ──► Aluminum beverage cans, tin containers, steel scrap
5: paper      ──► Office paper, newspapers, magazines, brochures
6: plastic    ──► HDPE/PET bottles, single-use food containers, polymers
```

---

## 🔄 End-to-End Incident State Machine

Every report progresses through a strict, auditable lifecycle with automated eco-point triggers:

```mermaid
graph TD
    A[Citizen Camera Scan & Submit] -->|Status: PENDING +10 pts| B(Admin Verification Queue)
    B -->|Admin Rejects| R[Status: REJECTED]
    B -->|Admin Approves +20 pts| C[Status: VERIFIED]
    C -->|Admin Dispatches Collector| D[Status: ASSIGNED]
    D -->|Collector Accepts Dispatch| E[Status: IN_PROGRESS]
    E -->|Collector Uploads Before/After Evidence| F[Status: COLLECTED]
    F -->|Admin Reviews Photographic Evidence| G[Status: COMPLETED +50 pts]
```

### Automated Gamification Schedule
- **+10 Points**: Instant award when a citizen logs a geolocated report with AI scan.
- **+20 Points**: Awarded when municipal admin verifies report legitimacy.
- **+50 Points**: Awarded to the reporting citizen once the waste collector's cleanup evidence is approved by admin.
- **Badge Unlocks**: Automatically evaluated against total reports and completed cleanups (e.g., *Eco Scout*, *Neighborhood Champion*, *Recycle Master*, *Waste Warrior*).

---

## 👥 Three Dedicated Role Interfaces

### 1. Citizen Portal (`/dashboard`, `/scanner`, `/report`, `/rewards`, `/leaderboard`)
- **Live Camera HUD Scanner**: WebRTC camera feed with square targeting frame matching `camera_test.py` guidelines. Real-time classification badge showing predicted class, confidence %, and 7-class probability bars.
- **Report Waste Form**: Automatically prefills classification from camera scan, captures HTML5 geolocation (`navigator.geolocation`) with reverse-geocoded address, and uploads incident images.
- **Incident Timeline & Audit**: Visual 7-step tracker for every submission (`/my-reports/[id]`), showing historical timestamps, acting users, and raw AI classification confidence.
- **Rewards Catalog & Badges**: Browse redeemable civic perks (Bus transit passes, municipal compost bags, community cafe vouchers) and track earned achievement badges.
- **Civic Leaderboard**: Privacy-conscious neighborhood leaderboard celebrating top environmental contributors.

### 2. Waste Collector Portal (`/collector/dashboard`, `/collector/tasks`, `/collector/map`, `/collector/profile`)
- **Task Management Board**: Filter dispatches by priority (`URGENT`, `HIGH`, `MEDIUM`, `LOW`) and status (`ASSIGNED`, `IN_PROGRESS`, `COLLECTED`).
- **GIS Route Map**: Interactive Leaflet map plotting assigned waste pickups across the city with custom map pins.
- **Field Evidence Capture**: Integrated photo capture for **BEFORE** (initial dumping site) and **AFTER** (restored/cleared site) photographic proof.
- **One-Tap Workflow Actions**: Transition task from `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COLLECTED`.

### 3. Municipal Admin Portal (`/admin/dashboard`, `/admin/reports`, `/admin/map`, `/admin/tasks`, `/admin/collectors`, `/admin/citizens`, `/admin/analytics`, `/admin/settings`)
- **Executive Command Center**: High-level municipal telemetry, active workforce count, pending review alerts, and recent high-density clusters.
- **Tactical GIS Hotspot Map**: Real-time Leaflet GIS mapping with dynamic clustering for high-density dumping zones and category-based marker filtering.
- **Incident Moderation Board**: Verify or reject citizen reports with reviewer comments.
- **Collector Dispatcher**: Dispatch available sanitation workforce based on service sector and task workload.
- **Evidence Audit Board**: Side-by-side comparison of **BEFORE vs. AFTER** cleanup photos before approving task closure.
- **Waste Intelligence & Sustainability Analytics**: EPA WARM model approximations for landfill diversion percentage, biomass diverted (kg), and avoided greenhouse gas emissions (kg CO₂e).
- **System & Model Telemetry**: Live configuration panel displaying ResNet-18 weights info, dataset sizes, and PostgreSQL connection health.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Leaflet GIS |
| **Backend** | FastAPI, Uvicorn (ASGI), Pydantic v2, Python-Jose (JWT), Passlib / Bcrypt |
| **AI / ML** | PyTorch 2.0+, Torchvision, PIL, NumPy (MPS Metal Performance Shaders / CUDA) |
| **Database** | PostgreSQL 18, SQLAlchemy 2.1 ORM, Psycopg 3 binary driver |
| **Storage** | Local persistent file storage (`backend/uploads/reports`, `backend/uploads/evidence`) |

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 14+ (tested on PostgreSQL 18)

### 2. Database Setup
Ensure PostgreSQL is running locally on port 5432 and create the `waste2worth` database:

```bash
# Connect to PostgreSQL and create database
psql -U postgres -c "CREATE DATABASE waste2worth;"
```

### 3. Backend Setup
Create your environment file and install dependencies:

```bash
cd backend
cp .env.example .env

# Verify database connection string in backend/.env:
# DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/waste2worth
```

Seed the database with roles, sample users, badges, rewards, and demo waste reports:
```bash
python seed_data.py
```

Start the FastAPI server:
```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
*The backend API and Swagger interactive docs will be available at `http://127.0.0.1:8000/docs`.*

### 4. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*The frontend application will be running at `http://localhost:3000`.*

---

## 🧪 Automated End-to-End Verification

A comprehensive automated test script tests the full competition pipeline across all roles and the real PyTorch model:

```bash
python3 backend/test_e2e_flow.py
```

**Verified Test Output:**
```
==================================================
Testing Complete Waste2Worth End-to-End Workflow
==================================================

1. Logging in as Citizen...
   ✓ Logged in as: Alex Morgan | Initial points: 80

2. Testing ResNet18 Model Classification (/api/predict)...
   ✓ AI Predicted: e-waste (98.55%)
   ✓ Model: ResNet18-Waste2Worth-v1.0
   ✓ Top 7 Probabilities: ['cardboard', 'e-waste', 'glass', 'medical', 'metal', 'paper', 'plastic']

3. Citizen submitting new waste incident report...
   ✓ Created Report: W2W-1009 (Status: PENDING)
   ✓ Image stored at: /uploads/reports/0c9e2a86f3f94443bd6acc4b26c47e85.jpg

4. Logging in as Admin...
   ✓ Admin verifying report W2W-1009 (+20 pts to citizen)...
   ✓ Report verified! New status: VERIFIED

5. Admin dispatching Waste Collector...
   Selected Collector: David Rodriguez (COL-101)
   ✓ Dispatched Task f0e67ce7-9186-4a09-b31a-1f5b0ee3f0f1 with priority: URGENT

6. Logging in as Waste Collector...
   ✓ Collector transitioning task to IN_PROGRESS...
   ✓ Collector uploading BEFORE evidence photo...
   ✓ Collector uploading AFTER evidence photo...
   ✓ Collector marking task COLLECTED...
   ✓ Task status is now: COLLECTED

7. Admin reviewing cleanup proof and granting completion (+50 pts)...
   ✓ Task approved as COMPLETED!

8. Checking Citizen final rewards balance...
   ✓ Previous balance: 80 pts
   ✓ Final balance:    160 pts
   ✓ Points earned:    +80 pts (+10 submit + 20 verify + 50 complete)

==================================================
SUCCESS: Full Waste2Worth Competition Lifecycle Verified!
==================================================
```

---

## 🎭 Competition Demonstration Script (For Evaluators)

To test the multi-role platform during live demonstration:

### Default Pre-Seeded Credentials
Use the **1-Click Role Switcher** in the top navigation bar or log in with these credentials:

| Role | Email | Password | Primary Interface |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@waste2worth.org` | `admin123` | `/admin/dashboard` |
| **Collector** | `collector@waste2worth.org` | `collector123` | `/collector/dashboard` |
| **Citizen** | `citizen@waste2worth.org` | `citizen123` | `/dashboard` |

### 3-Minute Live Demo Flow:
1. **Citizen Scan & Report**:
   - Navigate to `http://localhost:3000` and switch role to **Citizen**.
   - Open `/scanner` to see the WebRTC camera targeting box or upload any image (e.g. plastic bottle or e-waste).
   - Observe the real ResNet-18 prediction and confidence breakdown.
   - Click **"Create Waste Report"** to submit with GPS coordinates. Observe `+10 Eco-Points` credited.
2. **Admin Verification & Dispatch**:
   - Use the navbar switcher to toggle to **Admin**.
   - Navigate to `/admin/reports` to see the new `PENDING` incident.
   - Click **"Verify Report"** (+20 Eco-Points awarded to citizen).
   - Click **"Dispatch Collector"**, select `David Rodriguez (COL-101)` with `URGENT` priority.
3. **Collector Field Cleanup & Photo Evidence**:
   - Use the navbar switcher to toggle to **Collector**.
   - Open `/collector/dashboard` to view the assigned task.
   - Click into the task, update status to `IN_PROGRESS`.
   - Upload **BEFORE** and **AFTER** cleanup photos and set status to `COLLECTED`.
4. **Admin Approval & Completion**:
   - Switch back to **Admin** and navigate to `/admin/tasks`.
   - View the side-by-side photographic evidence comparison.
   - Click **"Approve & Mark Completed"**.
5. **Reward & Analytics Verification**:
   - Switch to **Citizen** $\rightarrow$ navigate to `/my-reports` to view the completed 7-stage audit timeline.
   - Navigate to `/rewards` to see total `+80 Eco-Points` earned and badge unlocks.
   - Switch to **Admin** $\rightarrow$ open `/admin/analytics` to view the updated 7-class distribution, diversion rates, and avoided CO₂ metrics.

---

## 📂 Project Structure

```
Waste2Worth_AI/
├── README.md                      # Comprehensive project documentation
├── class_names.json               # 7-class labels (cardboard, e-waste, glass, etc.)
├── waste2worth_resnet18.pth       # Custom PyTorch ResNet-18 model weights (44.8 MB)
├── camera_test.py                 # Original OpenCV camera testing script
│
├── backend/                       # Production FastAPI Backend
│   ├── main.py                    # App entrypoint, CORS, static uploads, health & predict
│   ├── seed_data.py               # Database seeder for demo roles, users & reports
│   ├── test_e2e_flow.py           # Automated end-to-end integration test
│   ├── uploads/                   # Media directory for report photos and evidence
│   │   ├── reports/
│   │   └── evidence/
│   └── app/
│       ├── api/
│       │   ├── deps.py            # JWT authentication & RBAC dependencies
│       │   └── v1/
│       │       ├── admin.py       # Admin endpoints (stats, GIS hotspots, dispatches)
│       │       ├── auth.py        # Registration, login, profile (/me)
│       │       ├── citizen.py     # Citizen reports, rewards catalog, badges
│       │       ├── collector.py   # Collector tasks, status transitions, evidence upload
│       │       └── predict.py     # AI inference endpoint (/api/predict)
│       ├── core/
│       │   ├── config.py          # Environment settings (DATABASE_URL, JWT secret)
│       │   └── security.py        # Bcrypt password hashing & JWT token encoding
│       ├── db/
│       │   └── session.py         # SQLAlchemy engine & session factory
│       ├── models/                # PostgreSQL SQLAlchemy ORM models
│       │   ├── collector.py       # Collector, CollectionTask, CollectionEvidence
│       │   ├── location.py        # Geocoded locations
│       │   ├── report.py          # WasteReport, AIPrediction, ReportStatusHistory
│       │   ├── reward.py          # Reward, RewardTransaction, Badge, UserBadge
│       │   └── user.py            # User, Role, UserRoleEnum
│       ├── schemas/               # Pydantic v2 schemas for request/response validation
│       └── services/
│           ├── ai_service.py      # ResNet-18 singleton, device auto-detect, normalization
│           ├── rewards_service.py # Points allocation engine & automatic badge awards
│           └── storage_service.py # Image upload validation & filesystem persistence
│
└── frontend/                      # Next.js 14 App Router Frontend
    ├── package.json
    ├── tailwind.config.ts
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx         # Responsive navigation with 1-click role switcher
    │   │   └── Footer.tsx         # Platform footer & municipal credentials
    │   ├── lib/
    │   │   ├── api.ts             # Typed REST API client for all roles
    │   │   ├── auth-context.tsx   # Auth state provider & quick demo switcher
    │   │   └── types.ts           # Shared TypeScript interfaces
    │   └── app/
    │       ├── layout.tsx         # Global root layout
    │       ├── page.tsx           # High-impact landing page
    │       ├── dashboard/         # Citizen dashboard
    │       ├── scanner/           # WebRTC Camera HUD scanner matching camera_test.py
    │       ├── report/            # Waste reporting form with geolocation
    │       ├── my-reports/        # Citizen report history & detailed 7-step timeline
    │       ├── rewards/           # Rewards store & unlocked achievement badges
    │       ├── leaderboard/       # Civic community rankings
    │       ├── collector/
    │       │   ├── dashboard/     # Collector task board & active pickup queue
    │       │   ├── tasks/         # Task queue & before/after evidence capture
    │       │   ├── map/           # Interactive Leaflet routing map
    │       │   └── profile/       # Collector credentials & completed cleanups
    │       └── admin/
    │           ├── dashboard/     # Executive command dashboard
    │           ├── reports/       # Report moderation & collector dispatching
    │           ├── map/           # Tactical GIS Map with automated density clustering
    │           ├── tasks/         # Cleanup evidence audit (Before vs. After proof)
    │           ├── collectors/    # Sanitation workforce management
    │           ├── citizens/      # Civic community participant directory
    │           ├── analytics/     # 7-category waste intelligence & CO2 metrics
    │           └── settings/      # ResNet-18 model telemetry & platform settings
```

---

## 🏆 Engineering Competition Alignment

This project directly fulfills all core criteria of the **Waste-to-Worth Innovation Challenge**:
1. **Real-World Impact**: Eliminates unmonitored street dumping by connecting community vigilance directly to municipal sanitation logistics.
2. **Authentic AI Integration**: Preserves and utilizes the genuine PyTorch ResNet-18 model trained on 14,279 images across 7 classes with 87.89% validation accuracy — without placeholders or external black-box APIs.
3. **Enterprise Architecture**: Built on PostgreSQL with atomic transactions, full audit history tracking, role-based access control, and asynchronous hardware acceleration.
4. **Behavioral Gamification**: Closes the loop with immediate civic rewards, driving sustainable citizen participation through tangible community incentives.

---
*Developed for the Waste-to-Worth Innovation Challenge.*
