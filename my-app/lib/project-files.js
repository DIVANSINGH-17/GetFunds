export const MAX_PROJECT_FILES = 5;
export const MAX_PROJECT_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_PROJECT_TOTAL_BYTES = 15 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "application/json",
  "application/msword",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/css",
  "text/csv",
  "text/html",
  "text/javascript",
  "text/markdown",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([
  "css",
  "c",
  "cpp",
  "csv",
  "doc",
  "docx",
  "gif",
  "jpeg",
  "jpg",
  "js",
  "jsx",
  "json",
  "java",
  "md",
  "pdf",
  "png",
  "ppt",
  "pptx",
  "py",
  "sh",
  "sql",
  "ts",
  "tsx",
  "txt",
  "webp",
  "xls",
  "xlsx",
  "xml",
  "yaml",
  "yml",
  "zip",
]);

export const sanitizeFilename = (filename) => {
  const cleaned = String(filename || "file")
    .replace(/[\\/\0-\x1f\x7f]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  return (cleaned || "file").slice(0, 180);
};

export const validateProjectFiles = (files) => {
  if (files.length < 1 || files.length > MAX_PROJECT_FILES) {
    return `Choose between 1 and ${MAX_PROJECT_FILES} files.`;
  }

  let totalSize = 0;

  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_FILE_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(extension)) {
      return `${file.name} uses an unsupported file type.`;
    }

    if (file.size < 1 || file.size > MAX_PROJECT_FILE_BYTES) {
      return `${file.name} must be larger than 0 bytes and no larger than 5 MB.`;
    }

    totalSize += file.size;
  }

  if (totalSize > MAX_PROJECT_TOTAL_BYTES) {
    return "A project folder can contain at most 15 MB in total.";
  }

  return null;
};
