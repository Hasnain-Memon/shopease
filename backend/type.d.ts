import { FileArray, UploadedFile } from "express-fileupload";

declare global {
  namespace Express {
    interface Request {
      files?: {
        profile_img?: UploadedFile[];
      } | FileArray;
    }
  }
}