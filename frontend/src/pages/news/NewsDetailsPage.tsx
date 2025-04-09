import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './NewsDetailsPage.css';
import Footer from '@components/app/Footer';

// Define type for a news article
interface NewsArticle {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  image: string;
  content: string[];
  relatedArticles?: {
    id: string;
    title: string;
    image: string;
  }[];
}

// Sample article with comprehensive content
const sampleArticle: NewsArticle = {
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

const NewsDetailsPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  
  // In a real app, you would fetch the article based on articleId
  // For now, we'll use the sample data
  const article = sampleArticle;
  
  return (
    <div className="news-page">
      <div className="news-container1">
        <div className="news-detail-header">
          <Link to="/news" className="back-link">
            <span>←</span> Back to News
          </Link>
          <div className="news-meta">
            <span className="news-category">{article.category}</span>
            <span className="news-date">{article.date}</span>
            <span className="news-author">By {article.author}</span>
          </div>
          <h1>{article.title}</h1>
        </div> 
        <div className="news-detail-content">
          <div className="article-main">
            <div className="article-image">
              <img src={article.image} alt={article.title} />
            </div>
            <div className="article-content">
              {article.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="article-tags">
              {['Dune', 'Denis Villeneuve', 'Sci-Fi', 'Timothée Chalamet', 'Zendaya'].map(tag => (
                <Link 
                  key={tag}
                  to={`/news/tag/${tag.toLowerCase().replace(' ', '-')}`}
                  className="tag-link"
                >
                  #{tag}
                </Link>
              ))}
            </div>
            <div className="article-share">
              <h3>Share this article</h3>
              <div className="share-buttons">
                <button className="share-button">Twitter</button>
                <button className="share-button">Facebook</button>
                <button className="share-button">Copy Link</button>
              </div>
            </div>
          </div>
          <div className="article-sidebar">
            <div className="author-card">
              <div className="author-image">
                <img src="/api/placeholder/160/160" alt={article.author} />
              </div>
              <h4>{article.author}</h4>
              <p className="author-title">Senior Entertainment Editor</p>
              <p className="author-bio">
                Covering film and TV for over a decade with a focus on science fiction and fantasy.
              </p>
              <Link to="/author/jessica-reynolds" className="author-link">
                View all articles →
              </Link>
            </div>
            <div className="widget-card">
              <h3>Related Articles</h3>
              <div className="related-articles">
                {article.relatedArticles?.map(related => (
                  <Link 
                    key={related.id}
                    to={`/news/${related.id}`}
                    className="related-article-link" >
                    <div className="related-article-image">
                      <img src={related.image} alt={related.title} />
                    </div>
                    <div className="related-article-title">
                      <p>{related.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="widget-card">
              <h3>Popular Categories</h3>
              <div className="category-links">
                {[
                  { name: 'Movies', count: 342 },
                  { name: 'TV Shows', count: 267 },
                  { name: 'Celebrities', count: 189 },
                  { name: 'Reviews', count: 156 },
                  { name: 'Interviews', count: 103 }
                ].map(category => (
                  <Link 
                    key={category.name}
                    to={`/news/category/${category.name.toLowerCase()}`}
                    className="category-link" >
                    <span>{category.name}</span>
                    <span className="category-count">{category.count}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="newsletter-widget">
              <h3>Get Film Updates</h3>
              <p>
                Subscribe to our newsletter for the latest movie news, reviews, and exclusive content.
              </p>
              <div className="newsletter-form">
                <input type="email" placeholder="Your email address" />
                <button className="subscribe-button">Subscribe</button>
              </div>
              <p className="privacy-note">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
        <div className="more-to-explore">
          <h2>More to Explore</h2>
          <div className="explore-articles">
            {[
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
            ].map(item => (
              <Link
                key={item.id}
                to={`/news/${item.id}`}
                className="explore-article"
              >
                <div className="explore-article-image">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="explore-article-content">
                  <h3>{item.title}</h3>
                  <p>{item.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NewsDetailsPage;