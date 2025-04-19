import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import ProfileHeader from '@components/profile/ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileEditForm from './ProfileEditTab';
import MovieLists from '@components/profile/MovieLists';
import AccountSettings from './AccountSettings';
import "./ProfilePage.css";
const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState({
        id: '1',
        username: 'moviebuff42',
        nickname: 'Movie Enthusiast',
        avatar: 'https://th.bing.com/th/id/R.bdc8298f170c3a267ee4e1c8501f9f4c?rik=XUHM1S%2bfCiMzkw&pid=ImgRaw&r=0',
        gender: 'not-specified',
        age: 30,
        watchedMovies: [],
        favoriteMovies: [],
        watchlist: []
    });
    const sampleMovies = [
        {
            id: 1,
            title: 'Spider-Man: No Way Home',
            posterUrl: 'https://th.bing.com/th/id/R.bdc8298f170c3a267ee4e1c8501f9f4c?rik=XUHM1S%2bfCiMzkw&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Jon Watts',
            rating: 8.3,
            genres: ['Action', 'Adventure', 'Fantasy']
        },
        {
            id: 2,
            title: 'Dune',
            posterUrl: 'https://th.bing.com/th/id/R.e6f1bea1601ae97dd31e4bfd8d01dc3d?rik=hddNx%2bk19W1%2fQQ&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Denis Villeneuve',
            rating: 8.1,
            genres: ['Adventure', 'Drama', 'Sci-Fi']
        },
        {
            id: 3,
            title: 'Spider-Man: No Way Home',
            posterUrl: 'https://th.bing.com/th/id/R.bdc8298f170c3a267ee4e1c8501f9f4c?rik=XUHM1S%2bfCiMzkw&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Jon Watts',
            rating: 8.3,
            genres: ['Action', 'Adventure', 'Fantasy']
        },
        {
            id: 4,
            title: 'Dune',
            posterUrl: 'https://th.bing.com/th/id/R.e6f1bea1601ae97dd31e4bfd8d01dc3d?rik=hddNx%2bk19W1%2fQQ&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Denis Villeneuve',
            rating: 8.1,
            genres: ['Adventure', 'Drama', 'Sci-Fi']
        },
        {
            id: 5,
            title: 'Spider-Man: No Way Home',
            posterUrl: 'https://th.bing.com/th/id/R.bdc8298f170c3a267ee4e1c8501f9f4c?rik=XUHM1S%2bfCiMzkw&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Jon Watts',
            rating: 8.3,
            genres: ['Action', 'Adventure', 'Fantasy']
        },
        {
            id: 6,
            title: 'Dune',
            posterUrl: 'https://th.bing.com/th/id/R.e6f1bea1601ae97dd31e4bfd8d01dc3d?rik=hddNx%2bk19W1%2fQQ&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Denis Villeneuve',
            rating: 8.1,
            genres: ['Adventure', 'Drama', 'Sci-Fi']
        },
        {
            id: 7,
            title: 'Spider-Man: No Way Home',
            posterUrl: 'https://th.bing.com/th/id/R.bdc8298f170c3a267ee4e1c8501f9f4c?rik=XUHM1S%2bfCiMzkw&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Jon Watts',
            rating: 8.3,
            genres: ['Action', 'Adventure', 'Fantasy']
        },
        {
            id: 8,
            title: 'Dune',
            posterUrl: 'https://th.bing.com/th/id/R.e6f1bea1601ae97dd31e4bfd8d01dc3d?rik=hddNx%2bk19W1%2fQQ&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Denis Villeneuve',
            rating: 8.1,
            genres: ['Adventure', 'Drama', 'Sci-Fi']
        },
        {
            id: 9,
            title: 'Spider-Man: No Way Home',
            posterUrl: 'https://th.bing.com/th/id/R.bdc8298f170c3a267ee4e1c8501f9f4c?rik=XUHM1S%2bfCiMzkw&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Jon Watts',
            rating: 8.3,
            genres: ['Action', 'Adventure', 'Fantasy']
        },
        {
            id: 10,
            title: 'Dune',
            posterUrl: 'https://th.bing.com/th/id/R.e6f1bea1601ae97dd31e4bfd8d01dc3d?rik=hddNx%2bk19W1%2fQQ&pid=ImgRaw&r=0',
            year: 2021,
            director: 'Denis Villeneuve',
            rating: 8.1,
            genres: ['Adventure', 'Drama', 'Sci-Fi']
        }
    ];
    const updateUser = (updatedUser) => {
        setUser(prev => (Object.assign(Object.assign({}, prev), updatedUser)));
    };
    const handleProfileSubmit = (e) => {
        e.preventDefault();
        alert('Profile updated successfully!');
    };
    return (_jsxs("div", { className: "user-profile-container", children: [_jsx(ProfileHeader, { avatar: user.avatar, nickname: user.nickname, username: user.username }), _jsx(ProfileTabs, { activeTab: activeTab, setActiveTab: setActiveTab }), _jsxs("div", { className: "profile-content", children: [activeTab === 'profile' && (_jsx(ProfileEditForm, { user: user, updateUser: updateUser, handleSubmit: handleProfileSubmit })), activeTab === 'lists' && (_jsx(MovieLists, { movies: sampleMovies })), activeTab === 'settings' && (_jsx(AccountSettings, {}))] })] }));
};
export default ProfilePage;
