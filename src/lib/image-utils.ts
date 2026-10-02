import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/webp" as const,
  };
  try {
    return await imageCompression(file, options);
  } catch {
    return file;
  }
}

export function validateImage(file: File): string | null {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) return "نوع الملف غير مدعوم";
  if (file.size > 10 * 1024 * 1024) return "الحد الأقصى 10 ميجابايت";
  return null;
}
