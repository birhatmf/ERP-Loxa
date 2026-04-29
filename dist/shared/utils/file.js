"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_DOCUMENT_EXTENSIONS = exports.ALLOWED_IMAGE_EXTENSIONS = exports.ALLOWED_DOCUMENT_MIME_TYPES = exports.ALLOWED_IMAGE_MIME_TYPES = void 0;
exports.sanitizeFilename = sanitizeFilename;
exports.parseMultipartFile = parseMultipartFile;
exports.isValidProjectFile = isValidProjectFile;
exports.isValidPaymentFile = isValidPaymentFile;
const path_1 = __importDefault(require("path"));
exports.ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
]);
exports.ALLOWED_DOCUMENT_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
]);
exports.ALLOWED_IMAGE_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
]);
exports.ALLOWED_DOCUMENT_EXTENSIONS = new Set([
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'
]);
function sanitizeFilename(name) {
    // Extract only the base name, removing any path traversal attempts
    const baseName = path_1.default.basename(name);
    // Replace anything that is not a word character, dot, dash, parentheses, or space
    return baseName
        .replace(/[^\w.\-()\s]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^_+|_+$/g, '') || 'file';
}
function parseMultipartFile(body, contentType) {
    const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? '');
    if (!boundaryMatch) {
        throw new Error('Multipart boundary not found');
    }
    const boundary = `--${boundaryMatch[1] ?? boundaryMatch[2]}`;
    const raw = body.toString('latin1');
    const parts = raw.split(boundary);
    for (const part of parts) {
        const trimmed = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
        if (!trimmed || trimmed === '--')
            continue;
        const headerEnd = trimmed.indexOf('\r\n\r\n');
        if (headerEnd === -1)
            continue;
        const headerText = trimmed.slice(0, headerEnd);
        const contentText = trimmed.slice(headerEnd + 4).replace(/\r\n$/, '');
        const headers = headerText.split('\r\n');
        const disposition = headers.find(h => h.toLowerCase().startsWith('content-disposition'));
        if (!disposition || !disposition.includes('filename=')) {
            continue;
        }
        const filenameMatch = /filename="([^"]*)"/i.exec(disposition);
        const typeHeader = headers.find(h => h.toLowerCase().startsWith('content-type'));
        const originalName = filenameMatch?.[1] || 'file';
        // Only extract the last extension and force it to lowercase
        const extension = path_1.default.extname(originalName).toLowerCase();
        const mimeType = typeHeader?.split(':')[1]?.trim().toLowerCase() || 'application/octet-stream';
        return {
            originalName,
            storedName: sanitizeFilename(originalName),
            mimeType,
            extension,
            buffer: Buffer.from(contentText, 'latin1'),
        };
    }
    throw new Error('No file found in multipart payload');
}
function isValidProjectFile(mimeType, extension) {
    const isAllowedMimeType = exports.ALLOWED_IMAGE_MIME_TYPES.has(mimeType) || exports.ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType);
    const isAllowedExtension = exports.ALLOWED_IMAGE_EXTENSIONS.has(extension) || exports.ALLOWED_DOCUMENT_EXTENSIONS.has(extension);
    return isAllowedMimeType && isAllowedExtension;
}
function isValidPaymentFile(mimeType, extension) {
    const isAllowedMimeType = exports.ALLOWED_IMAGE_MIME_TYPES.has(mimeType);
    const isAllowedExtension = exports.ALLOWED_IMAGE_EXTENSIONS.has(extension);
    return isAllowedMimeType && isAllowedExtension;
}
//# sourceMappingURL=file.js.map