const useGetFileType = () => {
  const getFileType = (fileUrl: string): "image" | "document" | null => {
    if (typeof fileUrl !== "string" || !fileUrl.trim()) return null;

    let pathname = fileUrl;
    try {
      const urlObj = new URL(fileUrl);
      pathname = urlObj.pathname;
    } catch {
      // Not a full URL; treat input as a path
    }

    const ext = pathname.split(".").pop()?.toLowerCase();
    if (!ext) return null;

    const imageExts = new Set([
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "webp",
      "svg",
      "heic",
      "heif",
      "tif",
      "tiff",
    ]);

    return imageExts.has(ext) ? "image" : "document";
  };
  return { getFileType };
};

export default useGetFileType;
