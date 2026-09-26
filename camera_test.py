import cv2
import torch
import json
from torchvision import models, transforms
from PIL import Image

# ==========================================
# SETTINGS
# ==========================================

MODEL_PATH = "waste2worth_resnet18.pth"
CLASS_NAMES_PATH = "class_names.json"

# ==========================================
# DEVICE
# ==========================================

if torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

print("Device:", device)

# ==========================================
# LOAD CLASS NAMES
# ==========================================

with open(CLASS_NAMES_PATH, "r") as f:
    data = json.load(f)

class_names = [
    data[str(i)]
    for i in range(len(data))
]

print("Classes:", class_names)

# ==========================================
# LOAD MODEL
# ==========================================

model = models.resnet18(weights=None)

model.fc = torch.nn.Linear(
    model.fc.in_features,
    len(class_names)
)

checkpoint = torch.load(
    MODEL_PATH,
    map_location="cpu"
)

# Support different checkpoint formats
if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
    model.load_state_dict(checkpoint["model_state_dict"])
elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
    model.load_state_dict(checkpoint["state_dict"])
else:
    model.load_state_dict(checkpoint)

model.to(device)
model.eval()

print("AI model loaded successfully.")

# ==========================================
# IMAGE TRANSFORM
# ==========================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ==========================================
# CAMERA
# ==========================================

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("ERROR: Could not open camera.")
    exit()

print("Camera started.")
print("Put the waste inside the square.")
print("Press Q to quit.")

# ==========================================
# CAMERA LOOP
# ==========================================

while True:

    ret, frame = camera.read()

    if not ret:
        print("ERROR: Could not read camera.")
        break

    # Flip camera like a selfie camera
    frame = cv2.flip(frame, 1)

    height, width, _ = frame.shape

    # ======================================
    # SQUARE SCANNING BOX
    # ======================================

    box_size = min(width, height) // 2

    x1 = (width - box_size) // 2
    y1 = (height - box_size) // 2

    x2 = x1 + box_size
    y2 = y1 + box_size

    # ======================================
    # DARKEN AREA OUTSIDE BOX
    # ======================================

    overlay = frame.copy()

    cv2.rectangle(
        overlay,
        (0, 0),
        (width, y1),
        (0, 0, 0),
        -1
    )

    cv2.rectangle(
        overlay,
        (0, y2),
        (width, height),
        (0, 0, 0),
        -1
    )

    cv2.rectangle(
        overlay,
        (0, y1),
        (x1, y2),
        (0, 0, 0),
        -1
    )

    cv2.rectangle(
        overlay,
        (x2, y1),
        (width, y2),
        (0, 0, 0),
        -1
    )

    # Blend dark overlay
    frame = cv2.addWeighted(
        overlay,
        0.55,
        frame,
        0.45,
        0
    )

    # ======================================
    # GET ONLY THE BOX AREA
    # ======================================

    roi = frame[y1:y2, x1:x2]

    # Convert BGR → RGB
    rgb_roi = cv2.cvtColor(
        roi,
        cv2.COLOR_BGR2RGB
    )

    # OpenCV → PIL
    image = Image.fromarray(rgb_roi)

    # Prepare for AI
    image_tensor = transform(
        image
    ).unsqueeze(0).to(device)

    # ======================================
    # AI PREDICTION
    # ======================================

    with torch.no_grad():

        outputs = model(
            image_tensor
        )

        probabilities = torch.softmax(
            outputs,
            dim=1
        )

        confidence, predicted = torch.max(
            probabilities,
            dim=1
        )

    predicted_class = class_names[
        predicted.item()
    ]

    confidence_percent = (
        confidence.item() * 100
    )

    # ======================================
    # DRAW SCANNING BOX
    # ======================================

    cv2.rectangle(
        frame,
        (x1, y1),
        (x2, y2),
        (0, 255, 0),
        3
    )

    # ======================================
    # TITLE
    # ======================================

    cv2.putText(
        frame,
        "PLACE WASTE INSIDE BOX",
        (x1, y1 - 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )

    # ======================================
    # RESULT BACKGROUND
    # ======================================

    result_text = (
        f"{predicted_class.upper()} "
        f"{confidence_percent:.1f}%"
    )

    cv2.rectangle(
        frame,
        (10, 10),
        (360, 65),
        (0, 0, 0),
        -1
    )

    # ======================================
    # RESULT
    # ======================================

    cv2.putText(
        frame,
        result_text,
        (20, 48),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 0),
        2
    )

    # ======================================
    # DISPLAY
    # ======================================

    cv2.imshow(
        "Waste2Worth AI Scanner",
        frame
    )

    # ======================================
    # QUIT
    # ======================================

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# ==========================================
# CLEANUP
# ==========================================

camera.release()
cv2.destroyAllWindows()

print("Scanner stopped.")