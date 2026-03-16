import { z } from "zod";
import { useCallback, useState } from "react";
import type { AxiosInstance, AxiosResponse } from "axios";
import type { ApiData } from "../../utilities/src/types";

export const UploadResponseSchema = z.object({
  url: z.string(),
});

const uploadedSchema = z.object({
  img_url: z.string(),
  signed_url: z.string(),
  filename: z.string(),
  size: z.number(),
  mimetype: z.string(),
  uploadedAt: z.string(),
});

type Uploaded = z.infer<typeof uploadedSchema>;

type UploadResponse = z.infer<typeof UploadResponseSchema>;

type UploadFileProps = {
  fileName: string;
  onUploadDone: (data: Uploaded | Error) => void;
} & (
  | {
      file: Blob;
    }
  | {
      src: string;
    }
);

/**
 * Compresses an image file using Canvas API with progressive quality reduction
 * until it's under the specified max size.
 * @param file - The image file to compress
 * @param maxSizeBytes - Maximum size in bytes (default: 5MB)
 * @returns Compressed blob or original file if compression fails/not needed
 */
const compressImage = async (
  file: Blob,
  maxSizeBytes: number
): Promise<Blob> => {
  // Skip compression for non-image files or files already under limit
  if (!file.type.startsWith("image/") || file.size <= maxSizeBytes) {
    return file;
  }

  // Skip SVG and other formats that Canvas doesn't support well
  const unsupportedFormats = ["image/svg+xml", "image/svg"];
  if (unsupportedFormats.includes(file.type)) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      // Maintain aspect ratio
      canvas.width = img.width;
      canvas.height = img.height;

      // Try progressive quality reduction
      const tryCompress = (quality: number): void => {
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // If compressed size is acceptable or quality is too low, return result
            if (blob.size <= maxSizeBytes || quality <= 0.1) {
              resolve(blob);
            } else {
              // Try lower quality
              tryCompress(Math.max(0.1, quality - 0.1));
            }
          },
          file.type,
          quality
        );
      };

      // Start with 0.9 quality
      tryCompress(0.9);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

const useFileUpload = (api: AxiosInstance) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async ({
      onUploadDone,
      fileName,
      ...rest
    }: UploadFileProps): Promise<Uploaded | Error> => {
      setIsUploading(true);

      const formData = new FormData();
      let fileToUpload: Blob;

      if ("src" in rest) {
        const response = await api.get(rest.src, { responseType: "blob" });
        fileToUpload = response.data as Blob;
      } else {
        fileToUpload = rest.file;
      }

      // Compress image if it exceeds 5MB
      if (
        fileToUpload.type.startsWith("image/") &&
        fileToUpload.size > 5 * 1024 * 1024
      ) {
        try {
          fileToUpload = await compressImage(fileToUpload, 5 * 1024 * 1024);
        } catch (error) {
          // Fallback to original file if compression fails
          console.warn("Image compression failed, using original file:", error);
        }
      }

      formData.append("image", fileToUpload, fileName);

      try {
        const { data: respData } = await api.post<
          any,
          AxiosResponse<ApiData<Uploaded>>
        >("/api/v1/products/upload-image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "*/*",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            TE: "trailers",
          },
        });

        setIsUploading(false);
        onUploadDone(respData.data);
        return respData.data;
      } catch (error) {
        setIsUploading(false);
        if (error instanceof Error) {
          onUploadDone(error);
          return error;
        }
        const customError = new Error("Something went wrong");
        onUploadDone(customError);
        return customError;
      }
    },
    []
  );

  return { uploadFile, isUploading };
};
export type UploadedData = UploadResponse;

export default useFileUpload;
