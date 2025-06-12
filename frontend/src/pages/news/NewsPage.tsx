import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNews, NewsItem } from '@src/services/movieNewsService';
import NewsCard from './NewsCard';
import './NewsPage.css';
import Footer from '@components/app/Footer';
// import CircularLoader from '@components/app/CircularLoader';
import { useTranslation } from 'react-i18next';

const NewsPage = () => {
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
  const [mainNews, setMainNews] = useState<NewsItem | null>(null);
  const [otherNews, setOtherNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const items = await getNews();
        if (items && items.length > 0) {
          setAllNewsItems(items);
          setMainNews(items[0]);
          setOtherNews(items.slice(1));
        } else {
          setAllNewsItems([]);
          setMainNews(null);
          setOtherNews([]);
        }
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="news-page">
      <div className="news-container">
        <h1 className="news-page-title">{t('latestNews')}</h1>

        {loading && <div className="news-loading">{t('loadingNews')}</div>}
        {error && <div className="news-error">{t('errorFetchingNews')}: {error}</div>}

        {!loading && !error && mainNews && (
          <div className="main-news-section">
            <div className="main-news-content">
              <Link to={`/news/${mainNews.id}`} className="main-news-link">
                <div className="main-news-image-container">
                  <img 
                    src={mainNews.image_url || '/placeholder-news-large.jpg'} 
                    alt={mainNews.title} 
                    className="main-news-image" 
                  />
                </div>
                <div className="main-news-text">
                  <h2 className="main-news-title">{mainNews.title}</h2>
                  {mainNews.short_content && <p className="main-news-excerpt">{mainNews.short_content}</p>}
                  <p className="main-news-date">{formatDate(mainNews.published_at)}</p>
                </div>
              </Link>
            </div>
            <aside className="main-news-sidebar">
              <div className="widget-card">
                <h3>{t('popularCategories')}</h3>
                <div className="category-links">
                  <Link to="#" className="category-link"><span>{t('movies')}</span><span className="category-count">342</span></Link>
                  <Link to="#" className="category-link"><span>{t('tvShows')}</span><span className="category-count">267</span></Link>
                  <Link to="#" className="category-link"><span>{t('streaming')}</span><span className="category-count">112</span></Link>
                  <Link to="#" className="category-link"><span>{t('reviews')}</span><span className="category-count">89</span></Link>
                </div>
              </div>
              <div className="newsletter-widget">
                <h3>{t('getFilmUpdates')}</h3>
                <p>{t('subscribeNewsletter')}</p>
                <div className="newsletter-form">
                  <input type="email" placeholder={t('yourEmailAddress')} />
                  <button className="subscribe-button">{t('subscribe')}</button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {!loading && !error && otherNews.length > 0 && (
          <div className="news-grid-container">
            <h2 className="more-news-title">{t('moreNews')}</h2>
            <div className="news-grid">
              {otherNews.map(item => (
                <NewsCard key={item.id} newsItem={item} />
              ))}
            </div>
          </div>
        )}
        
        {!loading && !error && allNewsItems.length === 0 && (
          <p className="news-no-articles">{t('noNewsArticles')}</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default NewsPage; 