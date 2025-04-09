// src/graphql/fragments/file.fragments.ts
import { gql } from '@apollo/client';

/** Fields representing a file or directory item in storage. */
export const FILE_TYPE_FIELDS = gql`
  fragment FileTypeFields on FileType {
    name
    path
    isDirectory
    size
    lastModified
    publicUrl
    # signedUrl is not typically needed in fragments, fetch via query/resolver if needed
  }
`;