"use server";

import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "لا يوجد ملف" };

  if (!ALLOWED.includes(file.type)) return { error: "نوع الملف غير مدعوم" };
  if (file.size > MAX_SIZE) return { error: "الحد الأقصى 10 ميجابايت" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const ext = file.name.split(".").pop() || "webp";
  const path = `${user.id}/${randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  // Magic bytes check (basic)
  const header = buffer.slice(0, 4);
  const isJpeg = header[0] === 0xff && header[1] === 0xd8;
  const isPng = header[0] === 0x89 && header[1] === 0x50;
  const isGif = header[0] === 0x47 && header[1] === 0x49;
  const isWebp = buffer.slice(8, 12).toString() === "WEBP";
  if (!isJpeg && !isPng && !isGif && !isWebp) {
    return { error: "محتوى الملف غير صالح" };
  }

  const { error } = await supabase.storage.from("prompts").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { error: error.message };

  // Signed URL valid 1 hour
  const { data: signed, error: signError } = await supabase.storage
    .from("prompts")
    .createSignedUrl(path, 3600);

  if (signError) return { error: signError.message };

  return { url: signed.signedUrl, path };
}

export async function getSignedUrl(path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("prompts")
    .createSignedUrl(path, 3600);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
