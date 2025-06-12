import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './NewsDetailsPage.css';
import Footer from '@components/app/Footer';
import { getNewsArticleById, NewsArticleDetail, Movie } from '@src/services/movieNewsService';
import { useTranslation } from 'react-i18next';

const NewsDetailsPage: React.FC = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t('dateNotAvailable');
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (!newsId) {
      setError(t('newsIdMissing'));
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      try {
        setLoading(true);
        const fetchedArticle = await getNewsArticleById(newsId);
        if (fetchedArticle) {
          setArticle(fetchedArticle);
        } else {
          setError(t('newsArticleNotFound'));
        }
      } catch (err) {
        console.error(`Error fetching news article ${newsId}:`, err);
        setError(t('unknownErrorFetchingArticle'));
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [newsId, t]);

  if (loading) {
    return (
      <div className="news-page news-loading-container">
        <div className="news-container1">{t('loadingArticle')}</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-page news-error-container">
        <div className="news-container1">{t('error')}: {error}</div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="news-page">
        <div className="news-container1">
          <p>{t('newsArticleNotFound')}</p>
          <Link to="/news" className="back-link">
            <span>←</span> {t('backToNews')}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const displayImage = article.image_url || '/placeholder-news.jpg';

  return (
    <div className="news-page">
      <div className="news-container1">
        <div className="news-detail-header">
          <Link to="/news" className="back-link">
            <span>←</span> {t('backToNews')}
          </Link>
          <div className="news-meta">
            <span className="news-date">{formatDate(article.published_at)}</span>
            {article.author && <span className="news-author">{t('by')} {article.author.username}</span>}
          </div>
          <h1>{article.title}</h1>
        </div>
        <div className="news-detail-content">
          <div className="article-main">
            <div className="article-image">
              <img src={displayImage} alt={article.title} />
            </div>
            <div className="article-content">{article.content || ''}</div>
          </div>
          <div className="article-sidebar">
            {article.author && (
              <div className="author-card">
                <h4>{article.author.username}</h4>
              </div>
            )}

            {article.movies && article.movies.length > 0 && (
              <div className="widget-card">
                <h3>{t('relatedMovies')}</h3>
                <div className="related-articles">
                  {article.movies.map((movie: Movie) => (
                    <Link
                      key={movie.id}
                      to={`/movies/${movie.id}`}
                      className="related-article-link"
                    >
                      {movie.poster_url && (
                        <div className="related-article-image">
                          <img src={movie.poster_url} alt={movie.title} />
                        </div>
                      )}
                      <div className="related-article-title">
                        <p>{movie.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="widget-card">
              <h3>{t('popularCategories')}</h3>
              <div className="category-links">
                {[
                  { key: 'movies', count: 342 },
                  { key: 'tvShows', count: 267 }
                ].map(cat => (
                  <Link
                    key={cat.key}
                    to={`/news/category/${t(cat.key).toLowerCase()}`}
                    className="category-link"
                  >
                    <span>{t(cat.key)}</span>
                    <span className="category-count">{cat.count}</span>
                  </Link>
                ))}
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
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NewsDetailsPage;
