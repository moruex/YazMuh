// src/graphql/mutations/auth.mutations.ts
import { gql } from '@apollo/client';
import { USER_FIELDS, ADMIN_FIELDS } from '../fragments';

/** Standard user login mutation. */
export const LOGIN_USER = gql`
  ${USER_FIELDS} # Include user details on success
  mutation LoginUser($input: LoginInput!) {
    # Assumes mutation name is 'login' and input type is 'LoginInput!'
    login(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
`;

/** Admin user login mutation. */
export const ADMIN_LOGIN = gql`
    ${ADMIN_FIELDS} # Include admin details on success
    mutation AdminLogin($input: AdminLoginInput!) {
        adminLogin(input: $input) {
            # token // REMOVED: No JWT
            admin {
                ...AdminFields
            }
            success
            message
        }
    }
`;

/** Admin user registration mutation. */
export const ADMIN_REGISTER = gql`
    ${ADMIN_FIELDS} # Include admin details on success
    mutation AdminRegister($input: AdminRegisterInput!) {
        adminRegister(input: $input) {
            # token // REMOVED: No JWT
            admin {
                ...AdminFields
            }
            success
            message
        }
    }
`;

/** Standard user forgot password mutation. */
export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    # Assumes mutation name is 'forgotPassword' and input type is 'ForgotPasswordInput!'
    forgotPassword(input: $input) {
      success
      message
    }
  }
`;

/** Admin logout mutation (invalidates current session on server). */
export const ADMIN_LOGOUT = gql`
    mutation AdminLogout {
        # Assumes mutation name is 'adminLogout' and returns Boolean!
        # This might need to be adapted if the backend logout changes due to no JWTs
        adminLogout
    }
`;

/** Admin logout specific session mutation (using JWT ID) - LIKELY OBSOLETE WITHOUT JWTs. */
// export const ADMIN_LOGOUT_SESSION = gql`
//     mutation AdminLogoutSession($jti: String!) { # Takes JTI (JWT ID) as input
//         # Assumes mutation name is 'adminLogoutSession' and returns Boolean!
//         adminLogoutSession(jti: $jti)
//     }
// `;