import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const AccountSettingsTab = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setPasswordError('');
        if (currentPassword !== 'password123') {
            setPasswordError('Current password is incorrect');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters long');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        alert('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };
    return (_jsxs("div", { className: "account-settings", children: [_jsx("h2", { children: "Account Settings" }), _jsxs("div", { className: "settings-section", children: [_jsxs("h3", { children: [_jsx("svg", { viewBox: "0 0 24 24", width: "20", height: "20", children: _jsx("path", { d: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11V11.99z" }) }), "Change Password"] }), _jsxs("form", { onSubmit: handlePasswordSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "current-password", children: "Current Password" }), _jsx("input", { type: "password", id: "current-password", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "new-password", children: "New Password" }), _jsx("input", { type: "password", id: "new-password", value: newPassword, onChange: (e) => setNewPassword(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "confirm-password", children: "Confirm New Password" }), _jsx("input", { type: "password", id: "confirm-password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) }), passwordError && (_jsxs("p", { className: "error-message", children: [_jsx("svg", { viewBox: "0 0 24 24", width: "14", height: "14", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" }) }), passwordError] }))] }), _jsxs("button", { type: "submit", className: "save-button", children: [_jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", children: _jsx("path", { d: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" }) }), "Update Password"] })] })] }), _jsxs("div", { className: "settings-section danger-zone", children: [_jsx("h3", { children: "Danger Zone" }), _jsx("p", { children: "These actions are irreversible. Please proceed with caution." }), _jsxs("button", { className: "danger-button", children: [_jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", children: _jsx("path", { d: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" }) }), "Delete Account"] })] }), _jsx("p", {})] }));
};
export default AccountSettingsTab;
