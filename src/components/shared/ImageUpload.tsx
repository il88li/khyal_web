"use client";

import { useState, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { compressImage, validateImage } from "@/lib/image-utils";
import { uploadImage } from "@/app/actions/storage";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function ImageUpload({ images, onChange, max = 4 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    setUploading(true);
    setProgress(0);

    const remaining = max - images.length;
    const toProcess = Array.from(files).slice(0, remaining);
    const newUrls: string[] = [];

    for (let i = 0; i < toProcess.length; i++) {
      const file = toProcess[i];
      const err = validateImage(file);
      if (err) {
        setError(err);
        continue;
      }
      try {
        const compressed = await compressImage(file);
        const fd = new FormData();
        fd.append("file", compressed);

        const res = await uploadImage(fd);
        if (res.error) {
          // Fallback to local preview if storage not configured
          const localUrl = URL.createObjectURL(compressed);
          newUrls.push(localUrl);
        } else if (res.url) {
          newUrls.push(res.url);
        }
        setProgress(Math.round(((i + 1) / toProcess.length) * 100));
      } catch {
        setError("فشل معالجة الصورة");
      }
    }

    onChange([...images, ...newUrls]);
    setUploading(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div
            key={i}
            className="relative w-20 h-20 rounded-card overflow-hidden border border-silver"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 left-1 w-6 h-6 rounded-full bg-charcoal text-snow flex items-center justify-center"
              aria-label="حذف"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-20 h-20 rounded-card border border-dashed border-silver bg-fog",
              "flex flex-col items-center justify-center gap-1 text-smoke text-13",
              "active:bg-mist min-h-touch relative overflow-hidden"
            )}
          >
            {uploading ? (
              <>
                <span className="text-13">{progress}%</span>
                <span
                  className="absolute bottom-0 left-0 h-1 bg-charcoal transition-all"
                  style={{ width: `${progress}%` }}
                />
              </>
            ) : (
              <>
                <ImagePlus size={20} />
                إضافة
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-13 text-red-600">{error}</p>}
    </div>
  );
}
