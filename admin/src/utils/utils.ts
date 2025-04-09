import { toast } from 'react-toastify';

// Toast notification utility
export const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    toast[type](message, { autoClose: 3000 });
};

// Copy URL to clipboard
export const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
        .then(() => {
            addNotification("Copied to clipboard", 'success');
        })
        .catch(err => {
            addNotification('Failed to copy: ' + err.message, 'error');
            console.error('Failed to copy: ', err);
        });
};

// Copy URL to clipboard
export const copyToClipboardLog = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
        .then(() => {
            addNotification(message, 'success');
        })
        .catch(err => {
            addNotification('Failed to copy: ' + err.message, 'error');
            console.error('Failed to copy: ', err);
        });
};