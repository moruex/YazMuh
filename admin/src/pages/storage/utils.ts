// src/pages/storage/utils.ts
import { addNotification } from '@utils/utils'; // Keep notification util
import { /* FileUser, */ FileItem } from './interface'; // Use the updated FileItem, removed FileUser
import {
    LIST_FILES,
    CREATE_FOLDER,
    DELETE_ITEM,
    RENAME_ITEM,
    GENERATE_PRESIGNED_UPLOAD_URL,
    GET_SIGNED_DOWNLOAD_URL,
    GET_FILE_INFO // Optional: if needed for InfoModal pre-fetch
} from '@graphql/index'; // Adjust path if needed
// import { AdminRole } from '@interfaces/index'; // Removed AdminRole
import client from '@graphql/apolloClient';

// --- GraphQL API Functions ---

export const listFilesGraphQL = async (directory: string): Promise<FileItem[]> => {
    try {
        const { data, errors } = await client.query<{ listFiles: FileItem[] }>({
            query: LIST_FILES,
            variables: { directory: directory || null }, // Send null if empty string
            fetchPolicy: 'network-only', // Ensure fresh data
        });

        if (errors) {
            console.error('GraphQL Error listing files:', errors);
            throw new Error(errors[0]?.message || 'Failed to list files');
        }

        return data?.listFiles || []; // Return the array or empty array if null/undefined
    } catch (error: any) {
        console.error('Network/Apollo Error listing files:', error);
        // Check for specific Apollo error types if needed
        addNotification(error.message || 'Network error listing files.', 'error');
        return []; // Return empty array on error to prevent crashes
    }
};

// Function to get the presigned URL (DOES NOT UPLOAD HERE)
export const getPresignedUrlForUpload = async (
    filename: string,
    contentType: string,
    directory: string
): Promise<{ url: string; path: string } | null> => {
    try {
        const { data, errors } = await client.mutate<{ generatePresignedUploadUrl: { url: string; path: string } }>({
            mutation: GENERATE_PRESIGNED_UPLOAD_URL,
            variables: {
                filename,
                contentType,
                directory: directory || null,
            }
        });

        if (errors) {
            console.error('GraphQL Error getting presigned URL:', errors);
            throw new Error(errors[0]?.message || 'Failed to get upload URL');
        }
        if (!data?.generatePresignedUploadUrl?.url) {
            throw new Error('Received invalid upload URL data from server.');
        }

        return data.generatePresignedUploadUrl;
    } catch (error: any) {
        console.error('Error getting presigned URL:', error);
        addNotification(error.message || 'Could not prepare file for upload.', 'error');
        return null;
    }
};


export const createFolderGraphQL = async (name: string, directory: string): Promise<boolean> => {
    try {
        const { data, errors } = await client.mutate<{ createFolder: { success: boolean, message: string } }>({
            mutation: CREATE_FOLDER,
            variables: { name, directory: directory || null }
        });

        if (errors) throw new Error(errors[0]?.message || 'Failed to create folder');
        if (!data?.createFolder?.success) throw new Error(data?.createFolder?.message || 'Failed to create folder');

        addNotification(data.createFolder.message || `Folder '${name}' created.`, 'success');
        return true;
    } catch (error: any) {
        console.error('Error creating folder:', error);
        addNotification(error.message || 'Could not create folder.', 'error');
        return false;
    }
};

export const deleteItemGraphQL = async (itemPath: string): Promise<boolean> => {
    try {
        const { data, errors } = await client.mutate<{ deleteItem: { success: boolean, message: string } }>({
            mutation: DELETE_ITEM,
            variables: { path: itemPath } // Variable name is 'path' in GQL
        });

        if (errors) throw new Error(errors[0]?.message || 'Failed to delete item');
        if (!data?.deleteItem?.success) {
            // If success is false but no error, it might mean "not found" or similar
             addNotification(data?.deleteItem?.message || 'Item could not be deleted.', data?.deleteItem?.message === "Item not found." ? 'warning' : 'error');
             return false; // Indicate deletion didn't happen
        }


        addNotification(data.deleteItem.message || 'Item deleted successfully.', 'success');
        return true;
    } catch (error: any) {
        console.error('Error deleting item:', error);
        addNotification(error.message || 'Could not delete item.', 'error');
        return false;
    }
};

export const renameItemGraphQL = async (oldPath: string, newPath: string): Promise<boolean> => {
    try {
        const { data, errors } = await client.mutate<{ renameItem: { success: boolean, message: string } }>({
            mutation: RENAME_ITEM,
            variables: { oldPath, newPath }
        });

        if (errors) throw new Error(errors[0]?.message || 'Failed to rename item');
        if (!data?.renameItem?.success) throw new Error(data?.renameItem?.message || 'Failed to rename item');

        addNotification(data.renameItem.message || 'Item renamed successfully.', 'success');
        return true;
    } catch (error: any) {
        console.error('Error renaming item:', error);
        addNotification(error.message || 'Could not rename item.', 'error');
        return false;
    }
};

// Updated function signature to include forceDownload
export const getSignedUrlForDownload = async (itemPath: string, forceDownload: boolean = false): Promise<string | null> => {
    try {
        const { data, errors } = await client.query<{ getSignedDownloadUrl: string }>({
            query: GET_SIGNED_DOWNLOAD_URL,
            variables: { path: itemPath, forceDownload }, // Pass forceDownload variable
            fetchPolicy: 'network-only',
        });
        if (errors) throw new Error(errors[0]?.message || 'Failed to get download URL');
        if (!data?.getSignedDownloadUrl) throw new Error('No download URL received');
        return data.getSignedDownloadUrl;
    } catch (error: any) {
        console.error('Error getting download URL:', error);
        addNotification(error.message || 'Could not get download link.', 'error');
        return null;
    }
};


// Optional: Function to get full item details if listFiles doesn't have everything
export const getFileDetailsGraphQL = async (itemPath: string): Promise<FileItem | null> => {
     try {
        const { data, errors } = await client.query<{ fileInfo: FileItem }>({
            query: GET_FILE_INFO,
            variables: { path: itemPath },
             fetchPolicy: 'cache-first', // Can cache details
        });

        if (errors) throw new Error(errors[0]?.message || 'Failed to fetch file details');

        return data?.fileInfo || null;
    } catch (error: any) {
        console.error('Error fetching file details:', error);
        addNotification(error.message || 'Could not fetch item details.', 'error');
        return null;
    }
};
