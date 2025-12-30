import { BadRequestException } from "@nestjs/common";
import { diskStorage } from "multer";
import { extname } from "path";

// Allowed MIME types for avatar uploads
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const avatarUploadConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      // Files can be stored in memory or temp; here we just validate
      cb(null, "/tmp");
    },
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join("");
      cb(null, `avatar-${randomName}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new BadRequestException(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`), false);
    }

    // Validate file size (checked during upload, size prop may not be reliable)
    if (file.size && file.size > MAX_FILE_SIZE) {
      return cb(new BadRequestException(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`), false);
    }

    cb(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};
