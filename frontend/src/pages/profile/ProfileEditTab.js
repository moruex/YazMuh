import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
const ProfileEditTab = ({ user, updateUser, handleSubmit }) => {
    const fileInputRef = useRef(null);
    const handleAvatarClick = () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); };
    const handleFileChange = (e) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => updateUser({ avatar: reader.result });
            reader.readAsDataURL(file);
        }
    };
    return (_jsxs("div", { className: "profile-edit", children: [_jsx("h2", { children: "Edit Profile" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "avatar-upload-container", children: [_jsxs("div", { className: "avatar-upload", onClick: handleAvatarClick, children: [_jsx("img", { src: user.avatar, alt: "Avatar" }), _jsxs("div", { className: "upload-overlay", children: [_jsx("svg", { viewBox: "0 0 24 24", children: _jsx("path", { d: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" }) }), _jsx("span", { children: "Change" })] })] }), _jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, accept: "image/*", className: "hidden-file-input" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Nickname" }), _jsx("input", { value: user.nickname, onChange: (e) => updateUser({ nickname: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Gender" }), _jsxs("select", { value: user.gender, onChange: (e) => updateUser({ gender: e.target.value }), children: [_jsx("option", { value: "not-specified", children: "Prefer not to say" }), _jsx("option", { value: "male", children: "Male" }), _jsx("option", { value: "female", children: "Female" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Age" }), _jsx("input", { type: "number", min: "1", max: "120", value: user.age, onChange: (e) => updateUser({ age: Number(e.target.value) }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Bio" }), _jsx("textarea", { placeholder: "Tell us about yourself..." })] })] }), _jsx("button", { type: "submit", className: "save-button", children: "Save Changes" })] })] }));
};
export default ProfileEditTab;
