import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

import torch
import torch.nn as nn

from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models

from PIL import Image

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_curve,
    auc,
    precision_recall_curve,
    average_precision_score,
)


# ============================================================
# 1. CONFIGURATION
# ============================================================

TRAIN_CSV = "train.csv"
VAL_CSV = "val.csv"

MODEL_OUTPUT = "waste2worth_resnet18.pth"

IMAGE_SIZE = 224
BATCH_SIZE = 32

NUM_EPOCHS = 10
LEARNING_RATE = 0.0003

CLASS_NAMES = [
    "cardboard",
    "e-waste",
    "glass",
    "medical",
    "metal",
    "paper",
    "plastic",
]

CLASS_TO_INDEX = {
    name: i
    for i, name in enumerate(CLASS_NAMES)
}

NUM_CLASSES = len(CLASS_NAMES)

OUTPUT_DIR = "results"

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# 2. DEVICE
# ============================================================

if torch.backends.mps.is_available():
    DEVICE = torch.device("mps")
elif torch.cuda.is_available():
    DEVICE = torch.device("cuda")
else:
    DEVICE = torch.device("cpu")

print("=" * 65)
print("WASTE2WORTH AI")
print("7-CLASS WASTE CLASSIFICATION")
print("=" * 65)

print("Device:", DEVICE)

if DEVICE.type == "mps":
    print("Apple Silicon GPU acceleration: ENABLED")


# ============================================================
# 3. DATASET
# ============================================================

class WasteDataset(Dataset):

    def __init__(self, csv_file, transform=None):

        self.data = pd.read_csv(csv_file)
        self.transform = transform

        print(
            f"Loaded {csv_file}: "
            f"{len(self.data)} images"
        )

    def __len__(self):
        return len(self.data)

    def __getitem__(self, index):

        image_path = self.data.iloc[index]["image_path"]

        class_name = self.data.iloc[index]["class"]

        label = CLASS_TO_INDEX[class_name]

        try:

            image = Image.open(
                image_path
            ).convert("RGB")

        except Exception as e:

            print(
                f"Warning: Could not read {image_path}"
            )

            print(e)

            image = Image.new(
                "RGB",
                (IMAGE_SIZE, IMAGE_SIZE)
            )

        if self.transform:
            image = self.transform(image)

        return image, label


# ============================================================
# 4. IMAGE TRANSFORMS
# ============================================================

train_transform = transforms.Compose([

    transforms.RandomResizedCrop(
        IMAGE_SIZE,
        scale=(0.8, 1.0)
    ),

    transforms.RandomHorizontalFlip(
        p=0.5
    ),

    transforms.RandomRotation(
        10
    ),

    transforms.ColorJitter(
        brightness=0.2,
        contrast=0.2,
        saturation=0.2
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])


val_transform = transforms.Compose([

    transforms.Resize(
        (IMAGE_SIZE, IMAGE_SIZE)
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])


# ============================================================
# 5. LOAD DATA
# ============================================================

print("\nLoading datasets...")

train_dataset = WasteDataset(
    TRAIN_CSV,
    train_transform
)

val_dataset = WasteDataset(
    VAL_CSV,
    val_transform
)


train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)


print("\nDataset Summary")
print("-" * 50)

print(
    "Training images:",
    len(train_dataset)
)

print(
    "Validation images:",
    len(val_dataset)
)

print(
    "Classes:",
    NUM_CLASSES
)


# ============================================================
# 6. CLASS DISTRIBUTION GRAPH
# ============================================================

class_counts = (
    train_dataset.data["class"]
    .value_counts()
    .reindex(CLASS_NAMES)
)

plt.figure(figsize=(10, 6))

plt.bar(
    CLASS_NAMES,
    class_counts.values
)

plt.title(
    "Training Dataset Class Distribution"
)

plt.xlabel(
    "Waste Class"
)

plt.ylabel(
    "Number of Images"
)

plt.xticks(
    rotation=30,
    ha="right"
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/class_distribution.png",
    dpi=300
)

plt.close()


# ============================================================
# 7. CLASS WEIGHTS
# ============================================================

total_samples = len(train_dataset)

class_weights = []

for class_name in CLASS_NAMES:

    count = class_counts[class_name]

    weight = (
        total_samples /
        (NUM_CLASSES * count)
    )

    class_weights.append(weight)


class_weights = torch.tensor(
    class_weights,
    dtype=torch.float32
)

class_weights = class_weights.to(
    DEVICE
)

print("\nClass weights:")

for name, weight in zip(
    CLASS_NAMES,
    class_weights
):

    print(
        f"{name:12s}: "
        f"{weight.item():.4f}"
    )


# ============================================================
# 8. LOAD RESNET18
# ============================================================

print("\nLoading pretrained ResNet18...")

weights = models.ResNet18_Weights.DEFAULT

model = models.resnet18(
    weights=weights
)

number_of_features = (
    model.fc.in_features
)

model.fc = nn.Linear(
    number_of_features,
    NUM_CLASSES
)

model = model.to(DEVICE)

print("ResNet18 ready.")


# ============================================================
# 9. LOSS
# ============================================================

criterion = nn.CrossEntropyLoss(
    weight=class_weights
)


# ============================================================
# 10. OPTIMIZER
# ============================================================

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=0.0001
)


# ============================================================
# 11. SCHEDULER
# ============================================================

scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="min",
    factor=0.5,
    patience=2
)


# ============================================================
# 12. TRAIN FUNCTION
# ============================================================

def train_one_epoch():

    model.train()

    total_loss = 0.0
    correct = 0
    total = 0

    for images, labels in train_loader:

        images = images.to(DEVICE)

        labels = labels.to(DEVICE)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(
            outputs,
            labels
        )

        loss.backward()

        optimizer.step()

        total_loss += (
            loss.item()
            * images.size(0)
        )

        predictions = torch.argmax(
            outputs,
            dim=1
        )

        correct += (
            predictions == labels
        ).sum().item()

        total += labels.size(0)

    loss_value = (
        total_loss / total
    )

    accuracy = (
        correct / total
    )

    return loss_value, accuracy


# ============================================================
# 13. VALIDATION
# ============================================================

def validate():

    model.eval()

    total_loss = 0.0
    correct = 0
    total = 0

    all_labels = []
    all_predictions = []
    all_probabilities = []

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(DEVICE)

            labels = labels.to(DEVICE)

            outputs = model(images)

            loss = criterion(
                outputs,
                labels
            )

            total_loss += (
                loss.item()
                * images.size(0)
            )

            probabilities = torch.softmax(
                outputs,
                dim=1
            )

            predictions = torch.argmax(
                outputs,
                dim=1
            )

            correct += (
                predictions == labels
            ).sum().item()

            total += labels.size(0)

            all_labels.extend(
                labels.cpu().numpy()
            )

            all_predictions.extend(
                predictions.cpu().numpy()
            )

            all_probabilities.extend(
                probabilities.cpu().numpy()
            )

    loss_value = (
        total_loss / total
    )

    accuracy = (
        correct / total
    )

    return (
        loss_value,
        accuracy,
        np.array(all_labels),
        np.array(all_predictions),
        np.array(all_probabilities),
    )


# ============================================================
# 14. TRAINING
# ============================================================

print("\n")
print("=" * 65)
print("STARTING TRAINING")
print("=" * 65)

history = []

best_accuracy = 0.0


for epoch in range(NUM_EPOCHS):

    print(
        f"\nEpoch "
        f"{epoch + 1}/{NUM_EPOCHS}"
    )

    train_loss, train_accuracy = (
        train_one_epoch()
    )

    (
        val_loss,
        val_accuracy,
        labels,
        predictions,
        probabilities
    ) = validate()

    scheduler.step(
        val_loss
    )

    current_lr = (
        optimizer.param_groups[0]["lr"]
    )

    history.append({

        "epoch": epoch + 1,

        "train_loss":
            train_loss,

        "val_loss":
            val_loss,

        "train_accuracy":
            train_accuracy,

        "val_accuracy":
            val_accuracy,

        "learning_rate":
            current_lr,
    })

    print(
        f"Train Loss: "
        f"{train_loss:.4f}"
    )

    print(
        f"Train Accuracy: "
        f"{train_accuracy * 100:.2f}%"
    )

    print(
        f"Validation Loss: "
        f"{val_loss:.4f}"
    )

    print(
        f"Validation Accuracy: "
        f"{val_accuracy * 100:.2f}%"
    )

    print(
        f"Learning Rate: "
        f"{current_lr:.7f}"
    )

    if val_accuracy > best_accuracy:

        best_accuracy = val_accuracy

        torch.save(
            model.state_dict(),
            MODEL_OUTPUT
        )

        print(
            "✓ Best model saved"
        )


# ============================================================
# 15. SAVE TRAINING HISTORY
# ============================================================

history_df = pd.DataFrame(
    history
)

history_df.to_csv(
    f"{OUTPUT_DIR}/training_history.csv",
    index=False
)


# ============================================================
# 16. ACCURACY CURVE
# ============================================================

plt.figure(figsize=(10, 6))

plt.plot(
    history_df["epoch"],
    history_df["train_accuracy"] * 100,
    marker="o",
    label="Training Accuracy"
)

plt.plot(
    history_df["epoch"],
    history_df["val_accuracy"] * 100,
    marker="o",
    label="Validation Accuracy"
)

plt.title(
    "Training and Validation Accuracy"
)

plt.xlabel(
    "Epoch"
)

plt.ylabel(
    "Accuracy (%)"
)

plt.legend()

plt.grid(
    True,
    alpha=0.3
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/accuracy_curve.png",
    dpi=300
)

plt.close()


# ============================================================
# 17. LOSS CURVE
# ============================================================

plt.figure(figsize=(10, 6))

plt.plot(
    history_df["epoch"],
    history_df["train_loss"],
    marker="o",
    label="Training Loss"
)

plt.plot(
    history_df["epoch"],
    history_df["val_loss"],
    marker="o",
    label="Validation Loss"
)

plt.title(
    "Training and Validation Loss"
)

plt.xlabel(
    "Epoch"
)

plt.ylabel(
    "Loss"
)

plt.legend()

plt.grid(
    True,
    alpha=0.3
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/loss_curve.png",
    dpi=300
)

plt.close()


# ============================================================
# 18. LOAD BEST MODEL
# ============================================================

print("\nLoading best model...")

model.load_state_dict(
    torch.load(
        MODEL_OUTPUT,
        map_location=DEVICE
    )
)


# ============================================================
# 19. FINAL VALIDATION
# ============================================================

(
    final_loss,
    final_accuracy,
    labels,
    predictions,
    probabilities
) = validate()


print("\n")
print("=" * 65)
print("FINAL EVALUATION")
print("=" * 65)

print(
    f"Validation Accuracy: "
    f"{final_accuracy * 100:.2f}%"
)


# ============================================================
# 20. CLASSIFICATION REPORT
# ============================================================

report = classification_report(
    labels,
    predictions,
    target_names=CLASS_NAMES,
    digits=4
)

print("\nClassification Report:\n")

print(report)

with open(
    f"{OUTPUT_DIR}/classification_report.txt",
    "w"
) as f:

    f.write(report)


# ============================================================
# 21. CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    labels,
    predictions
)

pd.DataFrame(
    cm,
    index=CLASS_NAMES,
    columns=CLASS_NAMES
).to_csv(
    f"{OUTPUT_DIR}/confusion_matrix.csv"
)


plt.figure(
    figsize=(10, 8)
)

plt.imshow(
    cm,
    interpolation="nearest"
)

plt.title(
    "Confusion Matrix"
)

plt.colorbar()

plt.xticks(
    range(NUM_CLASSES),
    CLASS_NAMES,
    rotation=45,
    ha="right"
)

plt.yticks(
    range(NUM_CLASSES),
    CLASS_NAMES
)

plt.xlabel(
    "Predicted Class"
)

plt.ylabel(
    "True Class"
)

threshold = cm.max() / 2

for i in range(NUM_CLASSES):

    for j in range(NUM_CLASSES):

        plt.text(
            j,
            i,
            cm[i, j],
            ha="center",
            va="center",
            color="white"
            if cm[i, j] > threshold
            else "black"
        )

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/confusion_matrix.png",
    dpi=300
)

plt.close()


# ============================================================
# 22. NORMALIZED CONFUSION MATRIX
# ============================================================

cm_normalized = (
    cm.astype(float)
    / cm.sum(axis=1, keepdims=True)
)

plt.figure(
    figsize=(10, 8)
)

plt.imshow(
    cm_normalized,
    interpolation="nearest"
)

plt.title(
    "Normalized Confusion Matrix"
)

plt.colorbar()

plt.xticks(
    range(NUM_CLASSES),
    CLASS_NAMES,
    rotation=45,
    ha="right"
)

plt.yticks(
    range(NUM_CLASSES),
    CLASS_NAMES
)

plt.xlabel(
    "Predicted Class"
)

plt.ylabel(
    "True Class"
)

for i in range(NUM_CLASSES):

    for j in range(NUM_CLASSES):

        plt.text(
            j,
            i,
            f"{cm_normalized[i, j]:.2f}",
            ha="center",
            va="center"
        )

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/confusion_matrix_normalized.png",
    dpi=300
)

plt.close()


# ============================================================
# 23. ROC CURVES + AUC
# ============================================================

one_hot_labels = np.eye(
    NUM_CLASSES
)[labels]

plt.figure(
    figsize=(10, 8)
)

roc_auc_values = {}

for i, class_name in enumerate(
    CLASS_NAMES
):

    fpr, tpr, _ = roc_curve(
        one_hot_labels[:, i],
        probabilities[:, i]
    )

    roc_auc = auc(
        fpr,
        tpr
    )

    roc_auc_values[class_name] = roc_auc

    plt.plot(
        fpr,
        tpr,
        label=f"{class_name} (AUC = {roc_auc:.3f})"
    )


plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    label="Random Classifier"
)

plt.title(
    "ROC Curves - 7 Waste Classes"
)

plt.xlabel(
    "False Positive Rate"
)

plt.ylabel(
    "True Positive Rate"
)

plt.legend(
    loc="lower right"
)

plt.grid(
    True,
    alpha=0.3
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/roc_auc_curves.png",
    dpi=300
)

plt.close()


# ============================================================
# 24. SAVE AUC VALUES
# ============================================================

with open(
    f"{OUTPUT_DIR}/auc_scores.txt",
    "w"
) as f:

    for class_name, score in (
        roc_auc_values.items()
    ):

        f.write(
            f"{class_name}: "
            f"{score:.4f}\n"
        )


# ============================================================
# 25. PRECISION-RECALL CURVES
# ============================================================

plt.figure(
    figsize=(10, 8)
)

for i, class_name in enumerate(
    CLASS_NAMES
):

    precision, recall, _ = (
        precision_recall_curve(
            one_hot_labels[:, i],
            probabilities[:, i]
        )
    )

    ap = average_precision_score(
        one_hot_labels[:, i],
        probabilities[:, i]
    )

    plt.plot(
        recall,
        precision,
        label=f"{class_name} (AP = {ap:.3f})"
    )


plt.title(
    "Precision-Recall Curves"
)

plt.xlabel(
    "Recall"
)

plt.ylabel(
    "Precision"
)

plt.legend(
    loc="lower left"
)

plt.grid(
    True,
    alpha=0.3
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/precision_recall_curves.png",
    dpi=300
)

plt.close()


# ============================================================
# 26. PRECISION / RECALL / F1 GRAPH
# ============================================================

report_dict = classification_report(
    labels,
    predictions,
    target_names=CLASS_NAMES,
    output_dict=True
)

precision_values = [
    report_dict[c]["precision"]
    for c in CLASS_NAMES
]

recall_values = [
    report_dict[c]["recall"]
    for c in CLASS_NAMES
]

f1_values = [
    report_dict[c]["f1-score"]
    for c in CLASS_NAMES
]

x = np.arange(NUM_CLASSES)

width = 0.25

plt.figure(
    figsize=(12, 7)
)

plt.bar(
    x - width,
    precision_values,
    width,
    label="Precision"
)

plt.bar(
    x,
    recall_values,
    width,
    label="Recall"
)

plt.bar(
    x + width,
    f1_values,
    width,
    label="F1 Score"
)

plt.xticks(
    x,
    CLASS_NAMES,
    rotation=30,
    ha="right"
)

plt.ylim(
    0,
    1.05
)

plt.title(
    "Precision, Recall and F1 Score by Class"
)

plt.ylabel(
    "Score"
)

plt.legend()

plt.grid(
    axis="y",
    alpha=0.3
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/classification_metrics.png",
    dpi=300
)

plt.close()


# ============================================================
# 27. SAVE CLASS NAMES
# ============================================================

with open(
    "class_names.json",
    "w"
) as f:

    json.dump(
        {
            str(i): name
            for i, name in enumerate(CLASS_NAMES)
        },
        f,
        indent=2
    )


# ============================================================
# 28. FINAL SUMMARY
# ============================================================

print("\n")
print("=" * 65)
print("TRAINING COMPLETE")
print("=" * 65)

print(
    f"Best Validation Accuracy: "
    f"{best_accuracy * 100:.2f}%"
)

print(
    f"Final Validation Accuracy: "
    f"{final_accuracy * 100:.2f}%"
)

print(
    "\nModel:"
)

print(
    f"  {MODEL_OUTPUT}"
)

print(
    "\nResults saved in:"
)

print(
    f"  {OUTPUT_DIR}/"
)

print("\nGenerated files:")

for filename in sorted(
    os.listdir(OUTPUT_DIR)
):

    print(
        f"  ✓ {filename}"
    )

print("\nWaste2Worth AI evaluation complete.")