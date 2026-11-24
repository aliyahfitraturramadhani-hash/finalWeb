"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getActiveUser } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024;

function detectImage(buffer) {
  // JPEG
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpg";
  }

  // PNG
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return "png";
  }

  // WebP (RIFF....WEBP)
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export async function uploadBookCover(file) {
  await getActiveUser(["admin", "librarian"]);

  if (!(file instanceof File)) {
    throw new Error("File sampul tidak valid.");
  }

  if (file.size <= 0 || file.size > MAX_SIZE) {
    throw new Error("Ukuran gambar harus lebih dari 0 dan maksimal 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = detectImage(buffer);

  if (!extension) {
    throw new Error("File harus berupa gambar JPG, PNG, atau WebP yang valid.");
  }

  const filename = `cover-${randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", "books");

  await mkdir(directory, { recursive: true });

  await writeFile(path.join(directory, filename), buffer, { flag: "wx" });

  return `/uploads/books/${filename}`;
}