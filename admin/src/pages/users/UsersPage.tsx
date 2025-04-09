// src/pages/UsersPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Edit, Trash2, Search, Plus } from 'lucide-react';
import './Users.css'; // Keep your existing styles
import { Button, CircularProgress, Box, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useQuery, useMutation, ApolloError } from '@apollo/client';

// Import the actual mutations and queries
import { AddEditUserModal } from './AddEditUserModal';
import {
  GET_USER_COUNT,
  GET_USERS,
  REGISTER_USER,
  ADMIN_UPDATE_USER,
  ADMIN_DELETE_USER
} from '@graphql/index';

// Interface matching the GraphQL User type from fragments/schema
interface User {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Interface for form data in modal
interface UserFormData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password?: string; // Only used for 'add' mode via registerUser
  avatar_url: string;
  bio: string;
}

// Input type for the adminUpdateUser mutation (from backend schema)
interface AdminUserUpdateInput {
  first_name?: string | null;
  last_name?: string | null;
  username?: string;
  email?: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export const UsersPage: React.FC = () => {
  // State (keep pagination, filter, modal states)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Ref for search input to implement "search on Enter"
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle search on Enter key press
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setAppliedFilter(searchTerm);
      setPagination(p => ({ ...p, pageIndex: 0 }));
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 800);
    }
  };

  // --- GraphQL Queries (optimized) ---
  const { data: usersData, loading: loadingUsers, error: usersError, refetch: refetchUsers } = useQuery<{ users: User[] }>(
    GET_USERS,
    {
      variables: {
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        search: appliedFilter
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      onError: (err) => console.error("Error fetching users:", err),
    }
  );

  const { data: countData, loading: loadingCount, refetch: refetchCount } = useQuery<{ userCount: number }>(
    GET_USER_COUNT,
    {
      variables: { search: appliedFilter },
      fetchPolicy: 'cache-and-network',
      onError: (err) => console.error("Error fetching user count:", err),
    }
  );

  const users = usersData?.users || [];
  const totalRows = countData?.userCount ?? 0;
  const pageCount = Math.ceil(totalRows / pagination.pageSize);
  const queryLoading = loadingUsers || loadingCount;

  // --- GraphQL Mutations ---
  const [registerUserMutation, { loading: isAddingUser }] = useMutation(REGISTER_USER, {
    onError: (error: ApolloError) => {
      console.error("Error registering user:", error);
      setMutationError(error.graphQLErrors?.[0]?.message || error.message || "Failed to add user.");
    },
    onCompleted: () => {
      closeModal();
      refetchUsers();
      refetchCount(); // Count changes when adding
    }
  });

  // --- Admin Update User Mutation ---
  const [adminUpdateUserMutation, { loading: isUpdatingUser }] = useMutation(ADMIN_UPDATE_USER, {
    onError: (error: ApolloError) => {
      console.error("Error updating user:", error);
      setMutationError(error.graphQLErrors?.[0]?.message || error.message || "Failed to update user.");
    },
    onCompleted: () => {
      closeModal();
      refetchUsers(); // Refetch to see changes
    }
  });

  // --- Admin Delete User Mutation ---
  const [adminDeleteUserMutation, { loading: isDeletingUser }] = useMutation(ADMIN_DELETE_USER, {
    onError: (error: ApolloError) => {
      console.error("Error deleting user:", error);
      alert(`Error deleting user: ${error.graphQLErrors?.[0]?.message || error.message}`);
    },
    onCompleted: (data) => {
      if (data.adminDeleteUser) {
        console.log(`User deleted successfully`);
      } else {
        alert("User deletion failed. The user might not exist or you lack permissions.");
      }
    },
    // Update cache directly for immediate UI feedback
    update(cache, { data: { adminDeleteUser } }, { variables }) {
      const userId = variables?.id;
      if (adminDeleteUser && userId) {
        const normalizedId = cache.identify({ id: userId, __typename: 'User' });
        // Evict the user from the cache entirely
        cache.evict({ id: normalizedId });
        // Modify the users query result
        cache.modify({
          fields: {
            users(existingUserRefs = [], { readField }) {
              return existingUserRefs.filter(
                userRef => userId !== readField('id', userRef)
              );
            },
            // Decrement count
            userCount(existingCount = 0) {
              return Math.max(0, existingCount - 1);
            }
          }
        });
        // Trigger garbage collection
        cache.gc();
        // Close modal if the deleted user was selected
        if (selectedUser && selectedUser.id === userId) {
          closeModal();
        }
      }
    }
  });

  // --- Modal Handling ---
  const openModal = (mode: 'add' | 'edit' | 'view', user?: User) => {
    setModalMode(mode);
    setSelectedUser(user || null);
    setMutationError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setMutationError(null);
  };

  // --- Submit Handlers ---
  const handleAddSubmit = async (formData: UserFormData) => {
    setMutationError(null);
    if (!formData.password) {
      setMutationError("Password is required for new users.");
      return;
    }
    try {
      const input = {
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        avatar_url: formData.avatar_url || null,
        bio: formData.bio || null,
      };
      await registerUserMutation({ variables: { input } });
    } catch (e) { /* Error handled by onError */ }
  };

  const handleEditSubmit = async (formData: UserFormData) => {
    if (!selectedUser) return;
    setMutationError(null);
    try {
      // Map UserFormData to AdminUserUpdateInput, EXCLUDING password
      const input: AdminUserUpdateInput = {}; // Start with empty object

      // Only include fields that have actually changed
      if (formData.first_name !== (selectedUser.first_name ?? '')) input.first_name = formData.first_name;
      if (formData.last_name !== (selectedUser.last_name ?? '')) input.last_name = formData.last_name;
      if (formData.username !== selectedUser.username) input.username = formData.username;
      if (formData.email !== selectedUser.email) input.email = formData.email;
      if (formData.avatar_url !== (selectedUser.avatar_url ?? '')) input.avatar_url = formData.avatar_url;
      if (formData.bio !== (selectedUser.bio ?? '')) input.bio = formData.bio;

      if (Object.keys(input).length === 0) {
        console.log("No changes detected for update.");
        closeModal(); // Close if nothing changed
        return;
      }

      console.log("Updating user ID:", selectedUser.id, "with input:", input);
      await adminUpdateUserMutation({ variables: { id: selectedUser.id, input } });
    } catch (e) { /* Error handled by onError */ }
  };

  // --- Delete Handler ---
  const handleDeleteUser = async (userId: string) => {
    // Add confirmation dialog
    if (window.confirm(`Are you sure you want to delete user ID: ${userId}? This action cannot be undone.`)) {
      try {
        // Call the actual delete mutation
        await adminDeleteUserMutation({ variables: { id: userId } });
      } catch (e) { /* Error handled by onError */ }
    }
  };

  // --- Render ---
  const isMutating = isAddingUser || isUpdatingUser || isDeletingUser; // Combined mutation loading state

  return (
    <div className="users-page">
      <div className='users-card'>
        {/* Header */}
        <div className="users-page-header">
          <div className="users-search-bar">
            <Search size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search username or email... (press Enter)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              disabled={queryLoading || isMutating}
            />
          </div>
          <Button
            className="btn"
            variant="contained"
            color="primary"
            onClick={() => openModal('add')}
            disabled={isMutating}
            startIcon={<Add />}
          >
            Add User
          </Button>
        </div>

        {/* Loading/Error States */}
        {queryLoading && !usersData && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}
        {usersError && <Alert severity="error" sx={{ mb: 2 }}>Error loading users: {usersError.message}</Alert>}

        {/* Table */}
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th className="avatar mhide"></th>
                <th>Username</th>
                <th className='mhide'>Email</th>
                <th>Full Name</th>
                <th className="mhide">Joined</th>
                <th className='column-center'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queryLoading && usersData ? (
                <tr><td colSpan={6} className="users-loading-cell">Loading...</td></tr>
              ) : !queryLoading && users.length === 0 ? (
                <tr><td colSpan={6} className="users-no-data">No users found {appliedFilter ? `for "${appliedFilter}"` : ''}</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
                    <td className="avatar mhide">
                      {user.avatar_url ? <div><img src={user.avatar_url} alt="avatar" width="40" height="40" onError={(e) => (e.currentTarget.style.display = 'none')} /></div> : '-'}
                    </td>
                    <td>{user.username}</td>
                    <td className='mhide'>{user.email}</td>
                    <td>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}</td>
                    <td className="mhide">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                    <td className="column-actions">
                      <div className="main-action-buttons">
                        <button
                          onClick={() => openModal('edit', user)}
                          className="main-btn main-btn-icon rename"
                          title="Edit User"
                          disabled={isMutating}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="main-btn main-btn-icon delete"
                          title="Delete User"
                          disabled={isMutating}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="users-pagination-controls">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => {
                setPagination({ pageIndex: 0, pageSize: Number(e.target.value) });
              }}
              disabled={queryLoading || isMutating}
            >
              {[5, 10, 25, 50].map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="page-navigation">
            <button
              onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex - 1 }))}
              disabled={pagination.pageIndex === 0 || queryLoading || isMutating}
            >
              Previous
            </button>
            <span> Page {pageCount > 0 ? pagination.pageIndex + 1 : 0} of {pageCount} </span>
            <button
              onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))}
              disabled={pagination.pageIndex + 1 >= pageCount || queryLoading || isMutating}
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal */}
        <AddEditUserModal
          mode={modalMode}
          open={modalOpen}
          onClose={closeModal}
          onSubmit={modalMode === 'add' ? handleAddSubmit : handleEditSubmit}
          isLoading={isAddingUser || isUpdatingUser}
          user={selectedUser}
          error={mutationError}
        />
      </div>
    </div>
  );
};