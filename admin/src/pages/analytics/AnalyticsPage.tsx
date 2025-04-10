// import React, { useEffect, useState, useMemo } from 'react';
import { useEffect, useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { StatCard } from '@components/StatCard';
import { Activity, Calendar, Eye, Film, MessageSquare, Star, Users } from 'lucide-react';
import { LogTable } from '@components/LogTable';
import CustomChart from '@components/CustomChart';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const AnalyticsPage = () => {
    // States to store the data
    const [mostLikedFilms] = useState([
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
    const [mostRatedFilms] = useState([
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
    const [mostViewedFilms] = useState([
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

    // Fetch data on component mount
    useEffect(() => {
        // Simulate API call with dummy data
        // totalUsers, totalFilms, totalReviews, mostActiveUsers are removed
    }, []);

    // Memoize chart data to avoid recalculating on every render
    // Remove unused mostLikedData
    /*
    const mostLikedData = useMemo(() => ({
        labels: mostLikedFilms.map(film => film.title),
        datasets: [{
            label: 'Likes',
            data: mostLikedFilms.map(film => film.likes),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }],
    }), [mostLikedFilms]);
    */

    // Remove unused mostRatedData
    /*
    const mostRatedData = useMemo(() => ({
        labels: mostRatedFilms.map(film => film.title),
        datasets: [{
            label: 'Ratings',
            data: mostRatedFilms.map(film => film.ratings),
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
        }],
    }), [mostRatedFilms]);
    */

    // Remove unused mostViewedData
    /*
    const mostViewedData = useMemo(() => ({
        labels: mostViewedFilms.map(film => film.title),
        datasets: [{
            label: 'Views',
            data: mostViewedFilms.map(film => film.views),
            backgroundColor: 'rgba(37, 81, 255, 0.62)',
        }],
    }), [mostViewedFilms]);
    */

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
