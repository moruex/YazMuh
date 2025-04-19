import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import './NewsDetailsPage.css';
import Footer from '@components/app/Footer';
// Sample article with comprehensive content
const sampleArticle = {
    id: '1',
    title: 'Dune: Part Three Confirmed with Spectacular Concept Art Reveal',
    category: 'Movies',
    date: 'March 29, 2025',
    author: 'Jessica Reynolds',
    image: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg',
    content: [
        'In a highly anticipated announcement, Legendary Pictures has officially greenlit "Dune: Part Three," confirming that director Denis Villeneuve will return to complete his epic adaptation of Frank Herbert\'s seminal science fiction saga. The studio revealed the news at a special panel during this year\'s San Diego Comic-Con, accompanied by never-before-seen concept art that sent fans into a frenzy.',
        'Following the critical acclaim and commercial success of both "Dune: Part One" and "Dune: Part Two," the final installment is set to adapt "Dune Messiah," the second novel in Herbert\'s series. Villeneuve has previously expressed his desire to create a trilogy that would complete Paul Atreides\' arc, and now that vision is becoming reality.',
        '"Bringing Frank Herbert\'s world to life has been the honor of a lifetime," Villeneuve stated during the announcement. "With Part Three, we\'ll explore the consequences of Paul\'s rise to power and the burden of his prescience. It\'s a more introspective, philosophical story, but no less epic in scale."',
        'The concept art displayed at the panel revealed stunning new environments, including the imperial palace on Arrakis, now transformed into a verdant paradise in certain protected areas, contrasting sharply with the harsh desert landscape that dominates the planet. One particularly striking image showed Paul Atreides seated on an ornate throne formed from the skeleton of a massive sandworm.',
        'Timothée Chalamet and Zendaya are confirmed to reprise their roles as Paul Atreides and Chani, respectively. New casting announcements include Academy Award winner Olivia Colman, who will join the ensemble as the Princess Irulan, and Daniel Kaluuya as Bijaz, a mysterious character central to the plot of "Dune Messiah."',
        'Production is scheduled to begin in early 2026, with filming locations including Jordan, Abu Dhabi, and newly constructed sets at Origo Studios in Budapest. The film\'s visual effects supervisor, Paul Lambert, who won Oscars for his work on both previous films, is also returning.',
        'Hans Zimmer, whose distinctive score became synonymous with the sweeping visuals of Arrakis, has already begun composing new themes for the final chapter. "The music will reflect Paul\'s transformation and the growing conflict between his humanity and his role as a religious icon," Zimmer explained in a pre-recorded message to fans.',
        'The studio also announced an expanded universe of content, including a prequel series titled "Dune: The Sisterhood," focusing on the Bene Gesserit order, set to premiere on HBO Max next year. Additionally, a graphic novel adaptation of "Dune Messiah" will be released ahead of the film to introduce new readers to the source material.',
        'Merchandising plans were also unveiled, featuring high-end collectibles from manufacturers like Hot Toys and Sideshow, as well as a new line of eco-friendly apparel made from recycled materials, reflecting the ecological themes central to Herbert\'s work.',
        'Fan reaction to the announcement has been overwhelmingly positive, with the hashtag #DunePart3 trending worldwide within minutes of the reveal. The previous installment, "Dune: Part Two," grossed over $850 million globally and received nine Academy Award nominations, winning for Visual Effects, Sound, and Production Design.',
        'The release date for "Dune: Part Three" is tentatively set for December 2027, allowing ample time for the complex production process that has become Villeneuve\'s hallmark. "Some stories deserve time," noted Villeneuve. "And Herbert\'s vision is one that we refuse to rush."'
    ],
    relatedArticles: [
        {
            id: '2',
            title: 'Exclusive Interview: Timothée Chalamet on Becoming Muad\'Dib',
            image: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg'
        },
        {
            id: '3',
            title: 'The Ecological Themes of Dune: How the Films Honor Herbert\'s Vision',
            image: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg'
        },
        {
            id: '4',
            title: 'Dune\'s Influence on Modern Science Fiction: A Cultural Analysis',
            image: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg'
        },
        {
            id: '5',
            title: 'Behind the Scenes: The Visual Effects of Sandworms and Shields',
            image: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg'
        }
    ]
};
const NewsDetailsPage = () => {
    // Remove unused articleId
    // const { articleId } = useParams();
    var _a;
    // In a real app, you would fetch the article based on articleId
    // For now, we'll use the sample data
    const article = sampleArticle;
    return (_jsxs("div", { className: "news-page", children: [_jsxs("div", { className: "news-container1", children: [_jsxs("div", { className: "news-detail-header", children: [_jsxs(Link, { to: "/news", className: "back-link", children: [_jsx("span", { children: "\u2190" }), " Back to News"] }), _jsxs("div", { className: "news-meta", children: [_jsx("span", { className: "news-category", children: article.category }), _jsx("span", { className: "news-date", children: article.date }), _jsxs("span", { className: "news-author", children: ["By ", article.author] })] }), _jsx("h1", { children: article.title })] }), _jsxs("div", { className: "news-detail-content", children: [_jsxs("div", { className: "article-main", children: [_jsx("div", { className: "article-image", children: _jsx("img", { src: article.image, alt: article.title }) }), _jsx("div", { className: "article-content", children: article.content.map((paragraph, index) => (_jsx("p", { children: paragraph }, index))) }), _jsx("div", { className: "article-tags", children: ['Dune', 'Denis Villeneuve', 'Sci-Fi', 'Timothée Chalamet', 'Zendaya'].map(tag => (_jsxs(Link, { to: `/news/tag/${tag.toLowerCase().replace(' ', '-')}`, className: "tag-link", children: ["#", tag] }, tag))) }), _jsxs("div", { className: "article-share", children: [_jsx("h3", { children: "Share this article" }), _jsxs("div", { className: "share-buttons", children: [_jsx("button", { className: "share-button", children: "Twitter" }), _jsx("button", { className: "share-button", children: "Facebook" }), _jsx("button", { className: "share-button", children: "Copy Link" })] })] })] }), _jsxs("div", { className: "article-sidebar", children: [_jsxs("div", { className: "author-card", children: [_jsx("div", { className: "author-image", children: _jsx("img", { src: "/api/placeholder/160/160", alt: article.author }) }), _jsx("h4", { children: article.author }), _jsx("p", { className: "author-title", children: "Senior Entertainment Editor" }), _jsx("p", { className: "author-bio", children: "Covering film and TV for over a decade with a focus on science fiction and fantasy." }), _jsx(Link, { to: "/author/jessica-reynolds", className: "author-link", children: "View all articles \u2192" })] }), _jsxs("div", { className: "widget-card", children: [_jsx("h3", { children: "Related Articles" }), _jsx("div", { className: "related-articles", children: (_a = article.relatedArticles) === null || _a === void 0 ? void 0 : _a.map(related => (_jsxs(Link, { to: `/news/${related.id}`, className: "related-article-link", children: [_jsx("div", { className: "related-article-image", children: _jsx("img", { src: related.image, alt: related.title }) }), _jsx("div", { className: "related-article-title", children: _jsx("p", { children: related.title }) })] }, related.id))) })] }), _jsxs("div", { className: "widget-card", children: [_jsx("h3", { children: "Popular Categories" }), _jsx("div", { className: "category-links", children: [
                                                    { name: 'Movies', count: 342 },
                                                    { name: 'TV Shows', count: 267 },
                                                    { name: 'Celebrities', count: 189 },
                                                    { name: 'Reviews', count: 156 },
                                                    { name: 'Interviews', count: 103 }
                                                ].map(category => (_jsxs(Link, { to: `/news/category/${category.name.toLowerCase()}`, className: "category-link", children: [_jsx("span", { children: category.name }), _jsx("span", { className: "category-count", children: category.count })] }, category.name))) })] }), _jsxs("div", { className: "newsletter-widget", children: [_jsx("h3", { children: "Get Film Updates" }), _jsx("p", { children: "Subscribe to our newsletter for the latest movie news, reviews, and exclusive content." }), _jsxs("div", { className: "newsletter-form", children: [_jsx("input", { type: "email", placeholder: "Your email address" }), _jsx("button", { className: "subscribe-button", children: "Subscribe" })] }), _jsx("p", { className: "privacy-note", children: "We respect your privacy. Unsubscribe at any time." })] })] })] }), _jsxs("div", { className: "more-to-explore", children: [_jsx("h2", { children: "More to Explore" }), _jsx("div", { className: "explore-articles", children: [
                                    {
                                        id: '6',
                                        title: 'The Most Anticipated Sci-Fi Films of 2026',
                                        image: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg',
                                        date: 'March 25, 2025'
                                    },
                                    {
                                        id: '7',
                                        title: 'How Streaming Services Are Changing Film Distribution',
                                        image: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg',
                                        date: 'March 22, 2025'
                                    },
                                    {
                                        id: '8',
                                        title: 'The Rise of International Cinema in Mainstream Culture',
                                        image: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg',
                                        date: 'March 18, 2025'
                                    }
                                ].map(item => (_jsxs(Link, { to: `/news/${item.id}`, className: "explore-article", children: [_jsx("div", { className: "explore-article-image", children: _jsx("img", { src: item.image, alt: item.title }) }), _jsxs("div", { className: "explore-article-content", children: [_jsx("h3", { children: item.title }), _jsx("p", { children: item.date })] })] }, item.id))) })] })] }), _jsx(Footer, {})] }));
};
export default NewsDetailsPage;
