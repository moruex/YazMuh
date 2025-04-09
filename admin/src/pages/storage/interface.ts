// e.g., src/pages/storage/interface.ts

export interface FileItem {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number | null;
    lastModified: string | null;
    publicUrl?: string | null; // Add optional publicUrl
    // signedUrl is generally not stored on the item state long-term
}

// You might also have this if used elsewhere
export interface FileUser {
    id: string;
    role: string; // Or specific enum like AdminRole
    username?: string; // Add username if available
}