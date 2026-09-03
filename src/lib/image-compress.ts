const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.7;

/**
 * Resizes an image file to a max of 800px on the longest edge and
 * re-encodes it as JPEG at ~70% quality, entirely client-side via canvas.
 * Keeps upload size (and therefore Gemini token cost + storage) tiny —
 * we never send or store the original full-resolution photo.
 */
export async function compressImage(file: File): Promise<File> {
  const bitmap = await loadImage(file);

  let { width, height } = bitmap;
  if (width > height && width > MAX_DIMENSION) {
    height = Math.round((height * MAX_DIMENSION) / width);
    width = MAX_DIMENSION;
  } else if (height > MAX_DIMENSION) {
    width = Math.round((width * MAX_DIMENSION) / height);
    height = MAX_DIMENSION;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);

  if ("close" in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("Failed to compress image");

  return new File([blob], "meal.jpg", { type: "image/jpeg" });
}

async function loadImage(file: File): Promise<ImageBitmap> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }
  // Fallback for browsers without createImageBitmap (rare on mobile).
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return await createImageBitmap(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}
