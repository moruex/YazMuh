// --- START OF FILE UploadFilesModal.tsx ---

import React, { ChangeEvent, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Grid, Card, CardMedia, IconButton, Tooltip, LinearProgress, Alert } from '@mui/material'; // Removed CardActions, AlertTitle
import { Delete as DeleteIcon, FileUpload as FileUploadIcon, InsertDriveFile as InsertDriveFileIcon, Image as ImageIcon, PictureAsPdf as PictureAsPdfIcon, TextSnippet as TextSnippetIcon, Code as CodeIcon, Close, CheckCircle, Error as ErrorIcon, HourglassEmpty } from '@mui/icons-material'; // Added status icons, Hourglass for pending
import '@styles/components/UploadFilesModal.css'; // Ensure this CSS file exists and is linked
import { getPresignedUrlForUpload } from './utils';
import { addNotification } from '@utils/utils';

interface UploadFilesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
    currentPath: string;
}

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface FileWithStatus {
    file: File;
    status: UploadStatus;
    progress: number; // 0-100
    errorMessage?: string;
}

const UploadFilesModal: React.FC<UploadFilesModalProps> = ({ isOpen, onClose, onUploadComplete, currentPath }) => {
    const [filesToUpload, setFilesToUpload] = useState<FileWithStatus[]>([]);
    const [filePreviewUrls, setFilePreviewUrls] = useState<{ [key: number]: string }>({});
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Generate previews
    useEffect(() => {
        const newUrls: { [key: number]: string } = {};
        const urlsToRevoke: string[] = [];

        // Identify URLs to keep or create
        filesToUpload.forEach((item, index) => {
            const existingUrl = filePreviewUrls[index];
            if (item.file.type.startsWith('image/') && !existingUrl) {
                newUrls[index] = URL.createObjectURL(item.file);
            } else if (existingUrl) {
                // Keep existing preview URL if the file is still there at that index
                const fileStillExists = filesToUpload[index]?.file === item.file;
                if (fileStillExists) { // Basic check, might need stronger key if reordering happens
                    newUrls[index] = existingUrl;
                }
                // If file changed at this index, the old URL will be implicitly removed later
            }
        });

        // Identify URLs to revoke (those not present in newUrls)
        Object.entries(filePreviewUrls).forEach(([key, url]) => {
            if (!newUrls[parseInt(key, 10)]) {
                urlsToRevoke.push(url);
            }
        });

        // Revoke old URLs asynchronously
        if (urlsToRevoke.length > 0) {
            setTimeout(() => {
                urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
                // console.log("Revoked:", urlsToRevoke);
            }, 100); // Small delay ensures React has updated state if needed
        }

        setFilePreviewUrls(newUrls);

        // Cleanup function for component unmount
        return () => {
            Object.values(filePreviewUrls).forEach(URL.revokeObjectURL);
            // console.log("Revoked all on unmount");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filesToUpload]); // Re-run when filesToUpload changes

    const addFiles = useCallback((newFiles: File[]) => {
        setFilesToUpload(prev => {
            const existingNames = new Set(prev.map(item => item.file.name));
            const filesToAdd = newFiles
                .filter(f => !existingNames.has(f.name))
                .map(file => ({ file, status: 'pending', progress: 0 } as FileWithStatus));
            if (filesToAdd.length < newFiles.length) {
                addNotification(`Skipped ${newFiles.length - filesToAdd.length} file(s) already in the list.`, 'info');
            }
            return [...prev, ...filesToAdd];
        });
    }, []);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            addFiles(Array.from(e.target.files));
            e.target.value = '';
        }
    };

    const handleDeleteFile = (index: number) => {
        const fileKey = index;
        setFilesToUpload(prev => prev.filter((_, i) => i !== index));

        if (filePreviewUrls[fileKey]) {
            const urlToRevoke = filePreviewUrls[fileKey];
            // Revoke immediately
            URL.revokeObjectURL(urlToRevoke);
            // console.log("Revoked single:", urlToRevoke);

            setFilePreviewUrls(prev => {
                const newUrls = { ...prev };
                delete newUrls[fileKey];
                return newUrls;
            });
        }
        // Shift keys for previews if necessary (or use a stable key like file name + size)
        // Simpler: Keep index as key, but acknowledge potential mismatch if items are deleted mid-preview generation
    };

    const uploadSingleFile = async (item: FileWithStatus, index: number): Promise<boolean> => {
        setFilesToUpload(prev => prev.map((f, i) => i === index ? { ...f, status: 'uploading', progress: 0, errorMessage: undefined } : f)); // Reset error on retry

        try {
            const presignedData = await getPresignedUrlForUpload(
                item.file.name,
                item.file.type || 'application/octet-stream',
                currentPath
            );

            if (!presignedData?.url) {
                throw new Error("Server failed to provide an upload URL.");
            }

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', presignedData.url);
                xhr.setRequestHeader('Content-Type', item.file.type || 'application/octet-stream');
                // Add other headers R2 might require based on your CORS policy if '*' isn't used for AllowedHeaders
                // e.g., xhr.setRequestHeader('x-amz-acl', 'public-read'); // If applicable

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setFilesToUpload(prev => prev.map((f, i) => i === index ? { ...f, progress: percentComplete } : f));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setFilesToUpload(prev => prev.map((f, i) => i === index ? { ...f, status: 'success', progress: 100 } : f));
                        resolve();
                    } else {
                        // Attempt to parse error response from R2 if available
                        let errorDetail = `Upload failed. Status: ${xhr.status}`;
                        try {
                            // R2 often sends XML errors
                            if (xhr.responseText && xhr.responseText.includes('<Error>')) {
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(xhr.responseText, "text/xml");
                                const message = xmlDoc.getElementsByTagName("Message")[0]?.textContent;
                                if (message) errorDetail += `: ${message}`;
                            } else if (xhr.statusText) {
                                errorDetail += ` - ${xhr.statusText}`;
                            }
                        } catch (parseError) {
                            console.error("Could not parse R2 error response:", parseError);
                        }
                        console.error("Upload Error Response:", xhr.responseText); // Log the full response
                        reject(new Error(errorDetail));
                    }
                };

                xhr.onerror = (err) => {
                    // This often catches network errors (like CORS preflight failures)
                    console.error('XHR onerror:', err, xhr.status, xhr.statusText);
                    // Check for CORS specifically if status is 0
                    const networkErrorMsg = xhr.status === 0
                        ? 'Network error (Check CORS configuration in R2 & browser console)'
                        : 'Network error during upload.';
                    reject(new Error(networkErrorMsg));
                };

                xhr.onabort = () => {
                    reject(new Error('Upload aborted.'));
                };

                xhr.send(item.file);
            });
            return true; // Indicate success for this file

        } catch (error: any) {
            console.error(`Error uploading ${item.file.name}:`, error);
            setFilesToUpload(prev => prev.map((f, i) => i === index ? { ...f, status: 'error', errorMessage: error.message, progress: 0 } : f));
            return false; // Indicate failure for this file
        }
    };

    const handleUpload = async () => {
        setIsUploading(true);
        const filesToProcess = filesToUpload.filter(f => f.status === 'pending' || f.status === 'error'); // Include errors for retry

        // Could use Promise.all for parallel uploads, but sequential is simpler for now
        for (let i = 0; i < filesToProcess.length; i++) {
            const currentItem = filesToProcess[i];
            // Find the original index in the main filesToUpload array
            const originalIndex = filesToUpload.findIndex(f => f === currentItem);
            if (originalIndex !== -1) {
                const success = await uploadSingleFile(currentItem, originalIndex);
                if (!success) {
                    // Optional: Stop on first error?
                    // break;
                }
            }
        }

        setIsUploading(false);

        const successfulUploads = filesToUpload.filter(f => f.status === 'success').length;
        const failedUploads = filesToUpload.filter(f => f.status === 'error').length;

        if (failedUploads > 0) {
            addNotification(`Upload finished: ${successfulUploads} succeeded, ${failedUploads} failed.`, 'warning');
        } else if (successfulUploads > 0) {
            addNotification(`Successfully uploaded ${successfulUploads} file(s).`, 'success');
        } else {
            addNotification('All files were uploaded. Maybe...', 'success');
        }

        // Refresh the file list in StoragePage if at least one upload was successful
        //  if (filesToUpload.some(f => f.status === 'success')) {
        onUploadComplete();
        //  }
        // Decide whether to close automatically or not
        // if (allSuccessful && filesToUpload.length > 0) {
        //     handleClose(true); // Close automatically on full success
        // }
    };

    const cleanup = useCallback(() => {
        // Revoke any remaining URLs on close
        Object.values(filePreviewUrls).forEach(URL.revokeObjectURL);
        setFilesToUpload([]);
        setFilePreviewUrls({});
        setIsUploading(false);
        setIsDragging(false);
    }, [filePreviewUrls]);

    const handleClose = (forceClose = false) => {
        if (isUploading && !forceClose) {
            addNotification('Upload in progress. Please wait.', 'warning');
            return;
        }
        cleanup();
        onClose();
    };

    // Drag and Drop Handlers (keep as they are)
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (isUploading) return; setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (isUploading) return; setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (isUploading) return; if (!isDragging) setIsDragging(true); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (isUploading) return; setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { addFiles(Array.from(e.dataTransfer.files)); } };

    // Helper Functions (keep as they are)
    const formatFileSize = (bytes: number) => { if (bytes === 0) return '0 Bytes'; const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; };
    const getFileIcon = (file: File) => { const ext = file.name.split('.').pop()?.toLowerCase() || ''; const iconMap: { [key: string]: JSX.Element } = { image: <ImageIcon className="file-icon file-icon-image" />, pdf: <PictureAsPdfIcon className="file-icon file-icon-pdf" />, doc: <TextSnippetIcon className="file-icon file-icon-document" />, code: <CodeIcon className="file-icon file-icon-code" />, default: <InsertDriveFileIcon className="file-icon file-icon-default" /> }; if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return iconMap.image; if (ext === 'pdf') return iconMap.pdf; if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return iconMap.doc; if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'java', 'py', 'c', 'cpp'].includes(ext)) return iconMap.code; return iconMap.default; };

    // Determine button states
    const hasPendingOrErrorFiles = filesToUpload.some(f => f.status === 'pending' || f.status === 'error');
    const pendingAndErrorCount = filesToUpload.filter(f => f.status === 'pending' || f.status === 'error').length;
    const canUpload = filesToUpload.length > 0 && !isUploading && hasPendingOrErrorFiles;

    return (
        <Dialog open={isOpen} onClose={() => handleClose()} maxWidth="lg" fullWidth> {/* Increased maxWidth */}
            <DialogTitle className='dialog-title1'>
                Upload Files
                <IconButton onClick={() => handleClose()} disabled={isUploading}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent className='dialog-content1' dividers // Add dividers for better separation
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <Box mb={2} p={1} sx={{ border: '1px dashed grey', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="subtitle1">Target folder: <b>{currentPath || '/'}</b></Typography>
                </Box>

                <div
                    className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${filesToUpload.length > 0 ? 'mini-dropzone' : ''}`}
                >
                    <label className="dropzone-label">
                        <input type="file" hidden multiple onChange={handleFileChange} disabled={isUploading} />
                        <FileUploadIcon className={`upload-icon ${isDragging ? 'upload-icon-active' : ''}`} />
                        <Typography color={isDragging ? 'primary' : 'textSecondary'} align="center">
                            {isDragging
                                ? 'Drop files here'
                                : filesToUpload.length > 0
                                    ? 'Add more files (click or drag)'
                                    : 'Drag files here or click to select'}
                        </Typography>
                    </label>
                </div>

                {filesToUpload.length > 0 && (
                    <Box mt={3}> {/* Increased margin */}
                        <Typography variant="h6" gutterBottom>Files to Upload ({filesToUpload.length})</Typography> {/* Use h6 for better hierarchy */}
                        <Grid container spacing={2}>
                            {filesToUpload.map((item, index) => (
                                <Grid item xs={12} sm={6} md={4} key={`${item.file.name}-${index}`}> {/* Use name + index as key */}
                                    <Card className={`file-card status-${item.status}`} variant="outlined"> {/* Add outline */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                                            {filePreviewUrls[index] ? (
                                                <CardMedia component="img" image={filePreviewUrls[index]} alt={item.file.name} className="file-preview-small" />
                                            ) : (
                                                <Box className="file-icon-container-small">{getFileIcon(item.file)}</Box>
                                            )}
                                            <Box sx={{ flexGrow: 1, ml: 1.5, overflow: 'hidden' }}> {/* Ensure content doesn't overflow card */}
                                                <Tooltip title={item.file.name}>
                                                    <Typography variant="body2" component="div" className="file-name" noWrap> {/* Add noWrap */}
                                                        {item.file.name}
                                                    </Typography>
                                                </Tooltip>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {formatFileSize(item.file.size)}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteFile(index)}
                                                color="error"
                                                aria-label="delete file"
                                                disabled={isUploading && (item.status === 'uploading' || item.status === 'success')}
                                                className="delete-button"
                                                sx={{ ml: 1 }} // Add margin
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        {/* Progress and Status Area */}
                                        <Box sx={{ p: 1, pt: 0 }}>
                                            {item.status === 'pending' && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                                    <HourglassEmpty fontSize="small" sx={{ mr: 0.5 }} />
                                                    <Typography variant="caption">Pending</Typography>
                                                </Box>
                                            )}
                                            {item.status === 'uploading' && (
                                                <>
                                                    <LinearProgress variant="determinate" value={item.progress} sx={{ mb: 0.5 }} />
                                                    <Typography variant="caption" color="primary">{`Uploading... ${item.progress}%`}</Typography>
                                                </>
                                            )}
                                            {item.status === 'success' && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                                                    <CheckCircle fontSize="small" sx={{ mr: 0.5 }} />
                                                    <Typography variant="caption">Success</Typography>
                                                </Box>
                                            )}
                                            {item.status === 'error' && (
                                                <Tooltip title={item.errorMessage || 'An unknown error occurred'} placement="bottom-start">
                                                    <Alert severity="error" icon={<ErrorIcon fontSize="inherit" />} sx={{ p: 0.5, '& .MuiAlert-message': { p: 0, overflow: 'hidden' } }}>
                                                        <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            Error: {item.errorMessage?.split(': ')[0]} {/* Show first part of error */}
                                                        </Typography>
                                                    </Alert>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions className='dialog-actions1'>
                <Button onClick={() => handleClose()} disabled={isUploading}>
                    {filesToUpload.some(f => f.status === 'success') ? 'Done' : 'Cancel'}
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    color="primary"
                    disabled={!canUpload}
                    startIcon={<FileUploadIcon />}
                >
                    {isUploading ? 'Uploading...' : `Upload ${hasPendingOrErrorFiles ? `(${pendingAndErrorCount})` : ''}`}
                    {hasPendingOrErrorFiles && !isUploading && ' File(s)'} {/* Be more explicit */}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UploadFilesModal;