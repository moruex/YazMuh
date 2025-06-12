import React from 'react';
import { Link } from 'react-router-dom';
import { NewsItem } from '@src/services/movieNewsService';
// Styles will be in NewsPage.css for now, or can be moved to a separate NewsCard.css

interface NewsCardProps {
  newsItem: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ newsItem }) => {
  const { id, title, short_content, image_url, published_at } = newsItem;

  const publicationDate = published_at 
    ? new Date(published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date not available';

  // Fallback image if image_url is null or empty
  const displayImage = image_url || '/placeholder-news.jpg'; // Ensure you have a placeholder image at this path or use a full URL

  return (
    <Link to={`/news/${id}`} className="news-card-link">
      <div className="news-card">
        <div className="news-card-image-container">
          <img src={displayImage} alt={title} className="news-card-image" />
        </div>
        <div className="news-card-content">
          <h3 className="news-card-title">{title}</h3>
          {short_content && <p className="news-card-excerpt">{short_content}</p>}
          <p className="news-card-date">{publicationDate}</p>
        </div>
      </div>
    </Link>
  );
};

export default NewsCard; 