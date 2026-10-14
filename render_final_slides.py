import os
import sys
from PIL import Image, ImageDraw, ImageFont

print("Rendering perfected Sociothon presentation slides matching template color palette...")

os.makedirs("final_slides", exist_ok=True)

# Font loading helper
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

def draw_rounded_card(draw, box, fill_color, border_color=None, border_width=1, radius=14):
    draw.rounded_rectangle(box, radius=radius, fill=fill_color, outline=border_color, width=int(border_width) if border_color else 0)

# ==============================================================================
# SOCIOTHON OFFICIAL TEMPLATE COLOR PALETTE
# ==============================================================================
COLOR_SOCIOTHON_NAVY = "#150D76"      # Dark gradient logo tone
COLOR_SOCIOTHON_BLUE = "#1D4ED8"      # Primary vibrant blue
COLOR_SOCIOTHON_ROYAL = "#2563EB"     # Mid-tone royal blue
COLOR_SOCIOTHON_INDIGO = "#4338CA"    # Indigo accent
COLOR_SOCIOTHON_PERIWINKLE = "#8596CC"# Table header & border tone
COLOR_SOCIOTHON_CYAN = "#0284C7"      # Accent cyan / cerulean
COLOR_SOCIOTHON_SLATE = "#0F172A"     # Deep text dark
COLOR_SOCIOTHON_MUTED = "#475569"     # Body secondary text
COLOR_ECO_GREEN = "#059669"           # Sustainability emerald accent
COLOR_BG_CARD = "#FFFFFF"             # Crisp card surface
COLOR_BG_LIGHT_BLUE = "#EFF6FF"       # Soft blue card header
COLOR_BG_LIGHT_INDIGO = "#EEF2FF"     # Soft indigo card header
COLOR_BG_LIGHT_GREEN = "#ECFDF5"      # Soft green card header

rendered_images = []

# ==============================================================================
# SLIDE 1: COVER SLIDE (CLEAN, NEAT, ATTRACTIVE & MATCHING TEMPLATE)
# Center bounds: x=280..1160 (leaves 30px clear from robot on right & brain on left)
# ==============================================================================
s1 = Image.open("template_slide_images/slide_1.png").convert("RGBA")
d1 = ImageDraw.Draw(s1)

# Floating center card (x=280..1160, y=515..755)
draw_rounded_card(d1, [280, 515, 1160, 755], COLOR_BG_CARD, COLOR_SOCIOTHON_ROYAL, border_width=1.5, radius=18)

# Subtle top accent bar inside card
draw_rounded_card(d1, [280, 515, 1160, 523], COLOR_SOCIOTHON_ROYAL, radius=4)

# Project Title
d1.text((720, 545), "Waste2Worth AI", font=get_font(30, bold=True), fill=COLOR_SOCIOTHON_BLUE, anchor="mm")

# Subtitle
d1.text((720, 578), "AI-Powered Community Waste Segregation, Hotspot Prediction & EcoPoints Rewards", font=get_font(15, bold=True), fill=COLOR_SOCIOTHON_SLATE, anchor="mm")

# Team & Track Badges
draw_rounded_card(d1, [330, 600, 480, 626], COLOR_BG_LIGHT_BLUE, COLOR_SOCIOTHON_BLUE, border_width=1, radius=8)
d1.text((405, 613), "TEAM: BRUTAL", font=get_font(11, bold=True), fill=COLOR_SOCIOTHON_BLUE, anchor="mm")

draw_rounded_card(d1, [495, 600, 1110, 626], "#F8FAFC", COLOR_SOCIOTHON_PERIWINKLE, border_width=1, radius=8)
d1.text((802, 613), "Theme: Clean Environment, Smart Cities & Circular Economy", font=get_font(11, bold=True), fill=COLOR_SOCIOTHON_INDIGO, anchor="mm")

# Team Members
d1.text((720, 646), "Chaitanya Anap  •  Anived Thulkar  •  Aryan Gham", font=get_font(14, bold=True), fill=COLOR_SOCIOTHON_SLATE, anchor="mm")
d1.text((720, 670), "Dept. of Instrumentation & Control Engineering • Vishwakarma Institute of Technology (VIT Pune)", font=get_font(12), fill=COLOR_SOCIOTHON_MUTED, anchor="mm")

# Tech Pills (Sociothon harmonized)
badges = [
    ("PyTorch ResNet-18", COLOR_BG_LIGHT_GREEN, COLOR_ECO_GREEN),
    ("FastAPI Gateway", COLOR_BG_LIGHT_BLUE, COLOR_SOCIOTHON_BLUE),
    ("Flutter M3 Mobile", COLOR_BG_LIGHT_INDIGO, COLOR_SOCIOTHON_INDIGO),
    ("PostgreSQL 16", "#F0FDF4", "#16A34A"),
    ("IBM BOB Decoupled", "#FFFBEB", "#D97706")
]
bx = 330
for btext, bbg, bfg in badges:
    bw = len(btext) * 8 + 22
    draw_rounded_card(d1, [bx, 695, bx + bw, 726], bbg, bfg, border_width=1, radius=8)
    d1.text((bx + bw // 2, 710), btext, font=get_font(11, bold=True), fill=bfg, anchor="mm")
    bx += bw + 12

# Subtle hackathon subtext
d1.text((720, 742), "National Social Innovation Hackathon • Sociothon'26 • 1M1B & PRISM", font=get_font(10, bold=True), fill="#94A3B8", anchor="mm")

s1_rgb = s1.convert("RGB")
s1_rgb.save("final_slides/slide_1.png")
rendered_images.append(s1_rgb)
print("Rendered slide 1 (neat, clean, attractive)")

# ==============================================================================
# SLIDE 2: TEAM NAME & MEMBERS (3 MEMBERS ONLY, 4TH ROW COMPLETELY BLANK)
# ==============================================================================
s2 = Image.open("template_slide_images/slide_2.png").convert("RGBA")
d2 = ImageDraw.Draw(s2)

# Write Team Name right beside "Team Name:" matching template font, size, weight & baseline
d2.text((540, 123), "Brutal", font=get_font(50, bold=True), fill="#000000")

f_cell_bold = get_font(13, bold=True)
f_cell = get_font(12)
f_email = get_font(11)

# Row 1: Chaitanya Anap (Team Lead)
d2.text((180, 385), "Chaitanya Anap", font=f_cell_bold, fill=COLOR_SOCIOTHON_SLATE)
d2.text((180, 404), "(Team Lead & AI Architect)", font=get_font(11, bold=True), fill=COLOR_SOCIOTHON_BLUE)
d2.text((445, 395), "Instrumentation & Control Engg.", font=f_cell, fill=COLOR_SOCIOTHON_SLATE)
d2.text((690, 396), "chaitanya112233456@gmail.com", font=f_email, fill=COLOR_SOCIOTHON_BLUE)
d2.text((965, 395), "8421307163", font=f_cell_bold, fill=COLOR_SOCIOTHON_SLATE)
d2.text((1125, 388), "Vishwakarma Institute", font=f_cell, fill=COLOR_SOCIOTHON_SLATE)
d2.text((1125, 405), "of Technology (VIT Pune)", font=get_font(11), fill=COLOR_SOCIOTHON_MUTED)

# Row 2: Anived Thulkar
d2.text((180, 450), "Anived Thulkar", font=f_cell_bold, fill=COLOR_SOCIOTHON_SLATE)
d2.text((180, 469), "(Full-Stack & Systems)", font=get_font(11), fill=COLOR_SOCIOTHON_MUTED)
d2.text((445, 460), "Instrumentation & Control Engg.", font=f_cell, fill=COLOR_SOCIOTHON_SLATE)
d2.text((690, 461), "anived.1251140083@vit.edu", font=f_email, fill=COLOR_SOCIOTHON_BLUE)
d2.text((965, 460), "9766329400", font=f_cell_bold, fill=COLOR_SOCIOTHON_SLATE)
d2.text((1125, 453), "Vishwakarma Institute", font=f_cell, fill=COLOR_SOCIOTHON_SLATE)
d2.text((1125, 470), "of Technology (VIT Pune)", font=get_font(11), fill=COLOR_SOCIOTHON_MUTED)

# Row 3: Aryan Gham
d2.text((180, 515), "Aryan Gham", font=f_cell_bold, fill=COLOR_SOCIOTHON_SLATE)
d2.text((180, 534), "(IoT, Mobile & Analytics)", font=get_font(11), fill=COLOR_SOCIOTHON_MUTED)
d2.text((445, 525), "Instrumentation & Control Engg.", font=f_cell, fill=COLOR_SOCIOTHON_SLATE)
d2.text((690, 526), "aryan.1251140212@vit.edu", font=f_email, fill=COLOR_SOCIOTHON_BLUE)
d2.text((965, 525), "7507088461", font=f_cell_bold, fill=COLOR_SOCIOTHON_SLATE)
d2.text((1125, 518), "Vishwakarma Institute", font=f_cell, fill=COLOR_SOCIOTHON_SLATE)
d2.text((1125, 535), "of Technology (VIT Pune)", font=get_font(11), fill=COLOR_SOCIOTHON_MUTED)

# ROW 4: COMPLETELY BLANK! (As requested: "we are only 3 member so put 4th member information blanked")
# NO TEXT DRAWN IN ROW 4!

# Project Scope card below table (matching template periwinkle #8596CC)
draw_rounded_card(d2, [166, 632, 1303, 765], "#F8FAFC", COLOR_SOCIOTHON_PERIWINKLE, border_width=1.5, radius=16)
d2.text((195, 646), "Project Scope & Societal Commitment", font=get_font(16, bold=True), fill=COLOR_SOCIOTHON_SLATE)
d2.text((195, 675), "• Mission: Transform urban waste management from reactive complaints into a proactive, gamified circular economy.\n• Citizen Empowerment: Real-time AI classification with instant EcoPoints rewards for source segregation.\n• Operational Intelligence: Spatiotemporal predictive risk analytics guiding municipal collection crews before dumpsters overflow.", font=get_font(13), fill=COLOR_SOCIOTHON_MUTED)

s2_rgb = s2.convert("RGB")
s2_rgb.save("final_slides/slide_2.png")
rendered_images.append(s2_rgb)
print("Rendered slide 2 (font matched, 3 members only, Row 4 blanked)")

# ==============================================================================
# SLIDE 3: GLE COURSE CERTIFICATES (CERTIFICATES PLACED IN DESIGNATED BOXES)
# ==============================================================================
s3 = Image.open("template_slide_images/slide_3.png").convert("RGBA")
d3 = ImageDraw.Draw(s3)

# Embed certificates into designated template boxes:
# Box 1 (Top-Left): Chaitanya Anap -> certificate.png
# Box 2 (Top-Right): Anived Thulkar -> certificate2.png
# Box 3 (Bottom-Left): Aryan Gham -> certificate1.png
# Box 4 (Bottom-Right): Blank (Team Brutal has 3 members)
cert_boxes = [
    ("certificate.png", 220, 193, 624, 465),
    ("certificate2.png", 766, 193, 1171, 465),
    ("certificate1.png", 220, 501, 624, 772)
]

for cert_file, x1, y1, x2, y2 in cert_boxes:
    if os.path.exists(cert_file):
        cert_img = Image.open(cert_file).convert("RGBA")
        bw, bh = x2 - x1 + 1, y2 - y1 + 1
        cert_resized = cert_img.resize((bw, bh), Image.Resampling.LANCZOS)
        s3.paste(cert_resized, (x1, y1), cert_resized)
        d3.rectangle([x1, y1, x2, y2], outline=COLOR_SOCIOTHON_ROYAL, width=2)

s3_rgb = s3.convert("RGB")
s3_rgb.save("final_slides/slide_3.png")
rendered_images.append(s3_rgb)
print("Rendered slide 3 with all 3 certificates in appropriate boxes!")

# ==============================================================================
# SLIDE 4: THEME NAME, PROBLEM STATEMENT, DESCRIBE PROBLEM
# Palette: Sociothon Royal Blue & Periwinkle
# ==============================================================================
s4 = Image.open("template_slide_images/slide_4.png").convert("RGBA")
d4 = ImageDraw.Draw(s4)

# Top Executive Banner cleanly covering template prompts from y=85 to 348
draw_rounded_card(d4, [130, 85, 1310, 348], COLOR_BG_CARD, COLOR_SOCIOTHON_PERIWINKLE, border_width=1.5, radius=16)

# Theme pill (matching template blue)
draw_rounded_card(d4, [155, 105, 760, 140], COLOR_BG_LIGHT_BLUE, COLOR_SOCIOTHON_BLUE, border_width=1, radius=10)
d4.text((170, 114), "THEME: CLEAN ENVIRONMENT, SMART CITIES & CIRCULAR ECONOMY", font=get_font(12, bold=True), fill=COLOR_SOCIOTHON_BLUE)

# Problem Statement Header & Text
d4.text((155, 155), "Problem Statement: The Urban Waste Segregation Crisis & Municipal Disconnect", font=get_font(19, bold=True), fill=COLOR_SOCIOTHON_SLATE)
d4.text((155, 192), "India generates over 62 million tonnes of municipal solid waste annually, yet less than 28% is segregated at source.\nToxic e-waste batteries and bio-medical waste mix into domestic bins, while collection trucks follow static, blind schedules.\nDriven by an absence of civic rewards and lack of predictive overflow intelligence, cities suffer illegal dumping,\nsevere environmental toxicity, and overwhelmed landfills.", font=get_font(14), fill=COLOR_SOCIOTHON_MUTED)

# Bottom Section: Three Problem Pillar Cards (y=358 to 760)
pillars = [
    (
        130, 500,
        "1. Zero Source Segregation",
        "#DC2626", "#FEF2F2",
        [
            "• 62M+ tonnes generated annually;",
            "  less than 28% segregated at source.",
            "• Hazardous e-waste (lithium batteries)",
            "  and medical bio-waste mix in daily trash.",
            "• Contaminates recyclables, turning",
            "  recoverable materials into landfill heaps.",
            "• Exposes sanitation workers to toxic",
            "  leachate, heavy metals, and sharp cuts."
        ]
    ),
    (
        535, 905,
        "2. Reactive Municipal Ops",
        "#D97706", "#FFFBEB",
        [
            "• Waste collection trucks follow fixed,",
            "  blind routes without real-time fullness data.",
            "• Zero predictive insights leaves overflow",
            "  unattended until public complaints escalate.",
            "• High municipal fuel burn and vehicle wear",
            "  driving through clean zones while bins overflow.",
            "• No digital audit trail to verify whether",
            "  assigned cleanup tasks were executed."
        ]
    ),
    (
        940, 1310,
        "3. Absence of Civic Trust",
        COLOR_SOCIOTHON_BLUE, COLOR_BG_LIGHT_BLUE,
        [
            "• Municipal grievance portals act as one-way",
            "  black holes where citizen reports vanish.",
            "• Citizens receive zero tangible rewards or",
            "  recognition for source segregation efforts.",
            "• Low public trust generates civic apathy,",
            "  normalizing illegal roadside dumping.",
            "• No bridge connecting eco-friendly local",
            "  businesses to sponsor citizen incentives."
        ]
    )
]

for x1, x2, title, color, bg, lines in pillars:
    draw_rounded_card(d4, [x1, 358, x2, 760], COLOR_BG_CARD, color, border_width=1.5, radius=14)
    draw_rounded_card(d4, [x1, 358, x2, 408], bg, color, border_width=1, radius=14)
    d4.text(((x1 + x2) // 2, 383), title, font=get_font(16, bold=True), fill=color, anchor="mm")
    
    ly = 428
    for line in lines:
        d4.text((x1 + 18, ly), line, font=get_font(13), fill=COLOR_SOCIOTHON_SLATE)
        ly += 22

s4_rgb = s4.convert("RGB")
s4_rgb.save("final_slides/slide_4.png")
rendered_images.append(s4_rgb)
print("Rendered slide 4")

# ==============================================================================
# SLIDE 5: PROPOSED SOLUTION
# Matching Sociothon Royal Blue, Indigo & Emerald
# ==============================================================================
s5 = Image.open("template_slide_images/slide_5.png").convert("RGBA")
d5 = ImageDraw.Draw(s5)

# Subtitle under "Proposed Solution:"
d5.text((720, 168), "An Integrated AI Vision, Geospatial Hotspot Prediction & Civic Rewards Ecosystem", font=get_font(16, bold=True), fill=COLOR_SOCIOTHON_BLUE, anchor="mm")

# 2x2 Grid of Solution Cards (y=205 to 760)
cards = [
    (
        130, 205, 700, 465,
        "1. AI Camera Waste Scanner",
        "Deep Learning Computer Vision",
        COLOR_ECO_GREEN, COLOR_BG_LIGHT_GREEN,
        [
            "• Fine-tuned PyTorch ResNet-18 model trained on 7 waste classes",
            "  (biodegradable, cardboard, e-waste, glass, medical, metal, paper, plastic).",
            "• Sub-150ms real-time inference with confidence score and disposal guide.",
            "• Instant safety alerts when toxic batteries or medical hazards are scanned."
        ]
    ),
    (
        740, 205, 1310, 465,
        "2. EcoPoints Rewards Ledger",
        "Gamified Circular Economy",
        COLOR_SOCIOTHON_BLUE, COLOR_BG_LIGHT_BLUE,
        [
            "• Instant point rewards (+10 scan, +20 report, +50 verified collection).",
            "• Redeemable for sustainable merchant discounts, grocery vouchers & perks.",
            "• Proof-of-Action anti-fraud verification: BEFORE & AFTER photo audit trail\n  with GPS geofence locking prevents spoofing."
        ]
    ),
    (
        130, 495, 700, 755,
        "3. Predictive Hotspot Analytics",
        "Spatiotemporal Overflow Forecasting",
        COLOR_SOCIOTHON_INDIGO, COLOR_BG_LIGHT_INDIGO,
        [
            "• Machine learning risk engine analyzes historical frequency and cluster density.",
            "• Predicts overflow dumpsters 24–48 hours ahead with high spatial precision.",
            "• Preemptively schedules municipal collection routes, slashing fuel use by 40%."
        ]
    ),
    (
        740, 495, 1310, 755,
        "4. Unified 3-Role Ecosystem",
        "Flutter Mobile & FastAPI Platform",
        COLOR_SOCIOTHON_CYAN, "#F0F9FF",
        [
            "• Citizen App: Material 3 UI for camera scanning, GPS reports & rewards wallet.",
            "• Collector App: Automated priority field task queue, GPS routes & photo upload.",
            "• Municipal Admin: Live city heatmaps, auto-dispatch engine & audit dashboard."
        ]
    )
]

for x1, y1, x2, y2, title, tag, color, bg, bullets in cards:
    draw_rounded_card(d5, [x1, y1, x2, y2], COLOR_BG_CARD, color, border_width=1.5, radius=14)
    draw_rounded_card(d5, [x1, y1, x2, y1 + 50], bg, color, border_width=1, radius=14)
    d5.text((x1 + 18, y1 + 15), title, font=get_font(16, bold=True), fill=color)
    d5.text((x2 - 18, y1 + 17), tag, font=get_font(12, bold=True), fill=color, anchor="ra")
    
    by = y1 + 68
    for b in bullets:
        d5.text((x1 + 20, by), b, font=get_font(13), fill=COLOR_SOCIOTHON_SLATE)
        by += 24 if "\n" not in b else 48

s5_rgb = s5.convert("RGB")
s5_rgb.save("final_slides/slide_5.png")
rendered_images.append(s5_rgb)
print("Rendered slide 5")

# ==============================================================================
# ==============================================================================
# SLIDE 6: ARCHITECTURE BLUEPRINT (HIGHLY READABLE VISUAL BLOCK DIAGRAM)
# ==============================================================================
s6 = Image.open("template_slide_images/slide_6.png").convert("RGBA")
d6 = ImageDraw.Draw(s6)

def draw_arch_arrow_down(draw, x, y1, y2, color='#2563EB', width=2, head_size=6):
    draw.line([x, y1, x, y2], fill=color, width=width)
    draw.polygon([(x - head_size, y2 - head_size), (x + head_size, y2 - head_size), (x, y2)], fill=color)

def draw_arch_arrow_right(draw, x1, y, x2, color='#2563EB', width=2, head_size=6):
    draw.line([x1, y, x2, y], fill=color, width=width)
    draw.polygon([(x2 - head_size, y - head_size), (x2 - head_size, y + head_size), (x2, y)], fill=color)

# Vector icons for architecture blocks
def draw_phone_icon(d, x, y, col):
    d.rounded_rectangle([x, y, x + 15, y + 24], radius=3, outline=col, width=2)
    d.line([x + 3, y + 4, x + 12, y + 4], fill=col, width=1)
    d.ellipse([x + 6, y + 18, x + 9, y + 21], fill=col)

def draw_truck_icon(d, x, y, col):
    d.rounded_rectangle([x, y + 5, x + 14, y + 19], radius=2, outline=col, width=2)
    d.polygon([(x + 14, y + 9), (x + 19, y + 9), (x + 23, y + 13), (x + 23, y + 19), (x + 14, y + 19)], fill=None, outline=col)
    d.ellipse([x + 3, y + 17, x + 7, y + 21], fill=col)
    d.ellipse([x + 17, y + 17, x + 21, y + 21], fill=col)

def draw_monitor_icon(d, x, y, col):
    d.rounded_rectangle([x, y + 1, x + 21, y + 16], radius=2, outline=col, width=2)
    d.line([x + 10, y + 16, x + 10, y + 21], fill=col, width=2)
    d.line([x + 5, y + 21, x + 16, y + 21], fill=col, width=2)

def draw_lightning_icon(d, x, y, col):
    points = [(x + 8, y + 1), (x + 2, y + 12), (x + 7, y + 12), (x + 5, y + 22), (x + 14, y + 9), (x + 8, y + 9)]
    d.polygon(points, fill=col)

def draw_neural_icon(d, x, y, col):
    l1 = [(x+2, y+4), (x+2, y+18)]
    l2 = [(x+10, y+2), (x+10, y+11), (x+10, y+20)]
    l3 = [(x+18, y+4), (x+18, y+18)]
    for p1 in l1:
        for p2 in l2:
            d.line([p1, p2], fill=col, width=1)
    for p2 in l2:
        for p3 in l3:
            d.line([p2, p3], fill=col, width=1)
    for px, py in l1 + l2 + l3:
        d.ellipse([px-2, py-2, px+2, py+2], fill=col)

def draw_chart_icon(d, x, y, col):
    d.line([x + 2, y + 20, x + 20, y + 20], fill=col, width=2)
    d.line([x + 2, y + 2, x + 2, y + 20], fill=col, width=2)
    d.rectangle([x + 5, y + 13, x + 8, y + 20], fill=col)
    d.rectangle([x + 10, y + 8, x + 13, y + 20], fill=col)
    d.rectangle([x + 15, y + 3, x + 18, y + 20], fill=col)

def draw_db_icon(d, x, y, col):
    d.ellipse([x, y + 1, x + 19, y + 9], outline=col, width=2)
    d.line([x, y + 5, x, y + 18], fill=col, width=2)
    d.line([x + 19, y + 5, x + 19, y + 18], fill=col, width=2)
    d.arc([x, y + 11, x + 19, y + 20], 0, 180, fill=col, width=2)

def draw_vault_icon(d, x, y, col):
    d.rounded_rectangle([x, y + 1, x + 19, y + 20], radius=3, outline=col, width=2)
    d.ellipse([x + 6, y + 7, x + 13, y + 14], outline=col, width=2)
    d.line([x + 10, y + 10, x + 15, y + 10], fill=col, width=2)

# Colors
ARCH_NAVY = "#1E3A8A"
ARCH_BLUE = "#1D4ED8"
ARCH_GREEN = "#059669"
ARCH_INDIGO = "#4338CA"
ARCH_AMBER = "#D97706"
ARCH_TEAL = "#0F766E"

# 1. TOP FLOW PIPELINE: 5-STEP CITIZEN-TO-MUNICIPALITY JOURNEY (y=206..252)
draw_rounded_card(d6, [80, 206, 1360, 252], "#F8FAFC", "#94A3B8", border_width=1.5, radius=10)
arch_steps = [
    ("1. Citizen Camera Scan", "#EFF6FF", ARCH_BLUE),
    ("2. AI ResNet-18 Vision", "#ECFDF5", ARCH_GREEN),
    ("3. Hotspot Risk Scoring", "#EEF2FF", ARCH_INDIGO),
    ("4. Optimized Route Dispatch", "#FFFBEB", ARCH_AMBER),
    ("5. EcoPoints Verification", "#F0FDFA", ARCH_TEAL)
]
step_x = 92
step_w = 220
for idx, (stext, sbg, sfg) in enumerate(arch_steps):
    draw_rounded_card(d6, [step_x, 212, step_x + step_w, 246], sbg, sfg, border_width=1.5, radius=7)
    d6.text((step_x + step_w // 2, 229), stext, font=get_font(12, bold=True), fill=sfg, anchor="mm")
    if idx < len(arch_steps) - 1:
        ax1 = step_x + step_w + 6
        ax2 = step_x + step_w + 28
        draw_arch_arrow_right(d6, ax1, 229, ax2, color="#64748B", width=2, head_size=5)
    step_x += step_w + 34

# 2. TIER 1: CLIENT FRONTENDS (y=264..390)
tier1_blocks = [
    (90, 470, "CITIZEN MOBILE APP", "Flutter M3 / Android", ARCH_BLUE, "#EFF6FF", draw_phone_icon, [
        ("AI CAMERA SCAN", "7-Class photo recognition & safety guide", "#DBEAFE", ARCH_BLUE),
        ("GPS GEO-REPORT", "Instant road waste coordinate tagging", "#F1F5F9", COLOR_SOCIOTHON_SLATE),
        ("ECOPOINTS WALLET", "Earn +10 scan / +20 report points", "#FEF3C7", ARCH_AMBER)
    ]),
    (530, 910, "COLLECTOR FIELD APP", "Android Native APK", ARCH_GREEN, "#ECFDF5", draw_truck_icon, [
        ("DAILY TASK QUEUE", "Prioritized routes by overflow urgency", "#D1FAE5", ARCH_GREEN),
        ("GPS NAVIGATION", "Turn-by-turn dispatch route optimization", "#F1F5F9", COLOR_SOCIOTHON_SLATE),
        ("PHOTO PROOF", "BEFORE & AFTER verifiable upload", "#E0E7FF", ARCH_INDIGO)
    ]),
    (970, 1350, "MUNICIPAL ADMIN PORTAL", "Web & Mobile Console", ARCH_INDIGO, "#EEF2FF", draw_monitor_icon, [
        ("HOTSPOT HEATMAP", "Real-time city dumpster overflow monitor", "#E0E7FF", ARCH_INDIGO),
        ("1-CLICK DISPATCH", "Dynamic assignment to available trucks", "#F1F5F9", COLOR_SOCIOTHON_SLATE),
        ("DIVERSION KPI", "City-wide recycling & collector metrics", "#D1FAE5", ARCH_GREEN)
    ])
]

for x1, x2, title, tech, col, bg, icon_fn, items in tier1_blocks:
    draw_rounded_card(d6, [x1, 264, x2, 390], "#FFFFFF", col, border_width=1.5, radius=10)
    draw_rounded_card(d6, [x1, 264, x2, 298], bg, col, border_width=1, radius=10)
    icon_fn(d6, x1 + 14, 269, col)
    d6.text((x1 + 42, 281), title, font=get_font(13, bold=True), fill=col, anchor="lm")
    draw_rounded_card(d6, [x2 - 145, 271, x2 - 12, 291], "#FFFFFF", col, border_width=1, radius=5)
    d6.text((x2 - 78, 281), tech, font=get_font(10, bold=True), fill=col, anchor="mm")
    
    iy = 307
    for tag, desc, tbg, tcol in items:
        draw_rounded_card(d6, [x1 + 12, iy, x1 + 128, iy + 21], tbg, tcol, border_width=1, radius=4)
        d6.text((x1 + 70, iy + 11), tag, font=get_font(9, bold=True), fill=tcol, anchor="mm")
        d6.text((x1 + 136, iy + 11), desc, font=get_font(11), fill=COLOR_SOCIOTHON_SLATE, anchor="lm")
        iy += 26

# TIER 1 TO BUS 1 CONNECTORS:
d6.line([(280, 390), (280, 401)], fill=ARCH_BLUE, width=2)
d6.line([(720, 390), (720, 401)], fill=ARCH_GREEN, width=2)
d6.line([(1160, 390), (1160, 401)], fill=ARCH_INDIGO, width=2)

# MIDDLE BUS 1:
draw_rounded_card(d6, [140, 401, 1300, 423], "#EFF6FF", ARCH_BLUE, border_width=1.5, radius=6)
d6.text((720, 412), "HTTPS REST 2.0  •  Multipart Photo Upload Stream  •  Live Telemetry WebSockets", font=get_font(11, bold=True), fill=ARCH_BLUE, anchor="mm")

# BUS 1 TO TIER 2 CONNECTORS:
draw_arch_arrow_down(d6, 280, 423, 431, color=ARCH_BLUE, width=2, head_size=5)
draw_arch_arrow_down(d6, 720, 423, 431, color=ARCH_GREEN, width=2, head_size=5)
draw_arch_arrow_down(d6, 1160, 423, 431, color=ARCH_AMBER, width=2, head_size=5)

# 3. TIER 2: GATEWAY & INTELLIGENCE ENGINES (y=432..560)
tier2_blocks = [
    (90, 470, "FASTAPI GATEWAY ENGINE", "Python 3.12 / ASGI", ARCH_BLUE, "#EFF6FF", draw_lightning_icon, [
        ("CONCURRENCY", "Sub-millisecond non-blocking ASGI runtime", "#DBEAFE", ARCH_BLUE),
        ("SECURITY", "Firebase Phone Auth + JWT Role-Based Access", "#F1F5F9", COLOR_SOCIOTHON_SLATE),
        ("VALIDATION", "Strict Pydantic v2 data schema enforcement", "#F1F5F9", COLOR_SOCIOTHON_MUTED)
    ]),
    (530, 910, "PYTORCH AI VISION CORE", "ResNet-18 Backbone", ARCH_GREEN, "#ECFDF5", draw_neural_icon, [
        ("ACCURACY", "87.9% Val Accuracy • 98.79% Test Confidence", "#D1FAE5", ARCH_GREEN),
        ("INFERENCE", "Sub-second (<120ms) fast tensor classification", "#DBEAFE", ARCH_BLUE),
        ("HAZARDS", "Urgent alerts for toxic E-waste & Bio-waste", "#FEE2E2", "#DC2626")
    ]),
    (970, 1350, "HOTSPOT & REWARDS CORE", "Predictive ML & Ledger", ARCH_AMBER, "#FFFBEB", draw_chart_icon, [
        ("PREDICTION", "24–48h Ahead spatiotemporal dumpster overflow", "#FEF3C7", ARCH_AMBER),
        ("PROOF LEDGER", "Anti-fraud Before/After photo validation", "#D1FAE5", ARCH_GREEN),
        ("VOUCHERS", "Dynamic merchant QR voucher generation", "#E0E7FF", ARCH_INDIGO)
    ])
]

for x1, x2, title, tech, col, bg, icon_fn, items in tier2_blocks:
    draw_rounded_card(d6, [x1, 432, x2, 560], "#FFFFFF", col, border_width=1.5, radius=10)
    draw_rounded_card(d6, [x1, 432, x2, 462], bg, col, border_width=1, radius=10)
    icon_fn(d6, x1 + 14, 437, col)
    d6.text((x1 + 42, 447), title, font=get_font(13, bold=True), fill=col, anchor="lm")
    draw_rounded_card(d6, [x2 - 150, 437, x2 - 12, 457], "#FFFFFF", col, border_width=1, radius=5)
    d6.text((x2 - 81, 447), tech, font=get_font(10, bold=True), fill=col, anchor="mm")
    
    iy = 472
    for tag, desc, tbg, tcol in items:
        draw_rounded_card(d6, [x1 + 12, iy, x1 + 115, iy + 22], tbg, tcol, border_width=1, radius=4)
        d6.text((x1 + 63, iy + 11), tag, font=get_font(9, bold=True), fill=tcol, anchor="mm")
        d6.text((x1 + 123, iy + 11), desc, font=get_font(11), fill=COLOR_SOCIOTHON_SLATE, anchor="lm")
        iy += 28

# CONNECTORS INSIDE TIER 2:
draw_rounded_card(d6, [474, 482, 526, 510], "#EFF6FF", ARCH_BLUE, border_width=1, radius=4)
d6.text((500, 490), "STREAM", font=get_font(8, bold=True), fill=ARCH_BLUE, anchor="mm")
draw_arch_arrow_right(d6, 486, 502, 514, color=ARCH_BLUE, width=2, head_size=4)

draw_rounded_card(d6, [914, 482, 966, 510], "#ECFDF5", ARCH_GREEN, border_width=1, radius=4)
d6.text((940, 490), "CLASSIFY", font=get_font(8, bold=True), fill=ARCH_GREEN, anchor="mm")
draw_arch_arrow_right(d6, 926, 502, 954, color=ARCH_GREEN, width=2, head_size=4)

# TIER 2 TO BUS 2 CONNECTORS:
d6.line([(390, 560), (390, 571)], fill=ARCH_NAVY, width=2)
d6.line([(1050, 560), (1050, 571)], fill=ARCH_TEAL, width=2)

# MIDDLE BUS 2:
draw_rounded_card(d6, [180, 571, 1260, 593], "#F0F4FF", ARCH_NAVY, border_width=1.5, radius=6)
d6.text((720, 582), "SQLAlchemy 2.0 Async Session Pool  •  Spatial Geofence Queries  •  Encrypted Media Vault", font=get_font(11, bold=True), fill=ARCH_NAVY, anchor="mm")

# BUS 2 TO TIER 3 CONNECTORS:
draw_arch_arrow_down(d6, 390, 593, 601, color=ARCH_NAVY, width=2, head_size=5)
draw_arch_arrow_down(d6, 1050, 593, 601, color=ARCH_TEAL, width=2, head_size=5)

# 4. TIER 3: DATA & STORAGE INFRASTRUCTURE (y=602..755)
tier3_blocks = [
    (90, 700, "POSTGRESQL 16 ACID DATABASE", "Primary Relational Ledger", ARCH_NAVY, "#EFF6FF", draw_db_icon, [
        ("RELATIONAL SCHEMAS", "Normalized Users, Incidents, Tasks & EcoPoints Ledgers", "#DBEAFE", ARCH_NAVY),
        ("SPATIAL INDEXING", "Spatial B-Tree indexing for ultra-fast GPS radius searches", "#F1F5F9", COLOR_SOCIOTHON_SLATE),
        ("ACID ISOLATION", "Strict row-level locking preventing duplicate point spending", "#D1FAE5", ARCH_GREEN)
    ]),
    (740, 1350, "EVIDENCE & MODEL REPOSITORY", "Encrypted Vault & Weights", ARCH_TEAL, "#F0FDFA", draw_vault_icon, [
        ("PHOTO EVIDENCE", "SHA-256 timestamped BEFORE & AFTER proof repository", "#CCFBF1", ARCH_TEAL),
        ("MODEL WEIGHTS", "Pre-trained ResNet-18 weights vault (waste2worth.pth)", "#F1F5F9", COLOR_SOCIOTHON_SLATE),
        ("AUDIT REPORTS", "Automated PDF/CSV reports for municipal environmental audits", "#E0E7FF", ARCH_INDIGO)
    ])
]

for x1, x2, title, tech, col, bg, icon_fn, items in tier3_blocks:
    draw_rounded_card(d6, [x1, 602, x2, 755], "#FFFFFF", col, border_width=1.5, radius=10)
    draw_rounded_card(d6, [x1, 602, x2, 638], bg, col, border_width=1, radius=10)
    icon_fn(d6, x1 + 16, 607, col)
    d6.text((x1 + 46, 619), title, font=get_font(14, bold=True), fill=col, anchor="lm")
    draw_rounded_card(d6, [x2 - 180, 608, x2 - 14, 629], "#FFFFFF", col, border_width=1, radius=5)
    d6.text((x2 - 97, 619), tech, font=get_font(10, bold=True), fill=col, anchor="mm")
    
    iy = 648
    for tag, desc, tbg, tcol in items:
        draw_rounded_card(d6, [x1 + 14, iy, x1 + 155, iy + 24], tbg, tcol, border_width=1, radius=4)
        d6.text((x1 + 84, iy + 12), tag, font=get_font(10, bold=True), fill=tcol, anchor="mm")
        d6.text((x1 + 165, iy + 12), desc, font=get_font(12), fill=COLOR_SOCIOTHON_SLATE, anchor="lm")
        iy += 33

s6_rgb = s6.convert("RGB")
s6_rgb.save("final_slides/slide_6.png")
rendered_images.append(s6_rgb)
print("Rendered slide 6 with perfected visual block diagram!")

# ==============================================================================
# SLIDE 7: ROLE OF AI IN SOLUTION / IBM TOOLS / IBM BOB
# ==============================================================================
s7 = Image.open("template_slide_images/slide_7.png").convert("RGBA")
d7 = ImageDraw.Draw(s7)

# Answer 1 Card: Sits below Q1 (y=190 to 330)
draw_rounded_card(d7, [130, 190, 1310, 332], COLOR_BG_CARD, COLOR_ECO_GREEN, border_width=1.5, radius=12)
d7.text((155, 205), "• PyTorch ResNet-18 Classifier: 7-class deep convolutional network achieving 87.9% validation accuracy and 98.79% confidence on test samples.\n• Hazardous Waste Isolation: Automated flags for high-risk streams (lithium battery risk in e-waste, pathogens in medical waste) to enforce safety.\n• Spatiotemporal Hotspot Forecasting: Statistical risk engine analyzing report frequency and spatial clusters to predict dumpsters 24–48h ahead.", font=get_font(13), fill=COLOR_SOCIOTHON_SLATE)

# Embed AI Model Card preview inside Answer 1
if os.path.exists("ai_model_card.png"):
    ai_card = Image.open("ai_model_card.png").convert("RGBA")
    ai_resized = ai_card.resize((260, 115), Image.Resampling.LANCZOS)
    s7.paste(ai_resized, (1030, 200), ai_resized)
    d7.rectangle([1030, 200, 1290, 315], outline=COLOR_ECO_GREEN, width=1)

# Answer 2 Card: Sits below Q2 (y=385 to 570)
draw_rounded_card(d7, [130, 385, 1310, 570], COLOR_BG_CARD, COLOR_SOCIOTHON_BLUE, border_width=1.5, radius=12)
d7.text((155, 400), "1. IBM SkillsBuild AI Curriculum:", font=get_font(14, bold=True), fill=COLOR_SOCIOTHON_BLUE)
d7.text((155, 423), "   Completed 'Future Forward: AI for Innovation' (Credential Plan ID: PLAN-FA448E08E2A9), gaining verified competencies in deep\n   learning architectures, convolutional neural networks, computer vision, model bias mitigation, and responsible AI governance.", font=get_font(13), fill=COLOR_SOCIOTHON_SLATE)

d7.text((155, 466), "2. IBM Enterprise Design Thinking:", font=get_font(14, bold=True), fill=COLOR_SOCIOTHON_BLUE)
d7.text((155, 489), "   Applied stakeholder empathy mapping and user journey frameworks to architect distinct, tailored role-based workflows for Citizens,\n   Sanitation Collection Crews, and Municipal Administrators.", font=get_font(13), fill=COLOR_SOCIOTHON_SLATE)

d7.text((155, 528), "3. IBM Cloud Microservice Architecture Principles:", font=get_font(14, bold=True), fill=COLOR_SOCIOTHON_BLUE)
d7.text((155, 549), "   Structured containerized, asynchronous REST services aligned with Red Hat OpenShift & IBM Cloud high-availability standards.", font=get_font(13), fill=COLOR_SOCIOTHON_SLATE)

# Answer 3 Card: Sits below Q3 (y=640 to 770)
draw_rounded_card(d7, [130, 640, 1310, 770], COLOR_BG_CARD, COLOR_SOCIOTHON_INDIGO, border_width=1.5, radius=12)
d7.text((155, 655), "Yes — IBM BOB (Build On Belief / Best of Breed Architecture) Defined Our Core Principles:", font=get_font(14, bold=True), fill=COLOR_SOCIOTHON_INDIGO)
d7.text((155, 680), "• Best-of-Breed Open Stack: Combined Flutter (Material 3 UI), PyTorch (Vision AI), FastAPI (Async Gateway), and PostgreSQL 16 (ACID Ledger).\n• High-Availability Decoupling: Asynchronously isolated computer vision inference from ledger transactions for high peak concurrency.\n• Audit-Grade Verification: Strict ledger invariants require photographic BEFORE/AFTER proof before EcoPoints reward disbursement.", font=get_font(13), fill=COLOR_SOCIOTHON_SLATE)

s7_rgb = s7.convert("RGB")
s7_rgb.save("final_slides/slide_7.png")
rendered_images.append(s7_rgb)
print("Rendered slide 7")

# ==============================================================================
# SLIDE 8: REFERENCES
# ==============================================================================
s8 = Image.open("template_slide_images/slide_8.png").convert("RGBA")
d8 = ImageDraw.Draw(s8)

# Subtitle under "References"
d8.text((720, 168), "Academic Research, Official Standards & Technical Documentation", font=get_font(16, bold=True), fill=COLOR_SOCIOTHON_BLUE, anchor="mm")

# 4 Category Cards (y=205 to 755)
ref_cards = [
    (
        130, 205, 700, 465,
        "1. Deep Learning & Computer Vision",
        COLOR_ECO_GREEN, COLOR_BG_LIGHT_GREEN,
        [
            "• He, K., Zhang, X., Ren, S., & Sun, J. (2016). 'Deep Residual",
            "  Learning for Image Recognition.' IEEE CVPR (ResNet).",
            "• PyTorch 2.x Documentation & Torchvision Model Zoo (2024).",
            "  Transfer learning with pre-trained ResNet-18 weights.",
            "• Stanford CS231n: Convolutional Neural Networks for",
            "  Visual Recognition & Spatial Feature Extraction."
        ]
    ),
    (
        740, 205, 1310, 465,
        "2. Solid Waste & Circular Standards",
        COLOR_SOCIOTHON_BLUE, COLOR_BG_LIGHT_BLUE,
        [
            "• Ministry of Housing and Urban Affairs (MoHUA), GoI (2023).",
            "  'Swachh Bharat Mission (Urban) 2.0 Operational Guidelines.'",
            "• Central Pollution Control Board (CPCB) (2022).",
            "  'Solid Waste & E-Waste Management Rules, Guidelines.'",
            "• United Nations Environment Programme (UNEP) (2024).",
            "  'Global Waste Management Outlook: Circular Systems.'"
        ]
    ),
    (
        130, 495, 700, 755,
        "3. Enterprise Architecture & System Design",
        COLOR_SOCIOTHON_INDIGO, COLOR_BG_LIGHT_INDIGO,
        [
            "• IBM SkillsBuild Curriculum: 'Future Forward: AI for",
            "  Innovation' (Credential Plan ID: PLAN-FA448E08E2A9).",
            "• IBM Garage & Red Hat Architecture Center (2024).",
            "  'Cloud-Native Microservices and Event-Driven Patterns.'",
            "• FastAPI Framework Documentation — Sebastián Ramírez (2024).",
            "  High-performance Asynchronous Python Web APIs."
        ]
    ),
    (
        740, 495, 1310, 755,
        "4. Mobile UX & Database Integrity",
        COLOR_SOCIOTHON_CYAN, "#F0F9FF",
        [
            "• Google Flutter Engineering: Material Design 3 Guidelines.",
            "  Adaptive mobile UI, camera stream binding, and state control.",
            "• PostgreSQL 16 Global Development Group (2024).",
            "  'ACID Transaction Isolation & Relational Data Integrity.'",
            "• Firebase Documentation (Google Cloud, 2024).",
            "  Phone Authentication & JWT Secure Token Lifecycle."
        ]
    )
]

for x1, y1, x2, y2, title, color, bg, lines in ref_cards:
    draw_rounded_card(d8, [x1, y1, x2, y2], COLOR_BG_CARD, color, border_width=1.5, radius=14)
    draw_rounded_card(d8, [x1, y1, x2, y1 + 48], bg, color, border_width=1, radius=14)
    d8.text((x1 + 18, y1 + 15), title, font=get_font(15, bold=True), fill=color)
    
    ly = y1 + 65
    for l in lines:
        d8.text((x1 + 20, ly), l, font=get_font(13), fill=COLOR_SOCIOTHON_SLATE)
        ly += 23

s8_rgb = s8.convert("RGB")
s8_rgb.save("final_slides/slide_8.png")
rendered_images.append(s8_rgb)
print("Rendered slide 8")

# ==============================================================================
# SLIDE 9: THANK YOU PAGE (PRISTINE TEMPLATE ONLY - ALL ADDED CONTENT REMOVED)
# ==============================================================================
s9 = Image.open("template_slide_images/slide_9.png").convert("RGB")
s9.save("final_slides/slide_9.png")
rendered_images.append(s9)
print("Rendered slide 9 (pristine template, all added content removed)")

# ==============================================================================
# COMPILE INTO FINAL PDF
# ==============================================================================
pdf_path = "Waste2Worth_Sociothon26.pdf"
rendered_images[0].save(
    pdf_path,
    save_all=True,
    append_images=rendered_images[1:],
    resolution=100.0,
    quality=95
)
print(f"Successfully compiled all 9 slides into {pdf_path}!")
