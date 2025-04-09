import React, { useEffect, useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { StatCard } from '@components/StatCard';
import { Activity, Calendar, Eye, Film, MessageSquare, Star, Users } from 'lucide-react';
import { LogTable } from '@components/LogTable';
import CustomChart from '@components/CustomChart';
import debounce from 'lodash.debounce';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const AnalyticsPage = () => {
    // States to store the data
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalFilms, setTotalFilms] = useState(0);
    const [mostLikedFilms, setMostLikedFilms] = useState([]);
    const [mostRatedFilms, setMostRatedFilms] = useState([]);
    const [mostViewedFilms, setMostViewedFilms] = useState([]);
    const [totalReviews, setTotalReviews] = useState(0);
    const [mostActiveUsers, setMostActiveUsers] = useState([]);

    // Fetch data on component mount
    useEffect(() => {
        // Simulate API call with dummy data
        setTotalUsers(1500);
        setTotalFilms(500);
        setMostLikedFilms([
            { title: 'Film A', likes: 500 },
            { title: 'Film B', likes: 400 },
            { title: 'Film C', likes: 300 },
            { title: 'Film D', likes: 500 },
            { title: 'Film E', likes: 700 },
            { title: 'Film F', likes: 600 },
            { title: 'Film G', likes: 300 },
            { title: 'Film H', likes: 670 },
            { title: 'Film I', likes: 380 },
            { title: 'Film J', likes: 700 },
        ]);
        setMostRatedFilms([
            { title: 'Film A', ratings: 500 },
            { title: 'Film B', ratings: 400 },
            { title: 'Film C', ratings: 300 },
            { title: 'Film D', ratings: 500 },
            { title: 'Film E', ratings: 700 },
            { title: 'Film F', ratings: 600 },
            { title: 'Film G', ratings: 300 },
            { title: 'Film H', ratings: 670 },
            { title: 'Film I', ratings: 380 },
            { title: 'Film J', ratings: 700 },
        ]);
        setMostViewedFilms([
            { title: 'Film A', views: 500 },
            { title: 'Film B', views: 400 },
            { title: 'Film C', views: 300 },
            { title: 'Film D', views: 500 },
            { title: 'Film E', views: 700 },
            { title: 'Film F', views: 600 },
            { title: 'Film G', views: 300 },
            { title: 'Film H', views: 670 },
            { title: 'Film I', views: 380 },
            { title: 'Film J', views: 700 },
        ]);
        setTotalReviews(1200);
        setMostActiveUsers([
            { name: 'User 1', reviews: 100 },
            { name: 'User 2', reviews: 90 },
            { name: 'User 3', reviews: 80 },
            { name: 'User 4', reviews: 100 },
            { name: 'User 5', reviews: 90 },
            { name: 'User 6', reviews: 80 },
            { name: 'User 7', reviews: 100 },
            { name: 'User 8', reviews: 90 },
            { name: 'User 9', reviews: 80 },
            { name: 'User 10', reviews: 100 },
        ]);
    }, []);

    // Memoize chart data to avoid recalculating on every render
    const mostLikedData = useMemo(() => ({
        labels: mostLikedFilms.map(film => film.title),
        datasets: [{
            label: 'Likes',
            data: mostLikedFilms.map(film => film.likes),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }],
    }), [mostLikedFilms]);

    const mostRatedData = useMemo(() => ({
        labels: mostRatedFilms.map(film => film.title),
        datasets: [{
            label: 'Ratings',
            data: mostRatedFilms.map(film => film.ratings),
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
        }],
    }), [mostRatedFilms]);

    const mostViewedData = useMemo(() => ({
        labels: mostViewedFilms.map(film => film.title),
        datasets: [{
            label: 'Views',
            data: mostViewedFilms.map(film => film.views),
            backgroundColor: 'rgba(37, 81, 255, 0.62)',
        }],
    }), [mostViewedFilms]);

    // Debounce resize events to avoid performance issues
    useEffect(() => {
        const handleResize = debounce(() => {
            // Force charts to resize
            window.dispatchEvent(new Event('resize'));
        }, 200);

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="analytics-container">
            <div className="grid-container">
                <StatCard icon={Users} title="Total Users" value="1,254" color="green" />
                <StatCard icon={Eye} title="Current Watchers" value="342" color="blue" />
                <StatCard icon={Film} title="Total Movies" value="5,673" color="red" />
                <StatCard icon={Calendar} title="New Releases" value="12 this week" color="purple" />
                <StatCard icon={Activity} title="Daily Visits" value="8,452" color="teal" />
                <StatCard icon={Star} title="Most Rated" value="Inception" color="yellow" />
                <StatCard icon={MessageSquare} title="Most Visited" value="Spider-man 2" color="gray" />
            </div>
            <div className="extra-section1">
                <CustomChart
                    className="likes"
                    data={mostLikedFilms}
                    dataKey="likes"
                    xAxisKey="title"
                    chartType="bar"
                    title="Most Liked Films"
                />
                <CustomChart
                    className="ratings"
                    data={mostRatedFilms}
                    dataKey="ratings"
                    xAxisKey="title"
                    chartType="bar"
                    title="Most Rated Films"
                />
                <CustomChart
                    className="views"
                    data={mostViewedFilms}
                    dataKey="views"
                    xAxisKey="title"
                    chartType="bar"
                    title="Most Viewed Films"
                />
                <LogTable title="All Logs" />
            </div>
        </div>
    );
};
