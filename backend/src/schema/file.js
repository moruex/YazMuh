// src/schema/file.js
// const { gql, UserInputError, AuthenticationError, ForbiddenError } = require('apollo-server-express');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const config = require('../config');
const { s3Client } = require('../s3Client');
const { rolesHierarchy } = require('../utils/authHelpers'); // Import rolesHierarchy

// --- Helper Functions (Keep as is) ---
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
        console.error(`Error checking existence for ${key}:`, err);
        throw new GraphQLError(`Failed to check item existence. ${err.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
}

// --- GraphQL Definitions ---
const typeDefs = gql`
  scalar DateTime

  type FileType {
    name: String!
    path: String!          
    isDirectory: Boolean!
    size: Float            
    lastModified: DateTime 
    publicUrl: String
    signedUrl(expiresIn: Int = ${config.r2.signedUrlExpiresIn}): String
  }

  type PresignedUploadPayload {
    url: String!
    path: String!
  }

  type FileOperationResult {
    success: Boolean!
    message: String
    item: FileType 
  }

  extend type Query {
    # Add performingActorId for potential auth checks if needed in future for list/info
    listFiles(performingActorId: ID, directory: String): [FileType!]!
    fileInfo(performingActorId: ID, path: String!): FileType
    getSignedDownloadUrl(
        performingActorId: ID, # Added for consistency, though public files might not need it strictly
        path: String!,
        expiresIn: Int = ${config.r2.signedUrlExpiresIn},
        forceDownload: Boolean = false
    ): String
  }

  extend type Mutation {
    # Requires performingAdminId with appropriate role
    generatePresignedUploadUrl(
        performingAdminId: ID!,
        filename: String!,
        contentType: String!,
        directory: String
    ): PresignedUploadPayload!

    createFolder(performingAdminId: ID!, directory: String, name: String!): FileOperationResult!
    deleteItem(performingAdminId: ID!, path: String!): FileOperationResult!
    renameItem(performingAdminId: ID!, oldPath: String!, newPath: String!): FileOperationResult!
  }
`;

// --- Resolvers ---
// Helper for admin permission check based on passed ID
async function checkAdminPermissionById(db, adminId, requiredRole = 'CONTENT_MODERATOR', action = 'perform this action') {
    if (!adminId) {
        throw new GraphQLError('Admin ID required for this action.', { extensions: { code: 'UNAUTHENTICATED' } });
    }
    const { rows } = await db.query('SELECT role FROM admins WHERE id = $1', [adminId]);
    if (rows.length === 0) {
        throw new GraphQLError('Admin performing action not found.', { extensions: { code: 'FORBIDDEN' } });
    }
    const adminRole = rows[0].role;
    const userLevel = rolesHierarchy[adminRole] || 0;
    const requiredLevel = rolesHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        console.warn(`Permission denied: Admin ${adminId} (Role: ${adminRole}) attempted to ${action}. Required: ${requiredRole}.`);
        throw new GraphQLError(`You do not have permission to ${action}. Requires ${requiredRole} role or higher.`, { extensions: { code: 'FORBIDDEN' } });
    }
    return true; // Permission granted
}

const resolvers = {
    Query: {
        listFiles: async (_, { performingActorId, directory = '' }, { db }) => {
            // Auth: If performingActorId is provided, you could check if they are at least a basic user/admin
            // For now, assuming listing is generally allowed if any actor ID is passed (or make it public)
            if (!performingActorId) { /* Consider if public or requires some actor */ }

            const prefix = directory ? (directory.endsWith('/') ? directory : `${directory}/`) : '';
            try {
                const command = new ListObjectsV2Command({
                    Bucket: config.r2.bucketName, Prefix: prefix, Delimiter: '/'
                });
                const response = await s3Client.send(command);
                const files = (response.Contents || [])
                    .filter(item => item.Key !== prefix && item.Size !== undefined)
                    .map(item => ({ name: path.basename(item.Key), path: item.Key, isDirectory: false, size: item.Size, lastModified: item.LastModified }));
                const folders = (response.CommonPrefixes || []).map(prefixData => ({ name: prefixData.Prefix.split('/').slice(-2)[0], path: prefixData.Prefix, isDirectory: true, size: 0, lastModified: null }));
                const items = [...folders, ...files].sort((a, b) => a.name.localeCompare(b.name));
                return items;
            } catch (error) {
                console.error(`Error listing files in '${prefix}':`, error);
                throw new GraphQLError(`Failed to list files. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        fileInfo: async (_, { performingActorId, path: itemPath }, { db }) => {
            // Auth: Similar to listFiles, check performingActorId if stricter access is needed.
            if (!performingActorId) { /* Consider if public or requires some actor */ }
            try {
                const command = new HeadObjectCommand({ Bucket: config.r2.bucketName, Key: itemPath });
                const response = await s3Client.send(command);
                const isDirectory = itemPath.endsWith('/');
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

        getSignedDownloadUrl: async (_, { performingActorId, path: itemPath, expiresIn, forceDownload }, { db }) => {
            // Auth: Check performingActorId if downloads need to be restricted.
            // For now, assuming if an actor ID is passed, it's okay, or it could be public.
            if (!performingActorId && !config.r2.publicUrl) { /* Potentially throw if not public and no actor */}

            if (itemPath.endsWith('/')) throw new GraphQLError('Cannot generate download URL for a directory.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                const exists = await objectExists(itemPath);
                if (!exists) throw new GraphQLError('Item not found.', { extensions: { code: 'NOT_FOUND' } });

                const commandArgs = { Bucket: config.r2.bucketName, Key: itemPath };
                if (forceDownload) {
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
        generatePresignedUploadUrl: async (_, { performingAdminId, filename, contentType, directory }, { db }) => {
           await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'generate upload URL');
           const bucketName = config.r2.bucketName;
           const prefix = directory ? (directory.endsWith('/') ? directory : `${directory}/`) : '';
           const safeFilename = path.basename(filename);

           if (!safeFilename || !contentType || safeFilename !== filename || safeFilename.startsWith('.')) {
                throw new GraphQLError('Invalid filename or missing content type.', { extensions: { code: 'BAD_USER_INPUT' } });
           }
           const fileKey = `${prefix}${safeFilename}`;

           try {
                const exists = await objectExists(fileKey);
                if (exists) throw new GraphQLError(`File '${safeFilename}' already exists at this path.`, { extensions: { code: 'BAD_USER_INPUT' } });

               const command = new PutObjectCommand({
                   Bucket: bucketName, Key: fileKey, ContentType: contentType,
               });
               const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: config.r2.signedUrlExpiresIn });
               return { url: signedUrl, path: fileKey };
           } catch (error) {
               console.error(`Error generating presigned upload URL for ${fileKey}:`, error);
               if (error instanceof GraphQLError) throw error;
               throw new GraphQLError(`Failed to generate upload URL. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
           }
        },

         createFolder: async (_, { performingAdminId, directory = '', name }, { db }) => {
            await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create folder');
            const prefix = directory ? (directory.endsWith('/') ? directory : `${directory}/`) : '';
            const folderKey = `${prefix}${name}/`;
            if (!name || name.includes('/')) throw new GraphQLError('Invalid folder name.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                 const exists = await objectExists(folderKey);
                 if (exists) throw new GraphQLError(`Item named '${name}' already exists at this path.`, { extensions: { code: 'BAD_USER_INPUT' } });
                const command = new PutObjectCommand({ Bucket: config.r2.bucketName, Key: folderKey, Body: '', ContentLength: 0 });
                await s3Client.send(command);
                 const createdFolderItem = { name: name, path: folderKey, isDirectory: true, size: 0, lastModified: new Date() };
                return { success: true, message: `Folder '${name}' created.`, item: createdFolderItem };
            } catch (error) {
                console.error(`Error creating folder '${folderKey}':`, error);
                 if (error instanceof GraphQLError) throw error;
                throw new GraphQLError(`Failed to create folder. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        deleteItem: async (_, { performingAdminId, path: itemPath }, { db }) => {
             await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'delete item');
             const bucketName = config.r2.bucketName;
             if (!itemPath) throw new GraphQLError('Path required.', { extensions: { code: 'BAD_USER_INPUT' } });

             try {
                 const exists = await objectExists(itemPath);
                 if (!exists) return { success: false, message: "Item not found.", item: null };

                 if (itemPath.endsWith('/')) {
                     const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: itemPath });
                     let isTruncated = true;
                     let continuationToken;
                     while(isTruncated) {
                        const response = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: itemPath, ContinuationToken: continuationToken}));
                        const contents = response.Contents || [];
                        if (contents.length > 0) {
                            const deletePromises = contents.map(item => s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: item.Key })));
                            await Promise.all(deletePromises);
                        }
                        isTruncated = response.IsTruncated;
                        continuationToken = response.NextContinuationToken;
                     }
                    try { await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: itemPath })); } // Delete the folder marker itself
                    catch (delErr){ if (delErr.name !== 'NotFound' && delErr.name !== 'NoSuchKey') console.warn("Non-critical error deleting folder marker:", delErr.message); }
                 } else {
                     await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: itemPath }));
                 }
                 // For item, we can construct a basic representation since it's deleted
                 const deletedItemRepresentation = { name: path.basename(itemPath.replace(/\/$/, '')), path: itemPath, isDirectory: itemPath.endsWith('/'), size: null, lastModified: null, publicUrl: null, signedUrl: null };
                 return { success: true, message: `Item '${path.basename(itemPath.replace(/\/$/, ''))}' deleted.`, item: deletedItemRepresentation };
             } catch (error) {
                 console.error(`Error deleting item '${itemPath}':`, error);
                 if (error instanceof GraphQLError) throw error;
                 throw new GraphQLError(`Failed to delete item. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
             }
        },

        renameItem: async (_, { performingAdminId, oldPath, newPath }, { db }) => {
            await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'rename item');
            const bucketName = config.r2.bucketName;
            if (!oldPath || !newPath || oldPath === newPath) throw new GraphQLError('Valid old/new paths required.', { extensions: { code: 'BAD_USER_INPUT' } });
            if (oldPath === '/' || newPath === '/' || newPath.startsWith(oldPath + (oldPath.endsWith('/') ? '' : '/'))) throw new GraphQLError('Invalid rename operation (e.g. renaming to subpath of self).', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                 const sourceExists = await objectExists(oldPath);
                 if (!sourceExists) throw new GraphQLError('Source item not found.', { extensions: { code: 'NOT_FOUND' } });
                 const destExists = await objectExists(newPath);
                 if (destExists) throw new GraphQLError('Destination path already exists.', { extensions: { code: 'BAD_USER_INPUT' } });

                 const isDirectory = oldPath.endsWith('/');
                 if (isDirectory !== newPath.endsWith('/')) throw new GraphQLError("Cannot change item type (file/folder) during rename.", { extensions: { code: 'BAD_USER_INPUT' } });

                 if (isDirectory) {
                     let continuationToken;
                     do {
                        const response = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: oldPath, ContinuationToken: continuationToken}));
                        const contents = response.Contents || [];
                         if (contents.length > 0) {
                             const copyDeletePromises = contents.map(async (item) => {
                                const itemNewKey = item.Key.replace(oldPath, newPath);
                                await s3Client.send(new CopyObjectCommand({ Bucket: bucketName, CopySource: `${bucketName}/${item.Key}`, Key: itemNewKey }));
                                await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: item.Key }));
                             });
                             await Promise.all(copyDeletePromises);
                         }
                        continuationToken = response.NextContinuationToken;
                     } while(continuationToken);
                     // Ensure the old folder marker itself is copied if it exists as a distinct object and then deleted.
                     if (await objectExists(oldPath)) { // Check if old folder marker (0-byte object) exists
                        await s3Client.send(new CopyObjectCommand({ Bucket: bucketName, CopySource: `${bucketName}/${oldPath}`, Key: newPath }));
                        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: oldPath }));
                     }
                 } else {
                     await s3Client.send(new CopyObjectCommand({ Bucket: bucketName, CopySource: `${bucketName}/${oldPath}`, Key: newPath }));
                     await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: oldPath }));
                 }
                 
                 const newItemInfo = await resolvers.Query.fileInfo(_, { path: newPath }, { db });
                 return { success: true, message: 'Item renamed successfully.', item: newItemInfo };
            } catch (error) {
                 console.error(`Error renaming '${oldPath}' to '${newPath}':`, error);
                 if (error instanceof GraphQLError) throw error;
                 throw new GraphQLError(`Failed to rename item. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },
    },

    FileType: {
        publicUrl: (file) => {
            if (file.isDirectory || !config.r2.publicUrl || !file.path) return null;
            const baseUrl = config.r2.publicUrl.replace(/\/$/, '');
            const filePath = file.path.replace(/^\//, '');
            return `${baseUrl}/${filePath}`;
        },
        signedUrl: async (file, { expiresIn }) => {
            if (file.isDirectory || !file.path) return null;
             try {
                 const command = new GetObjectCommand({ Bucket: config.r2.bucketName, Key: file.path });
                 const expiry = expiresIn || config.r2.signedUrlExpiresIn;
                 const url = await getSignedUrl(s3Client, command, { expiresIn: expiry });
                 return url;
             } catch (error) {
                 console.error(`Error in FileType.signedUrl resolver for ${file.path}:`, error.message);
                 return null;
             }
        },
    },
};

module.exports = { typeDefs, resolvers };
