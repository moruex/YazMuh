import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NewsPage.css';
import Footer from '@components/app/Footer';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  detail?: string;
  image: string;
  category: string;
  date: string;
}

const newsData: NewsItem[] = [
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

const NewsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const newsPerPage = 9; // Increased from 6 to show more news
  
  const indexOfLastNews = currentPage * newsPerPage;
  const indexOfFirstNews = indexOfLastNews - newsPerPage;
  const currentNews = newsData.slice(indexOfFirstNews, indexOfLastNews);
  const totalPages = Math.ceil(newsData.length / newsPerPage);
  
  // Widgets Component (using modern class names)
  const Widgets = () => (
    <div className="modern-news-widgets">
      {/* Trending News Widget */}
      <div className="modern-widget-card">
        <h3 className="modern-widget-title">🔥 Trending News</h3>
        <ul className="modern-trending-list">
          {widgetData.trending.map(item => (
            <li key={item.id} className="modern-trending-item">
              {/* Removed icon span, can be added via CSS ::before */}
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Popular Trailers Widget */}
      <div className="modern-widget-card">
        <h3 className="modern-widget-title">🎬 Popular Trailers</h3>
        <ul className="modern-trailer-list">
          {widgetData.trailers.map(trailer => (
            <li key={trailer.id} className="modern-trailer-item">
              <a href={trailer.url} target="_blank" rel="noopener noreferrer" className="modern-trailer-link">
                <span className="play-icon">▶️</span> {/* Keep icon or replace with CSS */}
                <span>{trailer.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Top Movies Widget - Improved for desktop */}
      <div className="modern-widget-card">
        <h3 className="modern-widget-title">🎥 Top Movies</h3>
        <div className="modern-top-movies-grid">
          {widgetData.topMovies.map(movie => (
            <div key={movie.id} className="modern-top-movie-card">
              <img 
                src={movie.image} 
                alt={movie.title} 
                className="modern-top-movie-image"
              />
              <p className="modern-top-movie-title">{movie.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // News Card Component (using modern class names)
  const NewsCard = ({ item, featured = false }: { item: NewsItem, featured?: boolean }) => (
    <Link to={`/newsd`} className={`modern-news-card ${featured ? 'featured' : ''}`}>
      <div className="modern-news-card-image-wrapper">
        <img 
          src={item.image} 
          alt={item.title} 
          className="modern-news-card-image" 
        />
      </div>
      <div className="modern-news-card-content">
        <div className="modern-news-meta">
          <span className="modern-news-date">{item.date}</span>
          <span className="modern-news-category">{item.category}</span>
        </div>
        <h3 className="modern-news-card-title">{item.title}</h3>
        <p className="modern-news-card-excerpt">{featured ? item.content : `${item.content.substring(0, 120)}...`}</p>
        <span className="modern-read-more">Read More →</span>
      </div>
    </Link>
  );
  
  // Pagination Component (using modern class names)
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="modern-pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
          disabled={currentPage === 1}
          className="modern-pagination-button prev"
        >
          ← Prev
        </button>
        
        {/* Consider rendering fewer page numbers for large totalPages */}
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`modern-pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
          >
            {i + 1}
          </button>
        ))}
        
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
          disabled={currentPage === totalPages}
          className="modern-pagination-button next"
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div className="modern-news-page">
      <div className="modern-news-page-header">
        <h1>🎬 MovieQ News</h1>
        <p>Latest updates from the world of cinema</p>
      </div>
      
      <div className="modern-news-container">
        {/* Main News Content Area - Now takes full width on desktop */}
        <div className="modern-news-main-content">
          {/* News Grid and Pagination */}
          {currentNews.length > 0 ? (
            <>
              <div className="modern-news-grid">
                {/* Render the first item as featured, rest as standard */}
                {currentNews.map((item, index) => (
                  <NewsCard key={`${item.id}-${index}`} item={item} featured={index === 0 && currentPage === 1} />
                ))}
              </div>
              
              <Pagination />
            </>
          ) : (
            <p className="modern-no-news-message">No news found.</p>
          )}
        </div>
        
        {/* Widgets Sidebar - Now appears on the right side */}
        <Widgets />
      </div>
      <Footer />
    </div>
  );
};

export default NewsPage;
