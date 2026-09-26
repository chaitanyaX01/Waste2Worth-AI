import sys
import json
import torch
from torchvision import models, transforms
from PIL import Image

MODEL_PATH = "waste2worth_resnet18.pth"
CLASS_NAMES_PATH = "class_names.json"

# -----------------------------
# Device
# -----------------------------
if torch.backends.mps.is_available():
    device = torch.device("mps")
elif torch.cuda.is_available():
    device = torch.device("cuda")
else:
    device = torch.device("cpu")

print(f"Device: {device}")

# -----------------------------
# Load class names
# -----------------------------
with open(CLASS_NAMES_PATH, "r") as f:
    class_names = json.load(f)

class_names = [class_names[str(i)] for i in range(len(class_names))]

print("Classes:", class_names)

# -----------------------------
# Create model
# -----------------------------
model = models.resnet18(weights=None)

model.fc = torch.nn.Linear(
    model.fc.in_features,
    len(class_names)
)

# -----------------------------
# Load trained weights
# -----------------------------
checkpoint = torch.load(
    MODEL_PATH,
    map_location="cpu"
)

# Handle different checkpoint formats
if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
    model.load_state_dict(checkpoint["model_state_dict"])
elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
    model.load_state_dict(checkpoint["state_dict"])
else:
    model.load_state_dict(checkpoint)

model.to(device)
model.eval()

print("Model loaded successfully.")

# -----------------------------
# Image preprocessing
# -----------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# -----------------------------
# Get image path
# -----------------------------
if len(sys.argv) < 2:
    print("\nUsage:")
    print("python3 predict.py /path/to/image.jpg")
    sys.exit(1)

image_path = sys.argv[1]

# -----------------------------
# Load image
# -----------------------------
image = Image.open(image_path).convert("RGB")
image_tensor = transform(image).unsqueeze(0).to(device)

# -----------------------------
# Prediction
# -----------------------------
with torch.no_grad():
    outputs = model(image_tensor)
    probabilities = torch.softmax(outputs, dim=1)

confidence, predicted = torch.max(probabilities, 1)

predicted_class = class_names[predicted.item()]
confidence_percent = confidence.item() * 100

# -----------------------------
# Results
# -----------------------------
print("\n" + "=" * 50)
print("Waste2Worth AI Prediction")
print("=" * 50)

print(f"Image      : {image_path}")
print(f"Prediction : {predicted_class}")
print(f"Confidence : {confidence_percent:.2f}%")

print("\nAll class probabilities:")

for i, probability in enumerate(probabilities[0]):
    print(
        f"{class_names[i]:12s}: "
        f"{probability.item() * 100:.2f}%"
    )

print("=" * 50)