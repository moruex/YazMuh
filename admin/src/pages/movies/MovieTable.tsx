// MovieTable.tsx
import React, { useCallback, memo } from "react";
import { Movie } from "@interfaces/movie.interfaces";
import { Edit, Info, Trash2 } from "lucide-react";
import { CircularProgress, Typography, TablePagination } from "@mui/material";

interface MovieTableProps {
  movies: Movie[];
  onEdit: (movie: Movie) => void;
  onView: (movie: Movie) => void;
  onDelete: (id: string) => void;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  isLoading?: boolean;
  isDetailLoading?: boolean;
}

// Optimized movie row component with improved event handlers
const MovieRow = memo(({ 
  movie, 
  onView, 
  onEdit, 
  onDelete, 
  isLoading, 
  isDetailLoading 
}: { 
  movie: Movie, 
  onView: (movie: Movie) => void, 
  onEdit: (movie: Movie) => void, 
  onDelete: (id: string) => void,
  isLoading?: boolean,
  isDetailLoading?: boolean
}) => {
  // Create stable event handlers to prevent unnecessary re-renders
  const handleView = useCallback(() => onView(movie), [onView, movie]);
  const handleEdit = useCallback(() => onEdit(movie), [onEdit, movie]);
  const handleDelete = useCallback(() => onDelete(movie.id), [onDelete, movie.id]);
  
  // Format date once
  const formattedDate = movie.releaseDate 
    ? new Date(movie.releaseDate + 'T00:00:00').toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) 
    : '-';
  
  // Disabled state
  const isDisabled = isLoading || isDetailLoading;

  return (
    <tr>
      <td className="td-image">
        <img
          src={movie.imageUrl || '/placeholder.png'}
          alt={movie.title}
          className="main-image"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
          loading="lazy"
        />
      </td>
      <td>{movie.title}</td>
      <td>
        <div className="genre-chips">
          {movie.genres.slice(0, 2).map((genre) => (
            <span key={genre} className="genre-chip">{genre}</span>
          ))}
          {movie.genres.length > 2 && (
            <span className="genre-chip">+{movie.genres.length - 2}</span>
          )}
          {movie.genres.length === 0 && (
            <Typography variant="caption" color="text.secondary">N/A</Typography>
          )}
        </div>
      </td>
      <td>
        <div className="movie-rating column-center">
          {movie.rating != null ? movie.rating.toFixed(1) : '-'}
        </div>
      </td>
      <td className="column-rd">{formattedDate}</td>
      <td className="column-actions">
        <div className="main-action-buttons">
          <button 
            onClick={handleView} 
            className="main-btn main-btn-icon info" 
            title="View Details" 
            disabled={isDisabled}
          >
            <Info size={16} />
          </button>
          <button 
            onClick={handleEdit} 
            className="main-btn main-btn-icon rename" 
            title="Edit Movie" 
            disabled={isDisabled}
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={handleDelete} 
            className="main-btn main-btn-icon delete" 
            title="Delete Movie" 
            disabled={isDisabled}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for MovieRow to prevent unnecessary re-renders
  return (
    prevProps.movie.id === nextProps.movie.id &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isDetailLoading === nextProps.isDetailLoading
  );
});

// Main movie table component
export const MovieTable = memo(({
  movies,
  onEdit,
  onView,
  onDelete,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  isLoading,
  isDetailLoading
}: MovieTableProps) => {
  const isEmpty = !isLoading && movies.length === 0 && totalCount === 0;

  const handleChangePage = useCallback((event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    onPageChange(newPage);
  }, [onPageChange]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0); // Reset to first page when rows per page changes
  }, [onRowsPerPageChange, onPageChange]);

  return (
    <div className="movie-table-container">
      <table className="main-table">
        <thead>
          <tr>
            <th></th>
            <th>Title</th>
            <th>Genres</th>
            <th className="column-center">Rating</th>
            <th className="column-rd">Release Date</th>
            <th className="column-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && movies.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                <CircularProgress size={30} />
                <Typography variant="body2" sx={{ mt: 1 }}>Loading Movies...</Typography>
              </td>
            </tr>
          )}
          {isEmpty && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                <Typography variant="h6" color="text.secondary">No movies found.</Typography>
                <Typography variant="body2" color="text.secondary">Try adjusting your search or filters.</Typography>
              </td>
            </tr>
          )}
          {!isLoading && movies.length > 0 && movies.map((movie) => (
            <MovieRow 
              key={movie.id} 
              movie={movie} 
              onView={onView} 
              onEdit={onEdit} 
              onDelete={onDelete}
              isLoading={isLoading}
              isDetailLoading={isDetailLoading}
            />
          ))}
        </tbody>
      </table>

      {!isEmpty && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          className="main-pagination"  
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  if (prevProps.isLoading !== nextProps.isLoading || 
      prevProps.isDetailLoading !== nextProps.isDetailLoading ||
      prevProps.page !== nextProps.page ||
      prevProps.rowsPerPage !== nextProps.rowsPerPage ||
      prevProps.totalCount !== nextProps.totalCount ||
      prevProps.movies.length !== nextProps.movies.length) {
    return false;
  }
  
  // Check if movie IDs are the same (avoid deep comparison)
  if (prevProps.movies.length > 0) {
    return prevProps.movies.every((movie, index) => 
      movie.id === nextProps.movies[index]?.id
    );
  }
  
  return true;
});