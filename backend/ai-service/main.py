
from fastapi import FastAPI, UploadFile, File, HTTPException
from ultralytics import YOLO
from PIL import Image, ImageStat, UnidentifiedImageError
from pathlib import Path
from threading import Lock
import hashlib
import numpy as np
import tempfile
import io
import os
import torch
from torch.nn.functional import normalize

# =========================================
# FASTAPI APPLICATION
# =========================================

app = FastAPI(title="Water Lily Mold AI")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "best.pt"
REFERENCE_DIR = BASE_DIR / "reference_data"
REFERENCE_CACHE_PATH = REFERENCE_DIR / ".embeddings.npz"
IMAGE_SIZE = 224
SIMILARITY_NEIGHBORS = 5
REFERENCE_BATCH_SIZE = 4
MIN_COSINE_SIMILARITY = 0.60

# =========================================
# LOAD YOLO MODEL
# =========================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))
model_config = getattr(model.model, "yaml", {})
model_yaml = model_config.get("yaml_file", "") if isinstance(model_config, dict) else ""
model_name = Path(model_yaml).stem
MODEL_NAME = f"YOLO{model_name[4:]}" if model_name.lower().startswith("yolo") else model_name
if not MODEL_NAME:
    MODEL_NAME = "YOLO classifier"

if isinstance(model.names, dict):
    CLASS_NAMES = {
        int(class_id): str(class_name)
        for class_id, class_name in model.names.items()
    }
else:
    CLASS_NAMES = {
        class_id: str(class_name)
        for class_id, class_name in enumerate(model.names)
    }

classifier_layers = getattr(model.model, "model", None)
if classifier_layers is None or not len(classifier_layers):
    raise RuntimeError("The YOLO checkpoint does not expose classifier layers.")

classifier_linear = getattr(classifier_layers[-1], "linear", None)
if classifier_linear is None:
    raise RuntimeError("The YOLO checkpoint does not expose classifier features.")

MODEL_LOCK = Lock()
REFERENCE_INDEX_LOCK = Lock()
FEATURE_BATCHES = []


def capture_features(_layer, inputs):
    FEATURE_BATCHES.append(
        inputs[0].detach().to(device="cpu", dtype=torch.float32)
    )


classifier_linear.register_forward_pre_hook(capture_features)


def extract_features(source, batch_size=REFERENCE_BATCH_SIZE):
    with MODEL_LOCK:
        FEATURE_BATCHES.clear()
        try:
            model.predict(
                source=source,
                imgsz=IMAGE_SIZE,
                batch=batch_size,
                verbose=False
            )

            if not FEATURE_BATCHES:
                raise RuntimeError("The YOLO model did not return image features.")

            features = torch.cat(FEATURE_BATCHES, dim=0)
            return normalize(features, p=2, dim=1)
        finally:
            FEATURE_BATCHES.clear()


def load_reference_index():
    if not REFERENCE_DIR.is_dir():
        raise FileNotFoundError(
            f"Reference dataset folder not found: {REFERENCE_DIR}"
        )

    class_directories = {
        entry.name.casefold(): entry
        for entry in REFERENCE_DIR.iterdir()
        if entry.is_dir()
    }
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    image_paths = []
    image_labels = []

    for class_id, class_name in CLASS_NAMES.items():
        class_directory = class_directories.get(class_name.casefold())
        if class_directory is None:
            raise FileNotFoundError(
                f"Reference images for class '{class_name}' were not found in "
                f"{REFERENCE_DIR}."
            )

        class_images = sorted(
            path
            for path in class_directory.rglob("*")
            if path.is_file() and path.suffix.lower() in image_extensions
        )
        if not class_images:
            raise FileNotFoundError(
                f"No reference images found for class '{class_name}' in "
                f"{class_directory}."
            )

        image_paths.extend(class_images)
        image_labels.extend([class_id] * len(class_images))

    signature = hashlib.sha256()
    model_stat = MODEL_PATH.stat()
    signature.update(
        f"{IMAGE_SIZE}:{model_stat.st_size}:{model_stat.st_mtime_ns}\n".encode()
    )
    for path, class_id in zip(image_paths, image_labels):
        image_stat = path.stat()
        signature.update(
            f"{class_id}:{path.relative_to(REFERENCE_DIR).as_posix()}:"
            f"{image_stat.st_size}:{image_stat.st_mtime_ns}\n".encode()
        )
    signature_value = signature.hexdigest()

    if REFERENCE_CACHE_PATH.is_file():
        try:
            with np.load(REFERENCE_CACHE_PATH, allow_pickle=False) as cache:
                cached_signature = str(cache["signature"].item())
                cached_embeddings = cache["embeddings"]
                cached_labels = cache["labels"]

            expected_shape = (
                len(image_paths),
                classifier_linear.in_features
            )
            if (
                cached_signature == signature_value
                and cached_embeddings.shape == expected_shape
                and cached_labels.shape == (len(image_paths),)
            ):
                return (
                    torch.from_numpy(cached_embeddings.copy()),
                    torch.from_numpy(cached_labels.astype(np.int64, copy=True))
                )
        except (OSError, ValueError, KeyError) as error:
            print("Reference embedding cache could not be loaded:", error)

    embeddings = extract_features(
        [str(path) for path in image_paths],
        batch_size=REFERENCE_BATCH_SIZE
    )
    labels = np.asarray(image_labels, dtype=np.int64)

    try:
        np.savez_compressed(
            REFERENCE_CACHE_PATH,
            signature=np.asarray(signature_value),
            embeddings=embeddings.numpy(),
            labels=labels
        )
    except OSError as error:
        print("Unable to save reference embedding cache:", error)

    return embeddings, torch.from_numpy(labels)


REFERENCE_EMBEDDINGS, REFERENCE_LABELS = load_reference_index()


def get_reference_index():
    global REFERENCE_EMBEDDINGS, REFERENCE_LABELS

    with REFERENCE_INDEX_LOCK:
        REFERENCE_EMBEDDINGS, REFERENCE_LABELS = load_reference_index()
        return REFERENCE_EMBEDDINGS, REFERENCE_LABELS


print("====================================")
print("Water Lily AI model loaded!")
print("Model:", MODEL_PATH)
print("Architecture:", MODEL_NAME)
print("Classes:", CLASS_NAMES)
print("Reference images:", len(REFERENCE_LABELS))
print("====================================")


# =========================================
# HOME
# =========================================

@app.get("/")
def home():
    _, reference_labels = get_reference_index()
    return {
        "message": "Water Lily Mold AI is running",
        "classes": CLASS_NAMES,
        "model": MODEL_NAME,
        "prediction_method": "nearest-neighbor feature similarity",
        "reference_images": len(reference_labels),
        "minimum_similarity": MIN_COSINE_SIMILARITY
    }


# =========================================
# HEALTH CHECK
# =========================================

@app.get("/health")
def health():
    _, reference_labels = get_reference_index()
    return {
        "status": "online",
        "model_loaded": True,
        "model": MODEL_NAME,
        "classes": CLASS_NAMES,
        "prediction_method": "nearest-neighbor feature similarity",
        "reference_images": len(reference_labels),
        "minimum_similarity": MIN_COSINE_SIMILARITY
    }


# =========================================
# IMAGE VALIDATION
# =========================================

def validate_image(contents: bytes):
    try:
        with Image.open(io.BytesIO(contents)) as image:
            image.verify()

        # Reopen image after verify()
        with Image.open(io.BytesIO(contents)) as image:
            image = image.convert("L")
            brightness = ImageStat.Stat(image).mean[0]

        print(f"Image brightness: {brightness:.2f}")

        # Reject very dark or nearly black images
        if brightness < 20:
            raise HTTPException(
                status_code=422,
                detail=(
                    "The captured image is too dark or black. "
                    "Please check the ESP32-CAM lighting and camera."
                )
            )

        return brightness

    except HTTPException:
        raise

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Invalid or unreadable image."
        )


# =========================================
# PREDICT IMAGE
# =========================================

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    # Check image type
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are accepted."
        )

    # Read uploaded image
    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Empty image."
        )

    # Maximum upload size: 10 MB
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be 10 MB or smaller."
        )

    # Validate image and check brightness
    brightness = validate_image(contents)

    temp_path = None

    try:
        suffix = Path(file.filename or "image.jpg").suffix.lower()

        if suffix not in [".jpg", ".jpeg", ".png", ".webp"]:
            suffix = ".jpg"

        # Save temporary image
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:
            temp_file.write(contents)
            temp_path = temp_file.name

        # =================================
        # YOLO CLASSIFICATION
        # =================================

        reference_embeddings, reference_labels = get_reference_index()
        query_embedding = extract_features(temp_path, batch_size=1)[0]
        similarities = torch.mv(reference_embeddings, query_embedding)
        neighbor_count = min(SIMILARITY_NEIGHBORS, similarities.numel())
        neighbor_similarities, neighbor_indices = torch.topk(
            similarities,
            k=neighbor_count
        )
        neighbor_labels = reference_labels[neighbor_indices]
        nearest_similarity = float(neighbor_similarities[0])

        class_scores = {}
        for similarity, neighbor_label in zip(
            neighbor_similarities.tolist(),
            neighbor_labels.tolist()
        ):
            class_id = int(neighbor_label)
            class_scores[class_id] = (
                class_scores.get(class_id, 0.0) + max(similarity, 0.0)
            )

        total_score = sum(class_scores.values())
        if total_score:
            class_id = max(class_scores, key=class_scores.get)
            confidence_percent = class_scores[class_id] / total_score * 100
        else:
            class_id = int(neighbor_labels[0])
            confidence_percent = 0.0

        matching_similarities = [
            similarity
            for similarity, neighbor_label in zip(
                neighbor_similarities.tolist(),
                neighbor_labels.tolist()
            )
            if int(neighbor_label) == class_id
        ]
        similarity_score = sum(matching_similarities) / len(matching_similarities)
        closest_class = CLASS_NAMES[class_id]
        match_status = (
            "matched"
            if similarity_score >= MIN_COSINE_SIMILARITY
            else "weak_match"
        )
        predicted_class = closest_class if match_status == "matched" else "Uncertain"

        print("====================================")
        print("Image:", file.filename)
        print("Brightness:", round(brightness, 2))
        print("Prediction:", predicted_class)
        print("Closest class:", closest_class)
        print("Reference vote:", round(confidence_percent, 2), "%")
        print("Cosine similarity:", round(similarity_score, 4))
        print("====================================")

        return {
            "success": True,
            "filename": file.filename,
            "prediction": predicted_class,
            "confidence": round(confidence_percent, 2),
            "unit": "percent",
            "similarity": round(similarity_score, 4),
            "nearest_similarity": round(nearest_similarity, 4),
            "similarity_metric": "cosine",
            "similarity_threshold": MIN_COSINE_SIMILARITY,
            "match_status": match_status,
            "closest_class": closest_class,
            "brightness": round(brightness, 2),
            "model": MODEL_NAME,
            "prediction_method": "nearest-neighbor feature similarity",
            "reference_images": len(REFERENCE_LABELS)
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Prediction error:", str(error))

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )

    finally:
        # Delete temporary image
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
