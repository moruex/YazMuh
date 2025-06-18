// src/schema/news.js
// const { gql, AuthenticationError, ForbiddenError } = require('apollo-server-express');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql'); // Import GraphQLError
const { rolesHierarchy } = require('../utils/authHelpers');

// Helper for admin permission check (can be centralized later)
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
    return true; 
}

// HELPER: Slugify function (simple version, can be moved to a shared util)
// Not needed if slug is removed
// const slugify = (text) => {
//   if (!text) return '';
//   return text.toString().toLowerCase()
//     .replace(/\s+/g, '-')
//     .replace(/[^\w-]+/g, '')
//     .replace(/--+/g, '-')
//     .replace(/^-+/, '')
//     .replace(/-+$/, '');
// };

// --- GraphQL Definitions ---
const typeDefs = gql`
  # Ensure User type is defined elsewhere
  # type User { id: ID!, username: String!, isAdmin: Boolean, ... }
  # Ensure Movie type is defined elsewhere
  # type Movie { ... }
  # Ensure DateTime scalar is defined
  # scalar DateTime

  type NewsArticle {
    id: ID!
    title: String!
    # slug: String! # Removed slug
    short_content: String
    content: String!
    author_id: ID
    image_url: String
    published_at: String # This will determine if it's "published" or "draft"
    updated_at: String
    # created_at: String # Removed created_at
    # view_count: Int # Removed view_count
    # status: String # Removed status
    # tags: [String] # Removed tags
    excerpt: String # Resolver maps this from short_content
    featured_image_url: String # Resolver maps this from image_url
    # category_id: ID # Removed category_id
    
    # Connections
    author: User
    # category: NewsCategory # Removed category connection
    movies: [Movie!]
  }

  # type NewsCategory { # Removed NewsCategory type
  #   id: ID!
  #   name: String!
  #   description: String
  # }

  input CreateNewsArticleInput {
    title: String!
    content: String!
    excerpt: String
    featured_image_url: String
    short_content: String
    image_url: String
    # status: String # Removed status
    published_at: String # Can be set to null for draft, or a date to publish
    # category_id: ID # Removed category_id
    # tags: [String] # Removed tags
    author_id: ID
  }

  input UpdateNewsArticleInput {
    title: String
    content: String
    excerpt: String
    featured_image_url: String
    short_content: String
    image_url: String
    # status: String # Removed status
    published_at: String # Can be set to null for draft, or a date to publish/republish
    # category_id: ID # Removed category_id
    # tags: [String] # Removed tags
    author_id: ID
  }

  # input CreateNewsCategoryInput { # Removed CreateNewsCategoryInput
  #   name: String!
  #   description: String
  # }
  #
  # input UpdateNewsCategoryInput { # Removed UpdateNewsCategoryInput
  #   name: String
  #   description: String
  # }

  # --- Extend base Query ---
  extend type Query {
    newsArticle(id: ID!): NewsArticle # Changed to only accept id
    newsArticles(
        limit: Int = 10, 
        offset: Int = 0, 
        search: String, 
        # status: String, # Removed status filter
        authorId: ID,
        # tag: String, # Removed tag filter
        sortBy: String = "published_at",
        sortOrder: String = "DESC"
    ): [NewsArticle!]
    newsArticleCount(
        search: String, 
        # status: String, # Removed status filter
        authorId: ID
        # tag: String # Removed tag filter
    ): Int!

    # newsCategory(id: ID, slug: String): NewsCategory # Removed newsCategory query
    # newsCategories(limit: Int = 50, offset: Int = 0): [NewsCategory!] # Removed newsCategories query
  }

  # --- Extend base Mutation ---
  extend type Mutation {
    # News Article Mutations (Admin restricted)
    createNewsArticle(performingAdminId: ID!, input: CreateNewsArticleInput!): NewsArticle!
    updateNewsArticle(performingAdminId: ID!, id: ID!, input: UpdateNewsArticleInput!): NewsArticle!
    deleteNewsArticle(performingAdminId: ID!, id: ID!): Boolean!
    publishNewsArticle(performingAdminId: ID!, id: ID!): NewsArticle! # Sets published_at to NOW()
    unpublishNewsArticle(performingAdminId: ID!, id: ID!): NewsArticle! # Sets published_at to NULL

    # News Category Mutations (Admin restricted) - REMOVED
    # createNewsCategory(performingAdminId: ID!, input: CreateNewsCategoryInput!): NewsCategory!
    # updateNewsCategory(performingAdminId: ID!, id: ID!, input: UpdateNewsCategoryInput!): NewsCategory!
    # deleteNewsCategory(performingAdminId: ID!, id: ID!): Boolean!

    # User action
    toggleNewsArticleBookmark(userId: ID!, articleId: ID!): NewsArticle!
    # incrementNewsArticleViewCount(articleId: ID!): NewsArticle # Removed incrementNewsArticleViewCount
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    newsArticle: async (_, { id }, { db }) => { // Removed slug from parameters
      if (!id) throw new GraphQLError('ID must be provided.', { extensions: { code: 'BAD_USER_INPUT' } });
      let query = 'SELECT * FROM news WHERE id = $1';
      const params = [id];
      const { rows } = await db.query(query, params);
      if (rows.length === 0) throw new GraphQLError('News article not found.', { extensions: { code: 'NOT_FOUND' } });
      return transformNewsArticle(rows[0]);
    },
    newsArticles: async (_, { limit, offset, search, /* status, */ authorId, /* tag, */ sortBy, sortOrder }, { db }) => { // removed status
      let query = 'SELECT * FROM news';
      const params = [];
      const conditions = [];
      let placeholderCount = 1;

      if (search) {
        conditions.push(`(title ILIKE $${placeholderCount} OR content ILIKE $${placeholderCount} OR short_content ILIKE $${placeholderCount})`);
        params.push(`%${search}%`);
        placeholderCount++;
      }
      // Removed status filter block
      // if (status) {
      //   conditions.push(`status = $${placeholderCount++}`);
      //   params.push(status);
      // }
      if (authorId) {
        conditions.push(`author_id = $${placeholderCount++}`);
        params.push(authorId);
      }
      // Tag search requires special handling if using array field
      // if (tag && tag.trim()) {
      //   conditions.push(`tags LIKE $${placeholderCount++}`);
      //   params.push(`%${tag.trim()}%`);
      // }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Validate and secure sortBy to prevent SQL injection
      const validSortFields = ['id', 'title', 'published_at', 'updated_at' /* created_at, view_count removed */];
      const sanitizedSortBy = validSortFields.includes(sortBy) ? sortBy : 'published_at';
      
      // Validate sort order
      const sanitizedSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      query += ` ORDER BY ${sanitizedSortBy} ${sanitizedSortOrder}`;
      query += ` LIMIT $${placeholderCount++} OFFSET $${placeholderCount++}`;
      params.push(limit, offset);
      
      const { rows } = await db.query(query, params);
      return rows.map(transformNewsArticle);
    },
    newsArticleCount: async (_, { search, /* status, */ authorId /*, tag */ }, { db }) => { // removed status
      let query = 'SELECT COUNT(*) AS count FROM news';
      const params = [];
      const conditions = [];
      let placeholderCount = 1;

      if (search) {
        conditions.push(`(title ILIKE $${placeholderCount} OR content ILIKE $${placeholderCount} OR short_content ILIKE $${placeholderCount})`);
        params.push(`%${search}%`);
        placeholderCount++;
      }
      // Removed status filter block
      // if (status) {
      //   conditions.push(`status = $${placeholderCount++}`);
      //   params.push(status);
      // }
      if (authorId) {
        conditions.push(`author_id = $${placeholderCount++}`);
        params.push(authorId);
      }
      // Tag search requires special handling if using array field
      // if (tag && tag.trim()) {
      //   conditions.push(`tags LIKE $${placeholderCount++}`);
      //   params.push(`%${tag.trim()}%`);
      // }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      const { rows } = await db.query(query, params);
      return parseInt(rows[0].count, 10);
    },
    // newsCategory and newsCategories resolvers removed
  },

  Mutation: {
    createNewsArticle: async (_, { performingAdminId, input }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create news article');
      
      const { 
        title, content, excerpt, featured_image_url, short_content, 
        image_url, /* status, */ published_at, /* category_id, tags, */ author_id 
      } = input; // Removed status
      
      // const slug = slugify(title); // Slug generation removed
      
      const columns = ['title', 'content']; // Slug removed from columns
      const values = [title, content];
      const placeholders = ['$1', '$2']; // Slug placeholder removed
      let placeholderCount = 3; // Adjusted placeholder count
      
      // Add optional fields if they exist
      if (excerpt !== undefined || short_content !== undefined) {
        columns.push('short_content');
        values.push(excerpt || short_content);
        placeholders.push(`$${placeholderCount++}`);
      }
      
      if (featured_image_url !== undefined || image_url !== undefined) {
        columns.push('image_url');
        values.push(featured_image_url || image_url);
        placeholders.push(`$${placeholderCount++}`);
      }
      
      // Removed status block
      // if (status !== undefined) {
      //   columns.push('status');
      //   values.push(status);
      //   placeholders.push(`$${placeholderCount++}`);
      // }
      
      // Handle published_at (can be null for drafts)
      columns.push('published_at');
      values.push(published_at); // Will be null if not provided or explicitly set to null
      placeholders.push(`$${placeholderCount++}`);
      
      if (author_id !== undefined) {
        columns.push('author_id');
        values.push(author_id);
        placeholders.push(`$${placeholderCount++}`);
      }
      
      const query = `
        INSERT INTO news (${columns.join(', ')}) 
        VALUES (${placeholders.join(', ')}) 
        RETURNING *
      `;
      
      const { rows } = await db.query(query, values);
      return transformNewsArticle(rows[0]);
    },
    updateNewsArticle: async (_, { performingAdminId, id, input }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update news article');
      
      const updates = [];
      const values = [];
      let placeholderCount = 1;
      
      // Check each field and add to updates if it exists
      if (input.title !== undefined) {
        updates.push(`title = $${placeholderCount++}`);
        values.push(input.title);
        
        // Update slug if title changes - REMOVED
        // updates.push(`slug = $${placeholderCount++}`);
        // values.push(slugify(input.title));
      }
      
      if (input.content !== undefined) {
        updates.push(`content = $${placeholderCount++}`);
        values.push(input.content);
      }
      
      if (input.excerpt !== undefined || input.short_content !== undefined) {
        updates.push(`short_content = $${placeholderCount++}`);
        values.push(input.excerpt || input.short_content);
      }
      
      if (input.featured_image_url !== undefined || input.image_url !== undefined) {
        updates.push(`image_url = $${placeholderCount++}`);
        values.push(input.featured_image_url || input.image_url);
      }
      
      // Removed status block
      // if (input.status !== undefined) {
      //   updates.push(`status = $${placeholderCount++}`);
      //   values.push(input.status);
      // }
      
      if (input.published_at !== undefined) { // Can be set to null to unpublish
        updates.push(`published_at = $${placeholderCount++}`);
        values.push(input.published_at);
      }
      
      if (input.author_id !== undefined) {
        updates.push(`author_id = $${placeholderCount++}`);
        values.push(input.author_id);
      }
      
      if (updates.length === 0) {
        throw new GraphQLError('No update fields provided.', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      
      // Add the updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      values.push(id);
      const query = `UPDATE news SET ${updates.join(', ')} WHERE id = $${placeholderCount} RETURNING *`;
      
      const { rows } = await db.query(query, values);
      if (rows.length === 0) {
        throw new GraphQLError('News article not found or no changes made.', { extensions: { code: 'NOT_FOUND' } });
      }
      
      return transformNewsArticle(rows[0]);
    },
    deleteNewsArticle: async (_, { performingAdminId, id }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'delete news article');
      
      const { rowCount } = await db.query('DELETE FROM news WHERE id = $1', [id]);
      if (rowCount === 0) {
        throw new GraphQLError('News article not found.', { extensions: { code: 'NOT_FOUND' } });
      }
      
      return true;
    },
    publishNewsArticle: async (_, { performingAdminId, id }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'publish news article');
      
      const { rows } = await db.query(
        // Removed status = 'PUBLISHED'
        `UPDATE news SET published_at = NOW(), updated_at = NOW() 
         WHERE id = $1 RETURNING *`,
        [id]
      );
      
      if (rows.length === 0) {
        throw new GraphQLError('News article not found.', { extensions: { code: 'NOT_FOUND' } });
      }
      
      return transformNewsArticle(rows[0]);
    },
    unpublishNewsArticle: async (_, { performingAdminId, id }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'unpublish news article');
      
      const { rows } = await db.query(
         // Removed status = 'DRAFT', setting published_at to NULL
        `UPDATE news SET published_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      
      if (rows.length === 0) {
        throw new GraphQLError('News article not found.', { extensions: { code: 'NOT_FOUND' } });
      }
      
      return transformNewsArticle(rows[0]);
    },
    // Removed Category mutations
    toggleNewsArticleBookmark: async (_, { userId, articleId }, { db }) => {
      // This mutation might need its own table if it's a real feature.
      // For now, just return the article if it exists.
      const { rows } = await db.query('SELECT * FROM news WHERE id = $1', [articleId]);
      if (rows.length === 0) throw new GraphQLError('News article not found.', { extensions: { code: 'NOT_FOUND' } });
      return transformNewsArticle(rows[0]);
    },
  },

  // --- Field Resolvers for News ---
  NewsArticle: {
    author: async (newsArticle, _, { db }) => {
      if (!newsArticle.author_id) return null;
      
      // Try to find author in users table
      try {
        const { rows } = await db.query('SELECT id, username FROM users WHERE id = $1', [newsArticle.author_id]);
        if (rows.length > 0) return rows[0];
      } catch (error) {
        console.error('Error fetching user as author:', error);
      }
      
      // Try to find in admins table if not found in users
      try {
        const { rows } = await db.query('SELECT id, username FROM admins WHERE id = $1', [newsArticle.author_id]);
        if (rows.length > 0) return rows[0];
      } catch (error) {
        console.error('Error fetching admin as author:', error);
      }
      
      return null;
    },
    // category resolver removed
    movies: async (newsArticle, _, { db }) => {
      // Try to fetch related movies if news_movies table exists
      try {
        const { rows } = await db.query(
          `SELECT m.* FROM movies m
           JOIN news_movies nm ON m.id = nm.movie_id
           WHERE nm.news_id = $1
           ORDER BY m.release_date DESC, m.title ASC`,
          [newsArticle.id]
        );
        return rows;
      } catch (error) {
        console.error('Error fetching related movies:', error);
        return []; // Return empty array if table doesn't exist
      }
    },
    excerpt: (newsArticle) => newsArticle.short_content,
    featured_image_url: (newsArticle) => newsArticle.image_url,
    // view_count, tags, created_at direct resolvers or mappings removed from here as well.
  },
};

// Helper to transform database news row to GraphQL type
function transformNewsArticle(dbNews) {
  if (!dbNews) return null;
  
  // Tags are removed, so processing logic is no longer needed
  // let tags = dbNews.tags;
  // if (tags) {
  //   if (typeof tags === 'string') {
  //     // Handle comma-separated string
  //     tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  //   } else if (typeof tags === 'string' && tags.startsWith('{') && tags.endsWith('}')) {
  //     // Handle PostgreSQL array format
  //     try {
  //       tags = tags.slice(1, -1).split(',').map(tag => tag.trim());
  //     } catch (e) {
  //       console.error('Error parsing tags array:', e);
  //       tags = [];
  //     }
  //   }
  // } else {
  //   tags = [];
  // }
  
  return {
    ...dbNews,
    // slug: dbNews.slug, // Slug removed from transform
    // tags, // Tags removed from return object
    // Ensure we have a status value (default: DRAFT) - Removed status transformation
    // status: dbNews.status || 'DRAFT',
    // Map field names for frontend
    excerpt: dbNews.short_content,
    featured_image_url: dbNews.image_url,
  };
}

module.exports = { typeDefs, resolvers };
