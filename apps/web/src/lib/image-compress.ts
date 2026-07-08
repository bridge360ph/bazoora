/**
 * Compresses an image file client-side to a max width/height of 1024px
 * and returns a compressed JPEG base64 string at 0.75 quality.
 */
export async function compressImage(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener("load", (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.addEventListener("load", () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context is null"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG at 0.75 quality (highly optimized for size while remaining very readable)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        resolve({
          base64: compressedBase64,
          mimeType: "image/jpeg",
        });
      });
      img.addEventListener("error", () => {
        reject(new Error("Failed to load image element"));
      });
    });
    reader.addEventListener("error", () => {
      reject(new Error("FileReader failed to read file"));
    });
  });
}
