// src/graphql/queries/file.queries.ts
import { gql } from '@apollo/client';
import { FILE_TYPE_FIELDS } from '../fragments'; // Correct path if needed

/** Lists files and directories within a specified storage directory. */
export const LIST_FILES = gql`
  ${FILE_TYPE_FIELDS} # Ensure this fragment includes publicUrl
  query ListFiles($directory: String) {
    listFiles(directory: $directory) {
      ...FileTypeFields
    }
  }
`;

/** Gets detailed information for a single file or directory path. */
export const GET_FILE_INFO = gql`
  ${FILE_TYPE_FIELDS} # Ensure this fragment includes publicUrl
  query GetFileInfo($path: String!) {
    fileInfo(path: $path) {
      ...FileTypeFields
      # You might want signedUrl here too sometimes, but usually fetched on demand
      # signedUrl
    }
  }
`;

/** Generates a temporary, signed URL for downloading a private file. */
export const GET_SIGNED_DOWNLOAD_URL = gql`
  query GetSignedDownloadUrl(
    $path: String!,
    $expiresIn: Int,
    $forceDownload: Boolean # <<< ADD THIS ARGUMENT
 ) {
    # Returns String (the signed URL)
    getSignedDownloadUrl(path: $path, expiresIn: $expiresIn, forceDownload: $forceDownload)
  }
`;