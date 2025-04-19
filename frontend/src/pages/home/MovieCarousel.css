/* MovieCarousel.css - Full Styles */

/* --- Variables --- */
:root {
    --mc-dark-bg: #0b0c0e;
    --mc-dark-surface: #141518;
    --mc-primary-green: #00e054;
    --mc-accent-green: #00b343;
    --mc-text-primary: #e0e0e0;
    --mc-text-secondary: #a0a0a0;
    --mc-text-disabled: #666;
    --mc-border-color: rgba(255, 255, 255, 0.1);
    --mc-card-bg: #1a1b1f;
    --mc-hover-bg: rgba(255, 255, 255, 0.05);
    --mc-star-color: var(--mc-primary-green);
    --mc-star-empty-color: #4a4a4a;
    --mc-control-bg: rgba(11, 12, 14, 0.75);
    --mc-control-hover-bg: var(--mc-primary-green);
    --mc-control-hover-text: var(--mc-dark-bg);
    --mc-shadow-color: rgba(0, 0, 0, 0.4);
    --mc-glow-color: rgba(0, 224, 84, 0.15);
    --mc-mobile-poster-height: 300px;
    --mc-small-mobile-poster-height: 250px;
    --mc-comment-bg: rgba(255, 255, 255, 0.03);
    --mc-comment-border: rgba(255, 255, 255, 0.08);
    --mc-like-color: var(--mc-text-secondary);
}

/* --- Base & Container --- */
.mc-container {
    display: grid;
    /* width: 100%; */
    /* max-width: 1150px; */
    /* margin: 2rem auto; */
    box-sizing: border-box;
    position: relative;
    color: var(--mc-text-primary);
}

.mc-carousel-title {
    font-size: clamp(1.6rem, 4vw, 2.1rem);
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: var(--mc-text-primary);
    text-align: center;
}

/* --- Carousel Structure --- */
.mc-carousel {
    position: relative;
    overflow: hidden;
    width: 100%;
    border-radius: 10px;
    background-color: var(--mc-dark-surface);
    border: 1px solid var(--mc-border-color);
}

.mc-carousel-inner {
    display: flex;
    
    will-change: transform;
}

.mc-slide {
    flex-shrink: 0;
    box-sizing: border-box;
   
    position: relative;
    overflow: hidden; 
}

/* --- Slide Content Layout --- */
.mc-slide-content {
    display: flex;
    flex-direction: row;
    background-color: var(--mc-card-bg);
    width: 100%;
    height: 100%;
    min-height: 400px; 
    box-sizing: border-box;
}

/* --- Poster Area --- */
.mc-poster-container {
    flex-shrink: 0;
    width: 33%;
    max-width: 280px;
    position: relative;
    background-color: #000;
    box-sizing: border-box;
    border-right: 1px solid var(--mc-border-color);
}

.mc-poster-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
}

/* --- Details Area --- */
.mc-details-container {
    flex: 1 1 auto;
    padding: clamp(1rem, 3vw, 1.5rem) clamp(1.25rem, 4vw, 2rem);
    display: flex;
    flex-direction: column;
    justify-content: space-between; 
    overflow-y: auto;
    box-sizing: border-box;
    gap: clamp(1rem, 2.5vh, 1.5rem); 
}

/* --- Text Elements --- */
.mc-movie-title {
    font-size: clamp(1.3rem, 2.8vw, 1.7rem);
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    color: var(--mc-text-primary);
    line-height: 1.2;
}

.mc-movie-year-genre {
    font-size: clamp(0.85rem, 1.8vw, 0.95rem);
    color: var(--mc-text-secondary);
    font-style: italic;
    margin-bottom: 0;
}

/* --- Review Section --- */
.mc-review-section {
    padding-left: 12px;
    border-left: 3px solid var(--mc-primary-green);
}

.mc-review-heading {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--mc-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 0.5rem;
}

.mc-review-quote {
    font-size: clamp(0.9rem, 2vw, 1rem);
    color: var(--mc-text-primary);
    line-height: 1.5;
    margin: 0;
    font-style: italic;
}
.mc-review-quote::before { content: "“"; margin-right: 0.3em; }
.mc-review-quote::after { content: "”"; margin-left: 0.3em; }


/* --- Top Comment Section --- */
.mc-top-comment-section {
   
}

.mc-comment-heading {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--mc-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 0.6rem;
    margin-top: 0;
    padding-top: 0;
}

.mc-comment-card {
    background-color: var(--mc-comment-bg);
    border: 1px solid var(--mc-comment-border);
    border-radius: 6px;
    padding: clamp(0.75rem, 2vw, 1rem);
}

.mc-comment-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.5rem;
}

.mc-comment-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--mc-dark-surface);
    border: 1px solid var(--mc-border-color);
    flex-shrink: 0;
}

.mc-comment-username {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--mc-text-primary);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
}

.mc-comment-text {
    font-size: clamp(0.85rem, 1.9vw, 0.95rem);
    color: var(--mc-text-primary);
    line-height: 1.5;
    margin: 0 0 0.6rem 0;
    overflow-wrap: break-word;
    word-wrap: break-word; 
    hyphens: auto;
}

.mc-comment-likes {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: var(--mc-like-color);
}

.mc-like-icon {
    font-size: 0.9em;
    opacity: 0.8;
    line-height: 1;
}

.mc-like-count {
    font-weight: 500;
}

/* --- Ratings Section --- */
.mc-ratings-section {
    padding-top: clamp(0.75rem, 2vh, 1rem);
    border-top: 1px solid var(--mc-border-color);
    /* margin-top: auto;  */
}

.mc-ratings-heading {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--mc-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 0.75rem;
    margin-top: 0;
    padding-top: 0;
}

.mc-ratings-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(10px, 2vw, 15px);
    align-items: start;
}

.mc-rating-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
}

.mc-rating-source {
    font-size: 0.7rem;
    color: var(--mc-text-secondary);
    margin-bottom: 3px;
    font-weight: 500;
}

.mc-rating-value {
    font-size: clamp(1rem, 2.2vw, 1.1rem);
    font-weight: 600;
    color: var(--mc-text-primary);
    line-height: 1.2;
}
.mc-rating-na {
    font-style: italic;
    color: var(--mc-text-disabled);
    font-size: 0.9em;
}

/* --- Star Rating --- */
.mc-rating-stars {
    display: flex;
    align-items: center;
    line-height: 1;
    color: var(--mc-star-color);
}

.mc-star {
    font-size: clamp(1rem, 2.2vw, 1.1rem);
    margin-right: 2px;
    line-height: 1;
}
.mc-star:last-child { margin-right: 0; }
.mc-star.mc-empty { color: var(--mc-star-empty-color); }
.mc-star.mc-half {
    position: relative;
    display: inline-block;
    color: var(--mc-star-empty-color);
}
.mc-star.mc-half::before {
    content: '★';
    position: absolute;
    left: 0;
    top: 0;
    width: 50%;
    overflow: hidden;
    color: var(--mc-star-color);
}

/* --- Controls (Prev/Next Buttons) --- */
.mc-control {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: clamp(36px, 5vw, 44px);
    height: clamp(36px, 5vw, 44px);
    border-radius: 50%;
    background-color: var(--mc-control-bg);
    color: var(--mc-text-secondary);
    font-size: clamp(20px, 3vw, 26px);
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid var(--mc-border-color);
    cursor: pointer;
    z-index: 10;
    transition: all 0.25s ease;
    opacity: 0;
    visibility: hidden;
}
.mc-carousel:hover .mc-control,
.mc-carousel:focus-within .mc-control {
    opacity: 0.8;
    visibility: visible;
}
.mc-control:hover:not(:disabled) {
    background-color: var(--mc-control-hover-bg);
    color: var(--mc-control-hover-text);
    border-color: transparent;
    transform: translateY(-50%) scale(1.08);
    opacity: 1;
}
.mc-control:disabled {
    opacity: 0.4 !important;
    cursor: not-allowed;
    background-color: rgba(30, 30, 30, 0.5);
    color: var(--mc-text-disabled);
    transform: translateY(-50%);
    border-color: var(--mc-border-color);
}
.mc-control.mc-prev { left: 15px; }
.mc-control.mc-next { right: 15px; }

/* --- Indicators (Dots) --- */
.mc-indicators {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
    padding-bottom: 0.5rem;
}

.mc-indicator {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background-color: var(--mc-star-empty-color);
    margin: 0 5px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
    opacity: 0.6;
}
.mc-indicator.mc-active {
    background-color: var(--mc-primary-green);
    transform: scale(1.2);
    opacity: 1;
}
.mc-indicator:hover:not(.mc-active):not(:disabled) {
    background-color: var(--mc-text-secondary);
    opacity: 0.8;
}
.mc-indicator:disabled:not(.mc-active) {
    cursor: not-allowed;
    opacity: 0.3;
}

/* --- Empty State --- */
.mc-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--mc-text-secondary);
    font-size: 1.1rem;
    background-color: var(--mc-dark-surface);
    border-radius: 8px;
    border: 1px solid var(--mc-border-color);
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* --- Responsive Adjustments --- */
@media (max-width: 992px) {
    .mc-poster-container {
        width: 38%;
        max-width: 260px;
    }
     .mc-slide-content {
        /* min-height: 380px; */
    }
}

@media (max-width: 767px) {
    .mc-container {
        /* margin: 1.5rem auto; */
    }
    .mc-slide-content {
        flex-direction: column;
        min-height: auto;
    }
    .mc-poster-container {
        width: 100%;
        max-width: none;
        height: var(--mc-mobile-poster-height);
        border-right: none;
        border-bottom: 1px solid var(--mc-border-color);
        flex-shrink: 0;
    }
    .mc-details-container {
        padding: 1rem 1.25rem;
        overflow-y: visible;
        gap: 1rem; 
    }
     .mc-movie-title { font-size: 1.2rem; }
    .mc-movie-year-genre { font-size: 0.8rem; }
     .mc-review-quote { font-size: 0.9rem; }
     .mc-comment-card { padding: 0.75rem; }
     .mc-comment-username { max-width: 150px; }
     .mc-comment-text { font-size: 0.85rem; }

    .mc-control {
        top: calc(var(--mc-mobile-poster-height) / 2);
        transform: translateY(-50%);
        opacity: 0.7;
        visibility: visible;
        width: 36px;
        height: 36px;
        font-size: 20px;
    }
    .mc-control.mc-prev { left: 10px; }
    .mc-control.mc-next { right: 10px; }
     .mc-indicators { margin-top: 0.75rem; }
     .mc-indicator { width: 8px; height: 8px; }
}

@media (max-width: 480px) {
     .mc-container {
        padding: 0 5px;
        /* margin: 1rem auto; */
    }
     .mc-carousel-title { font-size: 1.4rem; }
     .mc-poster-container { height: var(--mc-small-mobile-poster-height); }
     .mc-details-container { padding: 0.8rem 1rem; gap: 0.8rem; }
     .mc-comment-card { padding: 0.6rem; }
     .mc-comment-avatar { width: 28px; height: 28px; }
     .mc-comment-username { font-size: 0.8rem; max-width: 120px; }
     .mc-comment-text { font-size: 0.8rem; }
     .mc-comment-likes { font-size: 0.75rem; }

     .mc-control {
        top: calc(var(--mc-small-mobile-poster-height) / 2);
        width: 32px; height: 32px; font-size: 18px;
    }
     .mc-control.mc-prev { left: 5px; }
     .mc-control.mc-next { right: 5px; }
     .mc-ratings-grid { gap: 8px; }
     .mc-rating-value, .mc-star { font-size: 0.95rem; }
}
