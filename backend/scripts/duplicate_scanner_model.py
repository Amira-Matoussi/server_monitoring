from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import torch.nn.functional as F

# — Load the LARGE CLIP model once, reuse —
processor = CLIPProcessor.from_pretrained(
    "openai/clip-vit-large-patch14",
    use_fast=True
)
model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
model.eval()


def get_image_embedding(image_path: str) -> list[float]:
    """
    Load an image from disk, compute its CLIP ViT-L/14 embedding,
    normalize it to unit length, and return as a JSON-friendly list.
    """
    img = Image.open(image_path).convert("RGB")
    inputs = processor(images=img, return_tensors="pt")
    with torch.no_grad():
        outputs = model.get_image_features(**inputs)
    embedding = F.normalize(outputs, p=2, dim=1)
    return embedding.squeeze().tolist()
