import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Folder, File, Upload, Edit, Trash2, Plus, Search, Download, ArrowUp, Info, Link as LinkIcon, Image as ImageIcon, RefreshCcw } from 'lucide-react';
import * as path from 'path-browserify';

// Import Modals and Utils
import PreviewModal from '@pages/storage/PreviewModal';
import InfoModal from '@pages/storage/InfoModal';
import RenameModal from '@pages/storage/RenameModal';
import CreateFolderModal from '@pages/storage/CreateFolderModal';
import { addNotification, copyToClipboard, copyToClipboardLog } from '@utils/utils';
import DeleteConfirmation from '@components/modals/DeleteConfirmation';
import { FileItem } from './interface';
import {
    listFilesGraphQL,
    createFolderGraphQL,
    deleteItemGraphQL,
    renameItemGraphQL,
    getSignedUrlForDownload,
} from './utils';
import { AuthContext } from '@pages/app/App';
import { AdminRole, ApiAdmin } from '@interfaces/index';
import { IconButton } from '@mui/material';
import UploadFilesModal from './UploadFilesModal';

// --- Helper Functions ---
const formatFileSize = (bytes: number | null): string => {
    if (bytes === null || bytes === undefined) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleString(); } catch (e) { return dateString; }
};

const getFileIcon = (fileName: string, publicUrl: string | null): JSX.Element => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (publicUrl && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension || '')) {
        return <ImageIcon size={18} className="file-icon image-icon" />;
    }

    const iconMap: Record<string, JSX.Element> = {
        document: <File size={18} className="file-icon document-icon" />,
        audio: <File size={18} className="file-icon audio-icon" />,
        video: <File size={18} className="file-icon video-icon" />,
        archive: <File size={18} className="file-icon archive-icon" />
    };

    if (['doc', 'docx', 'txt', 'rtf', 'pdf', 'odt'].includes(extension || '')) return iconMap.document;
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(extension || '')) return iconMap.audio;
    if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(extension || '')) return iconMap.video;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) return iconMap.archive;

    return <File size={18} className="file-icon" />;
};

export const StoragePage: React.FC = () => {
    // --- State ---
    const [items, setItems] = useState<FileItem[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [modalState, setModalState] = useState({
        upload: false,
        rename: false,
        newFolder: false,
        info: false,
        preview: false,
        deleteConfirm: false,
    });
    const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);

    // --- Auth Context ---
    const auth = useContext<{ admin: ApiAdmin | null }>(AuthContext as any);
    const admin = auth?.admin;

    // --- Toggle Modal Helper ---
    const toggleModal = useCallback((modalName: keyof typeof modalState, isOpen: boolean, item?: FileItem) => {
        if (item) setSelectedItem(item);
        setModalState(prev => ({ ...prev, [modalName]: isOpen }));
    }, []);

    // --- API & Data Fetching ---
    const loadFiles = useCallback(async () => {
        if (!admin) return;
        setIsLoading(true);
        try {
            const directoryArg = currentPath === '' ? null : currentPath;
            const files = await listFilesGraphQL(directoryArg);
            setItems(files);
        } catch (error) {
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPath, admin]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    // --- Navigation ---
    const navigateToPath = useCallback((path: string) => setCurrentPath(path), []);

    const navigateUp = useCallback(() => {
        if (!currentPath) return;
        const parentPath = path.dirname(currentPath);
        navigateToPath(parentPath === '.' ? '' : parentPath);
    }, [currentPath, navigateToPath]);

    // --- Actions ---
    const handleCreateFolder = useCallback(async (folderName: string) => {
        if (!folderName.trim()) {
            addNotification('Please enter a folder name.', 'warning');
            return;
        }

        setIsLoading(true);
        const success = await createFolderGraphQL(folderName, currentPath || '');
        if (success) {
            await loadFiles();
            toggleModal('newFolder', false);
        }
        setIsLoading(false);
    }, [currentPath, loadFiles, toggleModal]);

    const handleRenameItem = useCallback(async (newName: string) => {
        if (!selectedItem) return;
        if (!newName?.trim() || newName === selectedItem.name) {
            addNotification('Please enter a different, valid name.', 'warning');
            return;
        }

        setIsLoading(true);
        const oldPath = selectedItem.path;
        let baseDir = path.dirname(oldPath);
        if (baseDir === '.') baseDir = '';

        const finalNewName = selectedItem.isDirectory ?
            (newName.endsWith('/') ? newName : `${newName}/`) :
            (newName.endsWith('/') ? newName.slice(0, -1) : newName);

        const newPath = baseDir ? `${baseDir}/${finalNewName}` : finalNewName;
        const success = await renameItemGraphQL(oldPath, newPath);

        if (success) {
            await loadFiles();
            toggleModal('rename', false);
        }
        setIsLoading(false);
        setSelectedItem(null);
    }, [selectedItem, loadFiles, toggleModal]);

    const handleConfirmDelete = useCallback(async () => {
        if (!itemToDelete) return;

        setIsLoading(true);
        const success = await deleteItemGraphQL(itemToDelete.path);
        if (success) await loadFiles();

        setIsLoading(false);
        toggleModal('deleteConfirm', false);
        setItemToDelete(null);
    }, [itemToDelete, loadFiles, toggleModal]);

    const downloadFile = useCallback(async (item: FileItem) => {
        if (item.isDirectory) return;

        addNotification(`Preparing download for ${item.name}...`, 'info');
        const signedUrl = await getSignedUrlForDownload(item.path, true);
        if (signedUrl) window.open(signedUrl, '_blank');
    }, []);

    const handleCopyUrl = useCallback(async (item: FileItem) => {
        if (item.isDirectory) {
            addNotification("Cannot copy URL for a folder.", "warning");
            return;
        }

        const copyFn = typeof copyToClipboardLog === 'function' ? copyToClipboardLog : copyToClipboard;

        if (item.publicUrl) {
            copyFn(item.publicUrl, "Public link copied!");
        } else {
            addNotification("Getting temporary shareable link...", "info");
            const signedUrl = await getSignedUrlForDownload(item.path);
            if (signedUrl) copyFn(signedUrl, "Temporary link copied!");
        }
    }, []);

    // --- Derived State & Permissions ---
    const filteredItems = useMemo(() => {
        const filtered = items.filter(item =>
            searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
        );

        // Sort folders first, then files
        return filtered.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [items, searchQuery]);

    const breadcrumbs = useMemo(() => {
        const crumbs = [{ name: 'Home', path: '' }];
        if (!currentPath) return crumbs;

        const parts = currentPath.split('/');
        let cumulativePath = '';

        parts.forEach(part => {
            cumulativePath = cumulativePath ? `${cumulativePath}/${part}` : part;
            crumbs.push({ name: part, path: cumulativePath });
        });

        return crumbs;
    }, [currentPath]);

    const isAdmin = admin?.role === AdminRole.ADMIN || admin?.role === AdminRole.SUPER_ADMIN;
    const canUpload = isAdmin;
    const canCreateFolder = isAdmin;
    const canEditDelete = isAdmin;

    // --- Render ---
    if (!admin) {
        return (
            <div className="storage-page">
                <div className='storage-card'>
                    <div className="loading-overlay">
                        <span>Loading User Data...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="storage-page">
            <div className='storage-card'>
                {/* Header */}
                <div className="storage-header">
                    <h1>File Explorer</h1>
                    <div className="user-info">
                        <span>{admin.username}</span>
                        <span className="user-role">{admin.role}</span>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="toolbar">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="storage-action-buttons">
                        {canUpload && (
                            <button className="storage-btn upload-btn" onClick={() => toggleModal('upload', true)}>
                                <Upload size={16} /> Upload
                            </button>
                        )}
                        {canCreateFolder && (
                            <button className="storage-btn new-folder-btn" onClick={() => toggleModal('newFolder', true)}>
                                <Plus size={16} /> New Folder
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="navigation">
                    <div className="breadcrumbs">
                        {breadcrumbs.map((crumb, index, arr) => (
                            <React.Fragment key={crumb.path || 'home'}>
                                {index > 0 && <span className="breadcrumb-separator"> / </span>}
                                <span
                                    className="breadcrumb-item"
                                    onClick={() => navigateToPath(crumb.path ?? '')}
                                    style={{
                                        cursor: 'pointer',
                                        fontWeight: index === arr.length - 1 ? 'bold' : 'normal',
                                        color: index === arr.length - 1 ? 'inherit' : '#007bff'
                                    }}
                                >
                                    {crumb.name}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                    {currentPath && (
                        <button className="btn btn-text btn-back" onClick={navigateUp}>
                            <ArrowUp size={16} /> Up
                        </button>
                    )}
                    <div className='spacer'></div>
                    <IconButton className='refresh-btn' title="Refresh" onClick={loadFiles}>
                        <RefreshCcw size={16} />
                    </IconButton>

                </div>

                {/* Content Table */}
                <div className="storage-content">
                    <table className="storage-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Size</th>
                                <th>Last Modified</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr className="storage-loading-row">
                                    <td colSpan={5}>
                                        <div className="storage-loading-indicator">
                                            <div className="storage-loading-spinner"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="storage-empty-state">
                                        {searchQuery ? 'No items match search.' : 'Folder is empty.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr
                                        key={item.path}
                                        className={item.isDirectory ? 'folder-row' : 'file-row'}
                                        onClick={() => item.isDirectory ?
                                            navigateToPath(item.path.endsWith('/') ? item.path.slice(0, -1) : item.path) :
                                            toggleModal('preview', true, item)
                                        }
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td className="item-name">
                                            <div className='item-name-container'>
                                                {item.isDirectory ?
                                                    <Folder size={18} /> :
                                                    getFileIcon(item.name, item.publicUrl || null)
                                                }
                                                <span>{item.name}</span>
                                            </div>
                                        </td>
                                        <td>{item.isDirectory ? 'Folder' : 'File'}</td>
                                        <td>{item.isDirectory ? '-' : formatFileSize(item.size)}</td>
                                        <td>{formatDate(item.lastModified)}</td>
                                        <td>
                                            <div className='main-action-buttons'>
                                                {!item.isDirectory && (
                                                    <>
                                                        <button
                                                            className="main-btn main-btn-icon download"
                                                            title="Download"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                downloadFile(item);
                                                            }}
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        <button
                                                            className="main-btn main-btn-icon copy"
                                                            title="Copy Link"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyUrl(item);
                                                            }}
                                                        >
                                                            <LinkIcon size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="main-btn main-btn-icon info"
                                                    title="Info"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleModal('info', true, item);
                                                    }}
                                                >
                                                    <Info size={16} />
                                                </button>
                                                {canEditDelete && (
                                                    <>
                                                        <button
                                                            className="main-btn main-btn-icon rename"
                                                            title="Rename"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleModal('rename', true, item);
                                                            }}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="main-btn main-btn-icon delete"
                                                            title="Delete"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setItemToDelete(item);
                                                                toggleModal('deleteConfirm', true);
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modals */}
                {modalState.upload && (
                    <UploadFilesModal
                        isOpen={true}
                        onClose={() => toggleModal('upload', false)}
                        onUploadComplete={loadFiles}
                        currentPath={currentPath}
                    />
                )}
                {modalState.newFolder && (
                    <CreateFolderModal
                        isOpen={true}
                        onClose={() => toggleModal('newFolder', false)}
                        onCreate={handleCreateFolder}
                        currentPath={currentPath || '/'}
                    />
                )}
                {modalState.rename && (
                    <RenameModal
                        isOpen={true}
                        onClose={() => toggleModal('rename', false)}
                        onRename={handleRenameItem}
                        selectedItem={selectedItem}
                    />
                )}
                {modalState.info && (
                    <InfoModal
                        isOpen={true}
                        onClose={() => toggleModal('info', false)}
                        selectedItem={selectedItem}
                    />
                )}
                {modalState.preview && (
                    <PreviewModal
                        isOpen={true}
                        onClose={() => toggleModal('preview', false)}
                        selectedItem={selectedItem}
                        onDownload={downloadFile}
                    />
                )}
                {modalState.deleteConfirm && (
                    <DeleteConfirmation
                        open={true}
                        onClose={() => toggleModal('deleteConfirm', false)}
                        onConfirm={handleConfirmDelete}
                    />
                )}
            </div>
        </div>
    );
};