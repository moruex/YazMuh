// src/pages/AdminsPage.tsx
import React, { useState, useRef } from 'react';
import { Edit, Trash2, Search, Info } from 'lucide-react';
import './Users.css'; // Reuse the same CSS file if styles are similar

import { Button, CircularProgress, Box, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useQuery, useMutation, ApolloError, Reference } from '@apollo/client';
import { AdminRole } from '@interfaces/index';
import { CREATE_ADMIN, DELETE_ADMIN, GET_ADMIN_COUNT, GET_ADMINS, UPDATE_ADMIN } from '@graphql/index';
import { AddEditAdminModal } from './AddEditAminModal';

// Interface matching the GraphQL Admin type from fragments/schema
interface Admin {
  id: string;
  username: string;
  role: AdminRole;
  createdAt?: string | null;
  updatedAt?: string | null;
  user?: {
    id: string;
    username: string;
    email: string;
  } | null;
}

// Interface for form data in modal
interface AdminFormData {
  username: string;
  password?: string;
  role: AdminRole;
  userId?: string;
}

// Role priority order for sorting (highest to lowest)
const ROLE_PRIORITY: Record<AdminRole, number> = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  CONTENT_MODERATOR: 3
};

export const AdminsPage: React.FC = () => {
  // State
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
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

  // --- GraphQL Queries ---
  const { data: adminsData, loading: loadingAdmins, error: adminsError, refetch: refetchAdmins } = useQuery<{ admins: Admin[] }>(
    GET_ADMINS,
    {
      variables: {
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        search: appliedFilter
      },
      fetchPolicy: 'cache-and-network',
      onError: (err) => console.error("Error fetching admins:", err),
    }
  );

  const { data: countData, loading: loadingCount, refetch: refetchCount } = useQuery<{ adminCount: number }>(
    GET_ADMIN_COUNT,
    {
      fetchPolicy: 'cache-and-network',
      onError: (err) => console.error("Error fetching admin count:", err),
    }
  );

  // Sort admins by role priority: SUPER_ADMIN first, then ADMIN, then CONTENT_MODERATOR
  const sortedAdmins = [...(adminsData?.admins || [])].sort((a, b) => {
    return ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
  });

  const totalRows = countData?.adminCount ?? 0;
  const pageCount = Math.ceil(totalRows / pagination.pageSize);
  const isLoading = loadingAdmins || loadingCount;

  // --- GraphQL Mutations ---
  const [createAdminMutation, { loading: isAddingAdmin }] = useMutation(CREATE_ADMIN, {
    onError: (error: ApolloError) => {
      console.error("Error creating admin:", error);
      setMutationError(error.graphQLErrors?.[0]?.message || error.message || "Failed to add admin.");
    },
    onCompleted: () => {
      closeModal();
      refetchAdmins();
      refetchCount();
    }
  });

  const [updateAdminMutation, { loading: isUpdatingAdmin }] = useMutation(UPDATE_ADMIN, {
    onError: (error: ApolloError) => {
      console.error("Error updating admin:", error);
      setMutationError(error.graphQLErrors?.[0]?.message || error.message || "Failed to update admin.");
    },
    onCompleted: () => {
      closeModal();
      refetchAdmins();
    }
  });

  const [deleteAdminMutation, { loading: isDeletingAdmin }] = useMutation(DELETE_ADMIN, {
    onError: (error: ApolloError) => {
      console.error("Error deleting admin:", error);
      alert(`Error deleting admin: ${error.message}`);
    },
    onCompleted: (data) => {
      if (data.deleteAdmin) {
        console.log("Admin deleted successfully");
        refetchAdmins();
        refetchCount();
      } else {
        alert("Admin deletion failed or admin not found.");
      }
    },
    update(cache, { data: { deleteAdmin } }, { variables }) {
      if (deleteAdmin && variables?.id) {
        const adminId = variables.id;
        const normalizedId = cache.identify({ id: adminId, __typename: 'Admin' });
        cache.evict({ id: normalizedId });
        cache.modify({
          fields: {
            admins(existingRefs = [], { readField }) {
              return existingRefs.filter((ref: Reference) => adminId !== readField('id', ref));
            },
            adminCount(existingCount = 0) {
              return Math.max(0, existingCount - 1);
            }
          }
        });
        cache.gc();
        if (selectedAdmin && selectedAdmin.id === adminId) {
          closeModal();
        }
      }
    }
  });

  // --- Modal Handling ---
  const openModal = (mode: 'add' | 'edit' | 'view', admin?: Admin) => {
    setModalMode(mode);
    setSelectedAdmin(admin || null);
    setMutationError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAdmin(null);
    setMutationError(null);
  };

  const handleAddSubmit = async (formData: AdminFormData) => {
    setMutationError(null);
    try {
      const input = {
        username: formData.username,
        password: formData.password!, // Required for create
        role: formData.role,
        userId: formData.userId!     // Required for create
      };
      await createAdminMutation({ variables: { input } });
    } catch (e: unknown) {
      console.error("Caught submission error:", e);
      if (e instanceof Error) {
        setMutationError(`Submission failed: ${e.message}`);
      } else {
        setMutationError("An unknown error occurred during submission.");
      }
    }
  };

  const handleEditSubmit = async (formData: AdminFormData) => {
    if (!selectedAdmin) return;
    setMutationError(null);
    try {
      const originalAdmin = sortedAdmins.find(a => a.id === selectedAdmin.id);
      const finalInput: { username?: string; role?: AdminRole } = {};

      if (formData.username !== originalAdmin?.username) {
        finalInput.username = formData.username;
      }
      if (formData.role !== originalAdmin?.role) {
        finalInput.role = formData.role;
      }

      if (Object.keys(finalInput).length === 0) {
        closeModal(); // Nothing changed
        return;
      }

      await updateAdminMutation({ variables: { id: selectedAdmin.id, input: finalInput } });
    } catch (e: unknown) {
      console.error("Caught submission error:", e);
      if (e instanceof Error) {
        setMutationError(`Submission failed: ${e.message}`);
      } else {
        setMutationError("An unknown error occurred during submission.");
      }
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (window.confirm(`Are you sure you want to delete admin ID ${adminId}? This cannot be undone.`)) {
      try {
        await deleteAdminMutation({ variables: { id: adminId } });
      } catch (e: unknown) {
        console.error("Caught delete error:", e);
        if (e instanceof Error) {
          alert(`Error deleting admin: ${e.message}`);
        } else {
          alert("An unknown error occurred during deletion.");
        }
      }
    }
  };

  // --- Render ---
  const isMutating = isAddingAdmin || isUpdatingAdmin || isDeletingAdmin;

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
              disabled={isLoading || isMutating}
            />
          </div>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            className="btn"
            variant="contained"
            color="primary"
            onClick={() => openModal('add')}
            disabled={isMutating}
            startIcon={<Add />}
          >
            Add Admin
          </Button>
        </div>

        {/* Loading/Error States */}
        {isLoading && !adminsData && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}
        {adminsError && <Alert severity="error">Error loading admins: {adminsError.message}</Alert>}

        {/* Table */}
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Admin Username</th>
                <th>Role</th>
                <th>Linked User</th>
                <th className="mhide">Created At</th>
                <th className='column-center'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && adminsData ? (
                <tr><td colSpan={5} className="users-loading-cell">Updating...</td></tr>
              ) : !isLoading && sortedAdmins.length === 0 ? (
                <tr><td colSpan={5} className="users-no-data">No admins found</td></tr>
              ) : (
                sortedAdmins.map(admin => (
                  <tr key={admin.id}>
                    <td>{admin.username}</td>
                    <td>
                      <span className={`admin-chip ${admin.role.toLowerCase().replace('_', '-')}`}>{admin.role.replace('_', ' ')}</span>
                    </td>
                    <td>{admin.user ? `${admin.user.username} (${admin.user.email})` : <span style={{ color: 'grey' }}>Not Linked</span>}</td>
                    <td className="mhide">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="column-actions">
                      <div className="main-action-buttons">
                        <button
                          onClick={() => openModal('view', admin)}
                          className="main-btn main-btn-icon info"
                          title="View Details"
                          disabled={isMutating}
                        >
                          <Info size={16} />
                        </button>
                        <button
                          onClick={() => openModal('edit', admin)}
                          className="main-btn main-btn-icon rename"
                          title="Edit Admin"
                          disabled={isMutating}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="main-btn main-btn-icon delete"
                          title="Delete Admin"
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
              disabled={isLoading || isMutating}
            >
              {[5, 10, 25, 50].map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="page-navigation">
            <button
              onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex - 1 }))}
              disabled={pagination.pageIndex === 0 || isLoading || isMutating}
            >
              Previous
            </button>
            <span>Page {pagination.pageIndex + 1} of {pageCount}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))}
              disabled={pagination.pageIndex + 1 >= pageCount || isLoading || isMutating}
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal */}
        <AddEditAdminModal
          mode={modalMode}
          open={modalOpen}
          onClose={closeModal}
          onSubmit={modalMode === 'add' ? handleAddSubmit : handleEditSubmit}
          isLoading={isAddingAdmin || isUpdatingAdmin}
          admin={selectedAdmin}
          error={mutationError}
        />
      </div>
    </div>
  );
};