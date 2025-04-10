import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Trash2,
  Edit,
  Image as ImageIcon,
  SquareLibrary,
  Clapperboard,
} from 'lucide-react';
import type { ApiGenreCore } from '../../interfaces';

interface GenreTableProps {
  genres: ApiGenreCore[] | null;
  loading: boolean;
  error?: Error;
  onEdit: (genre: ApiGenreCore) => void;
  onDelete: (id: string) => void;
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SkeletonRow = ({ columns }: { columns: number }) => (
  <TableRow>
    <TableCell colSpan={columns}>
      <Skeleton animation="wave" height={60} />
    </TableCell>
  </TableRow>
);

export const GenreTable = ({
  genres,
  loading,
  error,
  onEdit,
  onDelete,
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: GenreTableProps) => {
  const columns = 6;

  if (error) {
    return <div className="error-message">Error loading genres: {error.message}</div>;
  }

  return (
    <div className="genre-table-container">
      <TableContainer component={Paper}>
        <Table className="genre-table" stickyHeader aria-label="genres table" size="small">
          <TableHead>
            <TableRow>
              <TableCell className="image-cell"></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell className="collection-cell">Collection</TableCell>
              <TableCell className="actions-cell">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !genres?.length ? (
              Array.from(new Array(rowsPerPage)).map((_, index) => (
                <SkeletonRow key={`skel-${index}`} columns={columns} />
              ))
            ) : !loading && !genres?.length ? (
              <TableRow>
                <TableCell colSpan={columns} align="center">
                  No genres found.
                </TableCell>
              </TableRow>
            ) : (
              genres?.map((genre) => (
                <TableRow hover key={genre.id} className="genre-row">
                  <TableCell className="image-cell">
                    <div className="genre-image-container">
                      {genre.image_url ? (
                        <img
                          src={genre.image_url}
                          alt={genre.name}
                          className="genre-image"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <ImageIcon className="image-placeholder" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {genre.name}
                  </TableCell>
                  <TableCell>
                    <div className="genre-description" title={genre.description ?? ''}>
                      {genre.description ? `${genre.description.substring(0, 100)}${genre.description.length > 100 ? '...' : ''}` : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="collection-cell">
                    <Tooltip title={genre.is_collection ? "Collection" : "Genre"}>
                      <div className="center-it">
                        {genre.is_collection ? (
                          <SquareLibrary className="collection-icon collection" />
                        ) : (
                          <Clapperboard className="collection-icon genre" />
                        )}
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="actions-cell">
                      <div className="main-action-buttons">
                        <button
                          onClick={() => {onEdit(genre);}}
                          className="main-btn main-btn-icon rename"
                          title="Edit Movie"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {onDelete(genre.id);}}
                          className="main-btn main-btn-icon delete"
                          title="Delete Movie"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={count}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        className="main-pagination"
      />
    </div>
  );
};