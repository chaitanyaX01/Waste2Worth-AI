import os
from PIL import Image, ImageDraw, ImageFont

print("Generating high-definition architecture blueprint matching template colors...")

# Image dimensions
W, H = 2000, 960
img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)

def get_font(size, bold=False):
    font_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf"
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_card(draw, box, fill_color, border_color=None, border_width=1, radius=12):
    draw.rounded_rectangle(box, radius=radius, fill=fill_color, outline=border_color, width=int(border_width) if border_color else 0)

# ==============================================================================
# MAIN BACKGROUND CONTAINER (Matches Sociothon off-white canvas with blue-slate border)
# ==============================================================================
draw_card(draw, [20, 20, W - 20, H - 20], "#FFFFFF", "#94A3B8", border_width=2, radius=18)

# Title Header Card
draw_card(draw, [35, 35, W - 35, 105], "#F8FAFC", "#CBD5E1", border_width=1, radius=12)
draw.text((W // 2, 58), "Waste2Worth AI — Enterprise System Architecture Blueprint", font=get_font(24, bold=True), fill="#0F172A", anchor="mm")
draw.text((W // 2, 88), "Decoupled 4-Tier Architecture  •  Flutter Cross-Platform Client  •  FastAPI REST Gateway  •  PyTorch ResNet-18 AI Core  •  PostgreSQL 16 ACID Ledger", font=get_font(13), fill="#475569", anchor="mm")

# ==============================================================================
# TIER 1: CLIENT & PRESENTATION LAYER (y=120..315)
# Template Royal Blue Palette: #1D4ED8, #EFF6FF, #3B82F6
# ==============================================================================
tier1_y1, tier1_y2 = 120, 315

# Tier Label Sidebar
draw_card(draw, [40, tier1_y1, 105, tier1_y2], "#EFF6FF", "#1D4ED8", border_width=2, radius=10)
# Vertical text for Client Tier
f_sidebar = get_font(12, bold=True)
letters1 = ["C", "L", "I", "E", "N", "T", " ", "T", "I", "E", "R"]
sy = tier1_y1 + 18
for char in letters1:
    draw.text((72, sy), char, font=f_sidebar, fill="#1D4ED8", anchor="mm")
    sy += 16

# 3 Client Persona Cards
client_cards = [
    (
        120, 710,
        "Citizen Mobile App", "Flutter M3 / Android",
        "#1D4ED8", "#EFF6FF",
        [
            "• AI Camera Waste Scanner: Instant 7-class photo recognition & safety guidance.",
            "• GPS Incident Geo-Tagging: Quick roadside waste reporting with coordinate locking.",
            "• EcoPoints Rewards Wallet: Earn points (+10 scan, +20 report) & track balance.",
            "• Community Leaderboard & Hotspot Risk Map: Live neighborhood hygiene stats."
        ]
    ),
    (
        730, 1320,
        "Collector Field App", "Android Native APK",
        "#059669", "#ECFDF5",
        [
            "• Automated Priority Daily Task Queue: Smart routing based on accumulation risk.",
            "• Turn-by-Turn GPS Route Navigation: Optimized dispatch paths to reduce fuel burn.",
            "• Photographic BEFORE & AFTER Proof Upload: Verifiable visual task completion.",
            "• Urgent Hazard Dispatch Alerts: Rapid isolation of toxic e-waste & bio-waste."
        ]
    ),
    (
        1340, W - 45,
        "Municipal Admin Portal", "Web & Mobile Console",
        "#4338CA", "#EEF2FF",
        [
            "• Live Spatiotemporal Risk Heatmap: Real-time city-wide dumpster overflow monitor.",
            "• Automated Crew Task Dispatching: One-click assignment to available field teams.",
            "• EcoPoints Audit & Anti-Fraud Control: Dual-verification before voucher release.",
            "• City-Wide Sanitation Analytics: Landfill diversion rates & collector efficiency KPIs."
        ]
    )
]

for x1, x2, title, badge, color, bg, bullets in client_cards:
    draw_card(draw, [x1, tier1_y1, x2, tier1_y2], "#FFFFFF", color, border_width=1.5, radius=10)
    # Header bar
    draw_card(draw, [x1, tier1_y1, x2, tier1_y1 + 38], bg, color, border_width=1, radius=10)
    draw.text((x1 + 16, tier1_y1 + 12), title, font=get_font(15, bold=True), fill=color)
    # Badge
    draw_card(draw, [x2 - 165, tier1_y1 + 8, x2 - 14, tier1_y1 + 30], "#FFFFFF", color, border_width=1, radius=6)
    draw.text((x2 - 89, tier1_y1 + 19), badge, font=get_font(10, bold=True), fill=color, anchor="mm")
    
    by = tier1_y1 + 52
    for b in bullets:
        draw.text((x1 + 16, by), b, font=get_font(11), fill="#1E293B")
        by += 25

# ==============================================================================
# DATAFLOW BUS 1 (y=325..355)
# ==============================================================================
draw_card(draw, [120, 325, W - 45, 355], "#F8FAFC", "#94A3B8", border_width=1, radius=8)
draw.text((W // 2, 340), "▼   HTTPS 1.3  •  RESTful JSON API  •  Multipart Form-Data Stream  •  Port 8000   ▼", font=get_font(12, bold=True), fill="#1E40AF", anchor="mm")

# ==============================================================================
# TIER 2: API GATEWAY & SECURITY TIER (y=365..535)
# Sociothon Indigo Palette: #4338CA, #EEF2FF, #8596CC
# ==============================================================================
tier2_y1, tier2_y2 = 365, 535

# Tier Label Sidebar
draw_card(draw, [40, tier2_y1, 105, tier2_y2], "#EEF2FF", "#4338CA", border_width=2, radius=10)
letters2 = ["G", "A", "T", "E", "W", "A", "Y"]
sy = tier2_y1 + 25
for char in letters2:
    draw.text((72, sy), char, font=f_sidebar, fill="#4338CA", anchor="mm")
    sy += 18

gateway_cards = [
    (
        120, 1020,
        "FastAPI Asynchronous Gateway Engine", "Python 3.12 / v0.111",
        "#4338CA", "#EEF2FF",
        [
            "• High-Performance ASGI Asynchronous Architecture: Sub-millisecond non-blocking request concurrency.",
            "• Automated Input Validation & Sanitation: Strict Pydantic v2 schema enforcement for all endpoints.",
            "• OpenAPI 3.0 Interactive Documentation: Real-time Swagger & ReDoc API surface at /docs.",
            "• CORS, SSL & Anti-Spam Rate Limiting: Dynamic throttling safeguarding against reporting floods."
        ]
    ),
    (
        1040, W - 45,
        "Authentication, RBAC & Security Gateway", "Firebase + JWT Security",
        "#0369A1", "#F0F9FF",
        [
            "• Firebase Phone Authentication: Verified OTP mobile sign-in ensuring 1-device 1-citizen identity.",
            "• Role-Based Access Control (RBAC): Strict cryptographic token claims (Citizen, Collector, Admin).",
            "• Secure Multipart Media Vault: Direct image stream validation with file-signature checks.",
            "• End-to-End Audit Trail Logging: Complete immutable access audit log for all municipal operations."
        ]
    )
]

for x1, x2, title, badge, color, bg, bullets in gateway_cards:
    draw_card(draw, [x1, tier2_y1, x2, tier2_y2], "#FFFFFF", color, border_width=1.5, radius=10)
    draw_card(draw, [x1, tier2_y1, x2, tier2_y1 + 38], bg, color, border_width=1, radius=10)
    draw.text((x1 + 16, tier2_y1 + 12), title, font=get_font(15, bold=True), fill=color)
    draw_card(draw, [x2 - 190, tier2_y1 + 8, x2 - 14, tier2_y1 + 30], "#FFFFFF", color, border_width=1, radius=6)
    draw.text((x2 - 102, tier2_y1 + 19), badge, font=get_font(10, bold=True), fill=color, anchor="mm")
    
    by = tier2_y1 + 52
    for b in bullets:
        draw.text((x1 + 16, by), b, font=get_font(11), fill="#1E293B")
        by += 25

# ==============================================================================
# DATAFLOW BUS 2 (y=545..575)
# ==============================================================================
draw_card(draw, [120, 545, W - 45, 575], "#F8FAFC", "#94A3B8", border_width=1, radius=8)
draw.text((W // 2, 560), "▼   Decoupled Asynchronous Inference Pipeline  •  Atomic Reward Transaction Bus   ▼", font=get_font(12, bold=True), fill="#059669", anchor="mm")

# ==============================================================================
# TIER 3: AI INTELLIGENCE & BUSINESS LOGIC (y=585..755)
# Sociothon Emerald & Cerulean Palette: #059669, #0284C7
# ==============================================================================
tier3_y1, tier3_y2 = 585, 755

# Tier Label Sidebar
draw_card(draw, [40, tier3_y1, 105, tier3_y2], "#ECFDF5", "#059669", border_width=2, radius=10)
letters3 = ["A", "I", " ", "&", " ", "C", "O", "R", "E"]
sy = tier3_y1 + 16
for char in letters3:
    draw.text((72, sy), char, font=f_sidebar, fill="#059669", anchor="mm")
    sy += 16

logic_cards = [
    (
        120, 1020,
        "Deep Learning AI Computer Vision & Risk Engine", "PyTorch 2.14 / ResNet-18",
        "#059669", "#ECFDF5",
        [
            "• PyTorch ResNet-18 Vision Model: 7 waste categories (Bio, Cardboard, E-waste, Glass, Medical, Metal, Paper).",
            "• Production Model Accuracy: 87.9% validation accuracy and 98.79% confidence on real test samples.",
            "• Automated Hazard Detection: Instant flags for lithium battery fires & bio-medical contamination risks.",
            "• Spatiotemporal Hotspot Forecasting: Predicts neighborhood overflow dumpsters 24–48 hours ahead."
        ]
    ),
    (
        1040, W - 45,
        "Civic Rewards & Proof-of-Action Ledger Engine", "ACID Gamification Core",
        "#D97706", "#FFFBEB",
        [
            "• Atomic EcoPoints Ledger Engine: Multi-tier point rewards (+10 scan, +20 report dump, +50 collect task).",
            "• Anti-Fraud Photographic Proof Verifier: Mandatory BEFORE & AFTER comparison with GPS geofence locking.",
            "• Dynamic Merchant Voucher Engine: Generates tamper-proof QR redemption codes for local green businesses.",
            "• Zero Dropped Transactions: ACID transactional guarantee ensuring balance integrity under peak morning volume."
        ]
    )
]

for x1, x2, title, badge, color, bg, bullets in logic_cards:
    draw_card(draw, [x1, tier3_y1, x2, tier3_y2], "#FFFFFF", color, border_width=1.5, radius=10)
    draw_card(draw, [x1, tier3_y1, x2, tier3_y1 + 38], bg, color, border_width=1, radius=10)
    draw.text((x1 + 16, tier3_y1 + 12), title, font=get_font(15, bold=True), fill=color)
    draw_card(draw, [x2 - 190, tier3_y1 + 8, x2 - 14, tier3_y1 + 30], "#FFFFFF", color, border_width=1, radius=6)
    draw.text((x2 - 102, tier3_y1 + 19), badge, font=get_font(10, bold=True), fill=color, anchor="mm")
    
    by = tier3_y1 + 52
    for b in bullets:
        draw.text((x1 + 16, by), b, font=get_font(11), fill="#1E293B")
        by += 25

# ==============================================================================
# DATAFLOW BUS 3 (y=765..795)
# ==============================================================================
draw_card(draw, [120, 765, W - 45, 795], "#F8FAFC", "#94A3B8", border_width=1, radius=8)
draw.text((W // 2, 780), "▼   SQLAlchemy 2.0 Async Session Pool  •  SHA-256 Verified Media Storage Vault   ▼", font=get_font(12, bold=True), fill="#475569", anchor="mm")

# ==============================================================================
# TIER 4: PERSISTENCE & STORAGE TIER (y=805..935)
# Sociothon Slate/Navy Palette: #0F172A, #F1F5F9
# ==============================================================================
tier4_y1, tier4_y2 = 805, 935

# Tier Label Sidebar
draw_card(draw, [40, tier4_y1, 105, tier4_y2], "#F1F5F9", "#0F172A", border_width=2, radius=10)
letters4 = ["D", "A", "T", "A"]
sy = tier4_y1 + 22
for char in letters4:
    draw.text((72, sy), char, font=f_sidebar, fill="#0F172A", anchor="mm")
    sy += 20

storage_cards = [
    (
        120, 1020,
        "PostgreSQL 16 Relational ACID Database", "SQLAlchemy 2.0 ORM",
        "#0F172A", "#F8FAFC",
        [
            "• Normalized Relational Schema: Users, Incidents, Tasks, EcoPoints Transactions, and Merchant Vouchers.",
            "• Geospatial & Temporal Indexing: Spatial B-tree indexing for ultra-fast latitude/longitude radius queries.",
            "• Strict Concurrency Isolation: Row-level locking preventing balance discrepancies or double point spending."
        ]
    ),
    (
        1040, W - 45,
        "Encrypted Photographic Proof & Model Vault", "Local / Cloud Object Store",
        "#334155", "#F8FAFC",
        [
            "• Timestamped BEFORE & AFTER Photo Storage: SHA-256 content-addressable storage for indisputable audit proof.",
            "• Model Artifact Vault: Pre-trained weights (waste2worth_resnet18.pth - 44.8 MB) with instant memory mapping.",
            "• Secure Evidence Export: Automated PDF/CSV compliance reports for municipal environmental audits."
        ]
    )
]

for x1, x2, title, badge, color, bg, bullets in storage_cards:
    draw_card(draw, [x1, tier4_y1, x2, tier4_y2], "#FFFFFF", color, border_width=1.5, radius=10)
    draw_card(draw, [x1, tier4_y1, x2, tier4_y1 + 34], bg, color, border_width=1, radius=10)
    draw.text((x1 + 16, tier4_y1 + 10), title, font=get_font(14, bold=True), fill=color)
    draw_card(draw, [x2 - 180, tier4_y1 + 6, x2 - 14, tier4_y1 + 28], "#FFFFFF", color, border_width=1, radius=6)
    draw.text((x2 - 97, tier4_y1 + 17), badge, font=get_font(10, bold=True), fill=color, anchor="mm")
    
    by = tier4_y1 + 46
    for b in bullets:
        draw.text((x1 + 16, by), b, font=get_font(11), fill="#1E293B")
        by += 24

# Save output
img_rgb = img.convert("RGB")
img_rgb.save("architecture_diagram.png", quality=95)
print("Successfully generated high-definition architecture_diagram.png (2000x960)!")
