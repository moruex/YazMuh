import { gql } from '@apollo/client';
import client from '@src/config/apolloClient';

// Minimal Movie type for roles
export interface MovieForRole {
    id: string;
    title: string;
    slug: string | null; // Make slug nullable to match backend
    poster_url: string | null;
    release_date: string | null;
    movieq_rating: number | null;
}

// Represents a movie role for a person (either actor or director, etc.)
export interface PersonMovieRole {
    movie: MovieForRole;
    character_name?: string | null; // For actor roles
    job?: string | null;             // For crew roles (e.g., Director)
    department?: string | null;      // For crew roles
}

export interface PersonDetailData {
    id: string;
    name: string;
    slug: string;
    biography: string | null;
    birthday: string | null; // Date string
    profile_image_url: string | null;
    // Combined list of known for (both actor and director roles)
    known_for_roles: PersonMovieRole[]; 
}

// Basic person info query without potentially problematic roles
const GET_PERSON_BASIC = gql`
  query GetPersonBasic($id: ID, $slug: String) {
    person(id: $id, slug: $slug) {
      id
      name
      slug
      biography
      birthday
      profile_image_url
    }
  }
`;

// New queries for actor and director roles
const GET_PERSON_ACTOR_ROLES = gql`
  query GetPersonActorRoles($personId: ID!, $limit: Int, $offset: Int) {
    person(id: $personId) {
      actor_roles(limit: $limit, offset: $offset) {
        movie {
          id
          title
          slug
          poster_url
          release_date
          movieq_rating
        }
        character_name
      }
    }
  }
`;

const GET_PERSON_DIRECTOR_ROLES = gql`
  query GetPersonDirectorRoles($personId: ID!, $limit: Int, $offset: Int) {
    person(id: $personId) {
      director_roles(limit: $limit, offset: $offset) {
        movie {
          id
          title
          slug
          poster_url
          release_date
          movieq_rating
        }
        job
        department
      }
    }
  }
`;

// Separate query that would only be used if the backend is fixed
// const GET_PERSON_WITH_ROLES = gql`
//   query GetPersonWithRoles($id: ID!) {
//     person(id: $id) {
//       actor_roles(limit: 20) {
//         movie {
//           id
//           title
//           slug
//           poster_url
//           release_date
//           movieq_rating
//         }
//         character_name
//       }
//       director_roles(limit: 10) {
//         movie {
//           id
//           title
//           slug
//           poster_url
//           release_date
//           movieq_rating
//         }
//         job
//         department
//       }
//     }
//   }
// `;

const getPersonDetails = async (identifier: { id?: string; slug?: string }): Promise<PersonDetailData | null> => {
  if (!identifier.id && !identifier.slug) {
    console.error("Error fetching person details: ID or slug is required.");
    return null;
  }

  try {
    console.log(`Fetching person details for: ${JSON.stringify(identifier)}`);
    
    // Make sure we're passing only one identifier to avoid GraphQL validation errors
    const variables = identifier.id ? { id: identifier.id } : { slug: identifier.slug };
    
    // First query for basic person data which is unlikely to fail
    const { data } = await client.query({
      query: GET_PERSON_BASIC,
      variables: variables,
      fetchPolicy: 'network-only',
    });

    if (!data || !data.person) {
      console.warn(`Person not found for ${JSON.stringify(identifier)}`);
      return null;
    }

    const person = data.person;
    console.log("Successfully fetched basic person details:", person.name);
    
    // Create a complete person object with empty roles array
    // This ensures we at least show the person's basic info even if roles fail
    const personData: PersonDetailData = {
      ...person,
      known_for_roles: []
    };
    
    return personData;

  } catch (error) {
    console.error(`Error in getPersonDetails service for ${JSON.stringify(identifier)}:`, error);
    throw error;
  }
};

// New method to fetch person's actor roles
const getPersonActorRoles = async (personId: string, limit: number = 5, offset: number = 0): Promise<PersonMovieRole[]> => {
  try {
    console.log(`Fetching actor roles for person ID: ${personId}, limit: ${limit}, offset: ${offset}`);
    
    const { data } = await client.query({
      query: GET_PERSON_ACTOR_ROLES,
      variables: { personId, limit, offset },
      fetchPolicy: 'network-only',
    });

    if (!data || !data.person || !data.person.actor_roles) {
      console.warn(`No actor roles found for person ID: ${personId}`);
      return [];
    }

    return data.person.actor_roles;
  } catch (error) {
    console.error(`Error fetching actor roles for person ID: ${personId}:`, error);
    return [];
  }
};

// New method to fetch person's director roles
const getPersonDirectorRoles = async (personId: string, limit: number = 5, offset: number = 0): Promise<PersonMovieRole[]> => {
  try {
    console.log(`Fetching director roles for person ID: ${personId}, limit: ${limit}, offset: ${offset}`);
    
    const { data } = await client.query({
      query: GET_PERSON_DIRECTOR_ROLES,
      variables: { personId, limit, offset },
      fetchPolicy: 'network-only',
    });

    if (!data || !data.person || !data.person.director_roles) {
      console.warn(`No director roles found for person ID: ${personId}`);
      return [];
    }

    return data.person.director_roles;
  } catch (error) {
    console.error(`Error fetching director roles for person ID: ${personId}:`, error);
    return [];
  }
};

export const personService = {
  getPersonDetails,
  getPersonActorRoles,
  getPersonDirectorRoles
}; 