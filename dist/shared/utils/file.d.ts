export declare const ALLOWED_IMAGE_MIME_TYPES: Set<string>;
export declare const ALLOWED_DOCUMENT_MIME_TYPES: Set<string>;
export declare const ALLOWED_IMAGE_EXTENSIONS: Set<string>;
export declare const ALLOWED_DOCUMENT_EXTENSIONS: Set<string>;
export declare function sanitizeFilename(name: string): string;
export declare function parseMultipartFile(body: Buffer, contentType?: string): {
    originalName: string;
    storedName: string;
    mimeType: string;
    buffer: Buffer;
    extension: string;
};
export declare function isValidProjectFile(mimeType: string, extension: string): boolean;
export declare function isValidPaymentFile(mimeType: string, extension: string): boolean;
//# sourceMappingURL=file.d.ts.map