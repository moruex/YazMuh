import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ProfileTabs = ({ activeTab, setActiveTab }) => {
    return (_jsxs("div", { className: "profile-tabs", children: [_jsx("button", { className: activeTab === 'profile' ? 'active' : '', onClick: () => setActiveTab('profile'), children: "Edit Profile" }), _jsx("button", { className: activeTab === 'lists' ? 'active' : '', onClick: () => setActiveTab('lists'), children: "My Lists" }), _jsx("button", { className: activeTab === 'settings' ? 'active' : '', onClick: () => setActiveTab('settings'), children: "Account Settings" })] }));
};
export default ProfileTabs;
