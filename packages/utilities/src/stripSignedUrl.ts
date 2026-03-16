const stripSignedUrl = (url: string): string => {
  try {
    const u = new URL(url);
    // Remove all query parameters (signed parts)
    u.search = "";
    return u.toString();
  } catch {
    return url; // fallback if invalid URL
  }
};

export default stripSignedUrl;
