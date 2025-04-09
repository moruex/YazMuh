import React, { useState } from 'react';
import ProfileHeader from '@components/profile/ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileEditForm from './ProfileEditTab';
import MovieLists from '@components/profile/MovieLists';
import AccountSettings from './AccountSettings';

import "./ProfilePage.css";
import { Movie } from '@src/types/Movie';

interface User {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
    gender: 'male' | 'female' | 'other' | 'not-specified';
    age: number;
    watchedMovies: Movie[];
    favoriteMovies: Movie[];
    watchlist: Movie[];
}

const ProfilePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'lists' | 'settings'>('profile');
    const [user, setUser] = useState<User>({
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

    const sampleMovies: Movie[] = [
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

    const updateUser = (updatedUser: Partial<User>) => {
        setUser(prev => ({ ...prev, ...updatedUser }));
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Profile updated successfully!');
    };

    return (
        <div className="user-profile-container">
            <ProfileHeader
                avatar={user.avatar}
                nickname={user.nickname}
                username={user.username} />
            <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="profile-content">
                {activeTab === 'profile' && (
                    <ProfileEditForm
                        user={user}
                        updateUser={updateUser}
                        handleSubmit={handleProfileSubmit}
                    />
                )}
                {activeTab === 'lists' && (
                    <MovieLists movies={sampleMovies} />
                )}
                {activeTab === 'settings' && (
                    <AccountSettings />
                )}
            </div>
        </div>
    );
};

export default ProfilePage;