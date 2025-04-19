import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './NewsPage.css';
import Footer from '@components/app/Footer';
const newsData = [
    {
        id: 1,
        title: "Christopher Nolan Announces New Sci-Fi Epic 'Timekeeper'",
        content: "After Oppenheimer's success, Nolan reveals his next project — a time-bending sci-fi thriller set across multiple centuries. Following the massive critical and commercial triumph of Oppenheimer, Christopher Nolan is returning to his sci-fi roots with a bold new project. Described as an “epic thriller that bends time, memory, and identity,” the untitled film will span multiple centuries, intertwining the stories of characters from vastly different eras — from the 15th century to a distant, post-apocalyptic future.",
        image: "https://i.guim.co.uk/img/media/76548e3be400ba868465006aec9d5633d3dba179/0_109_3244_1946/master/3244.jpg?width=700&dpr=2&s=none&crop=none",
        category: "Cinema",
        date: "March 28, 2025",
        detail: "Nolan described 'Timekeeper' as his most ambitious project yet..."
    },
    {
        id: 2,
        title: "Studio Ghibli Announces First Ever TV Series for Netflix",
        content: "The legendary animation studio breaks tradition with a fantasy series adaptation...",
        image: "https://images-prod.dazeddigital.com/800/azure/dazed-prod/1190/2/1192918.jpg",
        category: "Television",
        date: "April 5, 2025",
        detail: "Hayao Miyazaki will serve as creative consultant..."
    },
    {
        id: 3,
        title: "Denis Villeneuve to Direct Dune Messiah in 2026",
        content: "Warner Bros confirms the third Dune film with returning cast and crew...",
        image: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg", // Dune Part Two image
        category: "Cinema",
        date: "February 10, 2025",
        detail: "Villeneuve stated he needed time to 'recharge'..."
    },
    {
        id: 4,
        title: "First African Marvel Superhero Film 'Mosi' Announced",
        content: "Marvel Studios partners with African filmmakers...",
        image: "https://m.media-amazon.com/images/M/MV5BMTg1MTY2MjYzNV5BMl5BanBnXkFtZTgwMTc4NTMwNDI@._V1_.jpg", // Black Panther placeholder
        category: "Cinema",
        date: "March 15, 2025",
        detail: "The film will be shot primarily in Nigeria..."
    },
    {
        id: 5,
        title: "New Restoration of 'Metropolis' Uncovers Lost Footage",
        content: "4K restoration of Fritz Lang's masterpiece includes...",
        image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiga1dMjFaILYGLtHOkOQc-VuTFkammxGQ34p0Y-u4thQ-2S_xzjzdfO1AqoEtgzgxkYoHYne8kVRR3tOOK9PCOHg2t38QJyl6vgkxrOcEB4GKBrgwq-8CB0mJQtk5sIxfris3S/s320/Metropolis_banner.jpg", // Metropolis image
        category: "Restoration",
        date: "April 1, 2025",
        detail: "The restoration adds nearly 30 minutes..."
    },
    {
        id: 6,
        title: "A24 Acquires Rights to Adapt 'The Three-Body Problem'",
        content: "After Netflix's adaptation, indie studio plans...",
        image: "https://www.joblo.com/wp-content/uploads/2024/05/3-body-problem-1024x576.jpg",
        category: "Cinema",
        date: "March 20, 2025",
        detail: "A24's version will be filmed in Mandarin..."
    },
    {
        id: 7,
        title: "Jane Campion to Helm Adaptation of Donna Tartt's 'The Goldfinch'",
        content: "After Power of the Dog, Campion takes on...",
        image: "https://thehill.com/wp-content/uploads/sites/2/2022/03/campionjane_032822ap.jpg?w=900", // Power of the Dog image
        category: "Cinema",
        date: "March 10, 2025",
        detail: "This marks Campion's return to literary adaptations..."
    },
    {
        id: 8,
        title: "Sundance 2025: Documentary About AI in Film Wins Grand Jury Prize",
        content: "'Artificial Imagination' explores how...",
        image: "https://m.media-amazon.com/images/M/MV5BNDVkYjU0MzctMWRmZi00NTkxLTgwZWEtOWVhYjZlYjllYmU4XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_FMjpg_UX1000_.jpg", // Documentary placeholder
        category: "Documentary",
        date: "January 28, 2025",
        detail: "The provocative doc includes interviews..."
    },
    {
        id: 9,
        title: "Pixar Announces First Musical Feature 'Starlight'",
        content: "Original musical fantasy set in constellation world...",
        image: "https://wdwmagic.twic.pics/ElementGalleryItems/events/Fullsize/The-Music-of-Pixar-Live!_Full_29879.jpg?twic=v1",
        category: "Animation",
        date: "February 15, 2025",
        detail: "Pixar's 28th feature marks their first full musical..."
    }
];
const widgetData = {
    trending: [
        { id: 1, title: "Nolan's New Sci-Fi Epic Revealed" },
        { id: 2, title: "Ghibli's First TV Series Coming" },
        { id: 3, title: "Dune Messiah Confirmed" },
        { id: 4, title: "African Marvel Hero 'Mosi' Announced" },
        { id: 5, title: "Lost Metropolis Footage Found" },
    ],
    trailers: [
        { id: 1, title: "Furiosa: A Mad Max Saga", url: "https://www.youtube.com/watch?v=f3M5VkPZLbo" },
        { id: 2, title: "Joker: Folie à Deux", url: "https://www.youtube.com/watch?v=xy8aJw1vYHo" },
        { id: 3, title: "Gladiator II", url: "https://www.youtube.com/watch?v=payHcGmOSGQ" },
    ],
    topMovies: [
        { id: 1, title: "Dune: Part Two", image: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg" },
        { id: 2, title: "Oppenheimer", image: "https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg" },
        { id: 3, title: "Poor Things", image: "https://ogden_images.s3.amazonaws.com/www.lewistownsentinel.com/images/2024/03/28222412/PoorThings1-339x500.jpg" },
        { id: 4, title: "The Zone of Interest", image: "https://play-lh.googleusercontent.com/OEzlCV5C2okDhEkpagtzoq2ONjbvEwm6uxFespWJzLwJNMsR8ImPzcgwL2Njgv00YpX5ImmNUjawEbiFm34" },
    ]
};
const NewsPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const newsPerPage = 9; // Increased from 6 to show more news
    const indexOfLastNews = currentPage * newsPerPage;
    const indexOfFirstNews = indexOfLastNews - newsPerPage;
    const currentNews = newsData.slice(indexOfFirstNews, indexOfLastNews);
    const totalPages = Math.ceil(newsData.length / newsPerPage);
    // Widgets Component (using modern class names)
    const Widgets = () => (_jsxs("div", { className: "modern-news-widgets", children: [_jsxs("div", { className: "modern-widget-card", children: [_jsx("h3", { className: "modern-widget-title", children: "\uD83D\uDD25 Trending News" }), _jsx("ul", { className: "modern-trending-list", children: widgetData.trending.map(item => (_jsx("li", { className: "modern-trending-item", children: _jsx("span", { children: item.title }) }, item.id))) })] }), _jsxs("div", { className: "modern-widget-card", children: [_jsx("h3", { className: "modern-widget-title", children: "\uD83C\uDFAC Popular Trailers" }), _jsx("ul", { className: "modern-trailer-list", children: widgetData.trailers.map(trailer => (_jsx("li", { className: "modern-trailer-item", children: _jsxs("a", { href: trailer.url, target: "_blank", rel: "noopener noreferrer", className: "modern-trailer-link", children: [_jsx("span", { className: "play-icon", children: "\u25B6\uFE0F" }), " ", _jsx("span", { children: trailer.title })] }) }, trailer.id))) })] }), _jsxs("div", { className: "modern-widget-card", children: [_jsx("h3", { className: "modern-widget-title", children: "\uD83C\uDFA5 Top Movies" }), _jsx("div", { className: "modern-top-movies-grid", children: widgetData.topMovies.map(movie => (_jsxs("div", { className: "modern-top-movie-card", children: [_jsx("img", { src: movie.image, alt: movie.title, className: "modern-top-movie-image" }), _jsx("p", { className: "modern-top-movie-title", children: movie.title })] }, movie.id))) })] })] }));
    // News Card Component (using modern class names)
    const NewsCard = ({ item, featured = false }) => (_jsxs(Link, { to: `/newsd`, className: `modern-news-card ${featured ? 'featured' : ''}`, children: [_jsx("div", { className: "modern-news-card-image-wrapper", children: _jsx("img", { src: item.image, alt: item.title, className: "modern-news-card-image" }) }), _jsxs("div", { className: "modern-news-card-content", children: [_jsxs("div", { className: "modern-news-meta", children: [_jsx("span", { className: "modern-news-date", children: item.date }), _jsx("span", { className: "modern-news-category", children: item.category })] }), _jsx("h3", { className: "modern-news-card-title", children: item.title }), _jsx("p", { className: "modern-news-card-excerpt", children: featured ? item.content : `${item.content.substring(0, 120)}...` }), _jsx("span", { className: "modern-read-more", children: "Read More \u2192" })] })] }));
    // Pagination Component (using modern class names)
    const Pagination = () => {
        if (totalPages <= 1)
            return null;
        return (_jsxs("div", { className: "modern-pagination", children: [_jsx("button", { onClick: () => setCurrentPage(prev => Math.max(prev - 1, 1)), disabled: currentPage === 1, className: "modern-pagination-button prev", children: "\u2190 Prev" }), Array.from({ length: totalPages }, (_, i) => (_jsx("button", { onClick: () => setCurrentPage(i + 1), className: `modern-pagination-button ${currentPage === i + 1 ? 'active' : ''}`, children: i + 1 }, i + 1))), _jsx("button", { onClick: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)), disabled: currentPage === totalPages, className: "modern-pagination-button next", children: "Next \u2192" })] }));
    };
    return (_jsxs("div", { className: "modern-news-page", children: [_jsxs("div", { className: "modern-news-page-header", children: [_jsx("h1", { children: "\uD83C\uDFAC MovieQ News" }), _jsx("p", { children: "Latest updates from the world of cinema" })] }), _jsxs("div", { className: "modern-news-container", children: [_jsx("div", { className: "modern-news-main-content", children: currentNews.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "modern-news-grid", children: currentNews.map((item, index) => (_jsx(NewsCard, { item: item, featured: index === 0 && currentPage === 1 }, `${item.id}-${index}`))) }), _jsx(Pagination, {})] })) : (_jsx("p", { className: "modern-no-news-message", children: "No news found." })) }), _jsx(Widgets, {})] }), _jsx(Footer, {})] }));
};
export default NewsPage;
