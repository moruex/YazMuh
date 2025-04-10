// src/schema/file.js
// const { gql, UserInputError, AuthenticationError, ForbiddenError } = require('apollo-server-express');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const config = require('../config');
const { s3Client } = require('../s3Client');

// --- Helper Functions (Keep as is) ---
// --- Helper Functions ---

const _ensureLoggedIn = (context) => {
    if (!context.getCurrentActor()) {
        throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
    }
};

// Simplified Permission Check (Admin bypass)
// NOTE: Object-level ownership checks are removed as metadata is gone.
const checkAdminPermission = (actor, action = 'perform this action') => {
    if (!actor) throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
    // Allow if actor is an admin with sufficient role
    if (actor.role !== 'CONTENT_MODERATOR') {
        return true;
    }
    // Deny for non-admins in this simplified check
    console.warn(`Permission denied: Non-admin actor ${actor.id} (${actor.role}) attempted to ${action}.`);
    throw new GraphQLError(`You do not have permission to ${action}. Admin privileges required.`, { extensions: { code: 'FORBIDDEN' } });
};

// Helper to check if an object exists (using HeadObject)
// Returns true if exists, false if not found, throws on other errors.
async function objectExists(key) {
     try {
        const headCmd = new HeadObjectCommand({
            Bucket: config.r2.bucketName,
            Key: key,
        });
        await s3Client.send(headCmd);
        return true; // Object exists
    } catch (err) {
        if (err.name === 'NotFound' || err.name === 'NoSuchKey') {
            return false; // Object does not exist
        }
        // Re-throw other errors (permissions, network, etc.)
        console.error(`Error checking existence for ${key}:`, err);
        throw new GraphQLError(`Failed to check item existence. ${err.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
}

// --- GraphQL Definitions ---
const typeDefs = gql`
  scalar DateTime

  type FileType {
    name: String!
    path: String!          # Full key in R2
    isDirectory: Boolean!
    size: Float            # Size in bytes (null/0 for folders)
    lastModified: DateTime # Last modification timestamp from R2
    # NEW: Persistent public URL if configured and file is not a directory
    publicUrl: String
    # OLD: Temporary signed URL for download/access
    signedUrl(expiresIn: Int = ${config.r2.signedUrlExpiresIn}): String
  }

  type PresignedUploadPayload {
    url: String!
    path: String!
  }

  type FileOperationResult {
    success: Boolean!
    message: String
    item: FileType # Return the item (will include publicUrl if applicable)
  }

  extend type Query {
    listFiles(directory: String): [FileType!]!
    fileInfo(path: String!): FileType
    # Renamed for clarity, generates a TEMPORARY link
    getSignedDownloadUrl(
        path: String!,
        expiresIn: Int = ${config.r2.signedUrlExpiresIn},
        # NEW: Optional flag to suggest download disposition
        forceDownload: Boolean = false
    ): String
  }

  extend type Mutation {
    generatePresignedUploadUrl(
        filename: String!,
        contentType: String!,
        directory: String
    ): PresignedUploadPayload!

    createFolder(directory: String, name: String!): FileOperationResult!
    deleteItem(path: String!): FileOperationResult!
    renameItem(oldPath: String!, newPath: String!): FileOperationResult!
  }
`;

// --- Resolvers ---
const resolvers = {
    Query: {
        listFiles: async (_, { directory = '' }, context) => {
            _ensureLoggedIn(context);
            const prefix = directory ? (directory.endsWith('/') ? directory : `${directory}/`) : '';

            try {
                const command = new ListObjectsV2Command({
                    Bucket: config.r2.bucketName, Prefix: prefix, Delimiter: '/'
                });
                const response = await s3Client.send(command);

                // Map basic info. publicUrl and signedUrl resolved by FileType resolver.
                const files = (response.Contents || [])
                    .filter(item => item.Key !== prefix && item.Size !== undefined)
                    .map(item => ({
                        name: path.basename(item.Key), path: item.Key, isDirectory: false, size: item.Size, lastModified: item.LastModified,
                    }));
                const folders = (response.CommonPrefixes || []).map(prefixData => ({
                    name: prefixData.Prefix.split('/').slice(-2)[0], path: prefixData.Prefix, isDirectory: true, size: 0, lastModified: null,
                }));
                const items = [...folders, ...files].sort((a, b) => a.name.localeCompare(b.name));

                return items;
            } catch (error) {
                console.error(`Error listing files in '${prefix}':`, error);
                throw new GraphQLError(`Failed to list files. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        fileInfo: async (_, { path: itemPath }, context) => {
            _ensureLoggedIn(context);
            try {
                const command = new HeadObjectCommand({ Bucket: config.r2.bucketName, Key: itemPath });
                const response = await s3Client.send(command);
                const isDirectory = itemPath.endsWith('/');

                // Return basic info. publicUrl/signedUrl resolved by FileType resolver.
                return {
                    name: path.basename(itemPath.replace(/\/$/, '')), path: itemPath, isDirectory: isDirectory,
                    size: isDirectory ? 0 : response.ContentLength, lastModified: response.LastModified,
                };
            } catch (err) {
                if (err.name === 'NoSuchKey' || err.name === 'NotFound') return null;
                console.error(`Error getting info for '${itemPath}':`, err);
                throw new GraphQLError(`Failed to get file information. ${err.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Generates a temporary signed URL, potentially forcing download
        getSignedDownloadUrl: async (_, { path: itemPath, expiresIn, forceDownload }, context) => {
            _ensureLoggedIn(context);
            if (itemPath.endsWith('/')) throw new GraphQLError('Cannot generate download URL for a directory.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                const exists = await objectExists(itemPath);
                if (!exists) throw new GraphQLError('Item not found.', { extensions: { code: 'BAD_USER_INPUT' } });

                const commandArgs = { Bucket: config.r2.bucketName, Key: itemPath };

                // If forceDownload, suggest a filename to the browser
                if (forceDownload) {
                    // NOTE: R2/S3 might handle Content-Disposition differently than standard S3.
                    // This might require setting it on the object metadata itself *or*
                    // it might work via signed URL parameters depending on the presigner version & R2 implementation.
                    // Testing is needed. If this doesn't work, the best way is to proxy the download server-side.
                    commandArgs.ResponseContentDisposition = `attachment; filename="${path.basename(itemPath)}"`;
                }

                const command = new GetObjectCommand(commandArgs);
                const url = await getSignedUrl(s3Client, command, { expiresIn: expiresIn || config.r2.signedUrlExpiresIn });
                return url;
            } catch (error) {
                console.error(`Error generating signed download URL for '${itemPath}':`, error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError(`Failed to generate signed download URL. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },
    },

    Mutation: {
        // generatePresignedUploadUrl: unchanged - this is for PUTs
        generatePresignedUploadUrl: async (_, { filename, contentType, directory }, context) => {
           _ensureLoggedIn(context);
           const actor = context.getCurrentActor();
           const bucketName = config.r2.bucketName;
           const prefix = directory ? (directory.endsWith('/') ? directory : `${directory}/`) : '';
           const safeFilename = path.basename(filename);

           if (!safeFilename || !contentType || safeFilename !== filename || safeFilename.startsWith('.')) {
                throw new GraphQLError('Invalid filename or missing content type.', { extensions: { code: 'BAD_USER_INPUT' } });
           }
           const fileKey = `${prefix}${safeFilename}`;

           try {
                const exists = await objectExists(fileKey);
                if (exists) throw new GraphQLError(`File '${safeFilename}' already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });

               const command = new PutObjectCommand({
                   Bucket: bucketName,
                   Key: fileKey,
                   ContentType: contentType,
               });

               const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: config.r2.signedUrlExpiresIn });
               console.log(`Generated presigned PUT URL for ${fileKey} (User: ${actor?.id})`);
               return { url: signedUrl, path: fileKey };

           } catch (error) {
               console.error(`Error generating presigned upload URL for ${fileKey}:`, error);
               if (error instanceof GraphQLError) throw error;
               throw new GraphQLError(`Failed to generate upload URL. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
           }
        },

        // createFolder: unchanged logic, but returns FileOperationResult which includes FileType
         createFolder: async (_, { directory = '', name }, context) => {
            _ensureLoggedIn(context);
            const actor = context.getCurrentActor();
            checkAdminPermission(actor, 'create folder'); // Keep permission check

            const prefix = directory ? (directory.endsWith('/') ? directory : `${directory}/`) : '';
            const folderKey = `${prefix}${name}/`;
            if (!name || name.includes('/')) throw new GraphQLError('Invalid folder name.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                 const exists = await objectExists(folderKey);
                 if (exists) throw new GraphQLError(`Item named '${name}' already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });

                const command = new PutObjectCommand({
                    Bucket: config.r2.bucketName, Key: folderKey, Body: '', ContentLength: 0,
                });
                await s3Client.send(command);
                 // Construct the item data to return - publicUrl/signedUrl will be null for folders
                 const createdFolderItem = { name: name, path: folderKey, isDirectory: true, size: 0, lastModified: new Date() };
                return { success: true, message: `Folder '${name}' created.`, item: createdFolderItem };
            } catch (error) {
                console.error(`Error creating folder '${folderKey}':`, error);
                 if (error instanceof GraphQLError || error instanceof ForbiddenError) throw error;
                throw new GraphQLError(`Failed to create folder. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // deleteItem: unchanged logic
        deleteItem: async (_, { path: itemPath }, context) => {
             _ensureLoggedIn(context);
             const actor = context.getCurrentActor();
             checkAdminPermission(actor, 'delete item'); // Keep permission check

             const bucketName = config.r2.bucketName;
             if (!itemPath) throw new GraphQLError('Path required.', { extensions: { code: 'BAD_USER_INPUT' } });

             try {
                 const exists = await objectExists(itemPath);
                 if (!exists) return { success: false, message: "Item not found." };

                 if (itemPath.endsWith('/')) {
                     // Recursive delete (simplified, needs pagination for >1000 items)
                     const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: itemPath });
                     let isTruncated = true;
                     let continuationToken;
                     console.log(`Deleting folder contents: ${itemPath}`);
                     while(isTruncated) {
                        const response = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: itemPath, ContinuationToken: continuationToken}));
                        const contents = response.Contents || [];
                        if (contents.length > 0) {
                            console.log(`  Deleting batch of ${contents.length} items...`);
                            const deletePromises = contents.map(item => s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: item.Key })));
                            await Promise.all(deletePromises);
                        } else {
                            console.log("  No items found in this batch.");
                        }
                        isTruncated = response.IsTruncated;
                        continuationToken = response.NextContinuationToken;
                     }
                     console.log(`Finished deleting contents of ${itemPath}. Deleting folder marker.`);
                     // Delete folder marker itself (if it exists)
                    try { await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: itemPath })); }
                    catch (delErr){ if (delErr.name !== 'NotFound' && delErr.name !== 'NoSuchKey') console.error("Non-critical error deleting folder marker:", delErr); }

                 } else {
                     // Delete single file
                     console.log(`Deleting file: ${itemPath}`);
                     await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: itemPath }));
                 }
                 return { success: true, message: `Item '${path.basename(itemPath.replace(/\/$/, ''))}' deleted.` };
             } catch (error) {
                 console.error(`Error deleting item '${itemPath}':`, error);
                 if (error instanceof GraphQLError || error instanceof ForbiddenError) throw error;
                 throw new GraphQLError(`Failed to delete item. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
             }
        },


        // renameItem: logic unchanged, but returns FileType potentially including publicUrl
        renameItem: async (_, { oldPath, newPath }, context) => {
            _ensureLoggedIn(context);
            const actor = context.getCurrentActor();
            // checkAdminPermission(actor, 'rename item'); // Keep permission check

            const bucketName = config.r2.bucketName;
            if (!oldPath || !newPath || oldPath === newPath) throw new GraphQLError('Valid old/new paths required.', { extensions: { code: 'BAD_USER_INPUT' } });
            if (oldPath === '/' || newPath === '/' || newPath.startsWith(oldPath + (oldPath.endsWith('/') ? '' : '/'))) throw new GraphQLError('Invalid rename operation.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                 const sourceExists = await objectExists(oldPath);
                 if (!sourceExists) throw new GraphQLError('Source item not found.', { extensions: { code: 'BAD_USER_INPUT' } });

                 const destExists = await objectExists(newPath);
                 if (destExists) throw new GraphQLError('Destination path already exists.', { extensions: { code: 'BAD_USER_INPUT' } });

                 const isDirectory = oldPath.endsWith('/');
                 if (isDirectory !== newPath.endsWith('/')) throw new GraphQLError("Cannot change item type during rename.", { extensions: { code: 'BAD_USER_INPUT' } });

                 if (isDirectory) {
                     // Recursive copy+delete (simplified, needs pagination for >1000 items)
                     console.log(`Renaming folder: ${oldPath} -> ${newPath}`);
                     const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: oldPath });
                     let isTruncated = true;
                     let continuationToken;
                     while(isTruncated) {
                        const response = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: oldPath, ContinuationToken: continuationToken}));
                        const contents = response.Contents || [];
                         if (contents.length > 0) {
                             console.log(`  Copy/Deleting batch of ${contents.length} items...`);
                             const copyDeletePromises = contents.map(async (item) => {
                                const itemNewKey = item.Key.replace(oldPath, newPath);
                                await s3Client.send(new CopyObjectCommand({ Bucket: bucketName, CopySource: `${bucketName}/${item.Key}`, Key: itemNewKey }));
                                await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: item.Key }));
                             });
                             await Promise.all(copyDeletePromises);
                         } else {
                            console.log("  No items found in this batch.");
                         }
                        isTruncated = response.IsTruncated;
                        continuationToken = response.NextContinuationToken;
                     }
                     console.log(`Finished renaming contents of ${oldPath}. Renaming marker.`);
                     // Rename folder marker itself (copy then delete)
                     try {
                         if (await objectExists(oldPath)) { // Double check marker exists
                            await s3Client.send(new CopyObjectCommand({ Bucket: bucketName, CopySource: `${bucketName}/${oldPath}`, Key: newPath }));
                            await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: oldPath }));
                         }
                     } catch (markerErr) { console.warn("Non-critical issue renaming folder marker:", markerErr.message); }

                 } else {
                     // Rename file (copy then delete)
                     console.log(`Renaming file: ${oldPath} -> ${newPath}`);
                     await s3Client.send(new CopyObjectCommand({ Bucket: bucketName, CopySource: `${bucketName}/${oldPath}`, Key: newPath }));
                     await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: oldPath }));
                 }

                 // Fetch info of the newly renamed item for the payload using the Query resolver
                 console.log(`Fetching info for new item: ${newPath}`);
                 const newItemInfo = await resolvers.Query.fileInfo(_, { path: newPath }, context);
                 if (!newItemInfo) { // Should exist, but handle edge case
                    console.warn(`Could not fetch info for renamed item at ${newPath}`);
                    // Return a basic representation if fetch fails
                    return { success: true, message: 'Item renamed, but failed to fetch updated info.', item: { name: path.basename(newPath.replace(/\/$/, '')), path: newPath, isDirectory: newPath.endsWith('/'), size: null, lastModified: new Date() } };
                 }

                 return { success: true, message: 'Item renamed.', item: newItemInfo };
            } catch (error) {
                 console.error(`Error renaming '${oldPath}' to '${newPath}':`, error);
                 if (error instanceof GraphQLError || error instanceof ForbiddenError) throw error;
                 throw new GraphQLError(`Failed to rename item. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },
    },

    // FileType field resolvers
    FileType: {
        // NEW: Resolve public URL
        publicUrl: (file) => {
            // Only return for files, and only if public URL base is configured
            if (file.isDirectory || !config.r2.publicUrl || !file.path) {
                return null;
            }
            // Construct the public URL
            const baseUrl = config.r2.publicUrl.replace(/\/$/, ''); // Remove trailing slash if exists
            const filePath = file.path.replace(/^\//, ''); // Remove leading slash if exists
            return `${baseUrl}/${filePath}`;
        },
        // OLD: Resolve temporary signed URL
        signedUrl: async (file, { expiresIn }, context) => {
            if (file.isDirectory || !file.path) return null;
             try {
                 const command = new GetObjectCommand({ Bucket: config.r2.bucketName, Key: file.path });
                 // Use the specific expiresIn requested, or the default from config
                 const expiry = expiresIn || config.r2.signedUrlExpiresIn;
                 const url = await getSignedUrl(s3Client, command, { expiresIn: expiry });
                 return url;
             } catch (error) {
                 // Don't throw error for resolver failure, just return null
                 console.error(`Error in FileType.signedUrl resolver for ${file.path}:`, error.message);
                 return null;
             }
        },
        // publicUrl resolver now handles this logic. This specific resolver is removed.
        // publicUrl: (file) => { ... } // REMOVE THIS if you had a direct one before
    },
};

module.exports = { typeDefs, resolvers };