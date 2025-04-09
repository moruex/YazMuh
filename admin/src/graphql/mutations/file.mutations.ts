// src/graphql/mutations/file.mutations.ts
import { gql } from '@apollo/client';
import { FILE_TYPE_FIELDS } from '../fragments';

/** Generates a pre-signed URL for uploading a file directly to storage (e.g., R2, S3). */
export const GENERATE_PRESIGNED_UPLOAD_URL = gql`
  mutation GeneratePresignedUploadUrl(
    $filename: String!,
    $contentType: String!,
    $directory: String
  ) {
    # Assumes mutation name 'generatePresignedUploadUrl'
    generatePresignedUploadUrl(
      filename: $filename,
      contentType: $contentType,
      directory: $directory
    ) {
      url      # The presigned PUT URL
      path     # The final object path in storage
    }
  }
`;

/** Creates a new folder/directory in storage. */
export const CREATE_FOLDER = gql`
  ${FILE_TYPE_FIELDS} # Return info about the created folder
  mutation CreateFolder($directory: String, $name: String!) {
    # Assumes mutation name 'createFolder'
    createFolder(directory: $directory, name: $name) {
      success
      message
      item { # The created folder FileType object
        ...FileTypeFields
      }
    }
  }
`;

/** Deletes a file or folder (recursively if folder) from storage. */
export const DELETE_ITEM = gql`
  mutation DeleteItem($path: String!) {
    # Assumes mutation name 'deleteItem'
    deleteItem(path: $path) {
      success
      message
      # item field will likely be null after successful deletion
    }
  }
`;

/** Renames or moves a file or folder in storage. */
export const RENAME_ITEM = gql`
  ${FILE_TYPE_FIELDS} # Return info about the item at the new path
  mutation RenameItem($oldPath: String!, $newPath: String!) {
    # Assumes mutation name 'renameItem'
    renameItem(oldPath: $oldPath, newPath: $newPath) {
      success
      message
      item { # The renamed/moved FileType object
        ...FileTypeFields
      }
    }
  }
`;