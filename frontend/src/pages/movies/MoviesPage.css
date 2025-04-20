/* MoviesPage.css */

.movie-archive-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
  border-radius: 5px;
}

.archive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #2a2d36;
  padding-bottom: 15px;
}

.archive-title {
  font-size: 1.8rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  font-weight: 600;
}

.title-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.movie-count {
  font-size: 0.9rem;
  color: #a0a0a0;
  font-weight: 500;
  white-space: nowrap;
}

.results-area {
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #a0a0a0;
  font-size: 1.1rem;
}

/* --- FilterControls --- */
.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px 10px;
  align-items: center;
  padding: 15px;
  background-color: #121212;
  border-radius: 8px;
  margin-bottom: 25px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
}

.filter-group label {
  font-size: 0.9rem;
  color: #a0a0a0;
  white-space: nowrap;
  font-weight: 500;
}

.filter-input,
.filter-select {
  padding: 8px 10px;
  background-color: #1e1e1e;
  border: 1px solid var(--border-color);
  color: #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 38px;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s ease;
  width: 100%;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #00e054; /* Changed from #4d7cfe to #00e054 */
  box-shadow: 0 0 0 2px rgba(0, 224, 84, 0.2); /* Changed from rgba(77, 124, 254, 0.2) */
}

.filter-input.year {
  min-width: 110px;
}
.filter-input.rating {
  min-width: 150px;
}
.filter-select.category {
  min-width: 180px;
}

.filter-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  cursor: pointer;
}

.filter-input[type="number"]::-webkit-inner-spin-button,
.filter-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.filter-input[type="number"] {
  -moz-appearance: textfield;
}

.filter-apply-button {
  padding: 8px 15px;
  background-color: #00e054; /* Changed from #4d7cfe to #00e054 */
  color: #000000;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s ease;
  font-size: 0.9rem;
  min-height: 38px;
  box-sizing: border-box;
  outline: none;
  flex-grow: 0;
  flex-shrink: 0;
  margin-left: auto;
  min-width: 90px;
  justify-content: center;
}

.filter-apply-button:hover {
  background-color: #00c048; /* Slightly darker green on hover */
}

.filter-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

/* --- MovieCard --- */
.mp-movie-card {
  background-color: #121212;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  border: 1px solid var(--border-color);
  margin-bottom: 0;
  color: #e0e0e0;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 100%;
}

.mp-movie-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.mp-movie-card-poster-container {
  position: relative;
  width: 150px;
  aspect-ratio: 2/3;
  flex-shrink: 0;
  background-color: #15171c;
}

.mp-movie-card-poster {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mp-movie-card-favorite-btn {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(15, 17, 23, 0.85);
  color: #e0e0e0;
  border: 1px solid #3a3f4d;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.mp-movie-card:hover .mp-movie-card-favorite-btn {
  opacity: 1;
}

.mp-movie-card-favorite-btn:hover {
  background-color: rgba(15, 17, 23, 0.95);
  border-color: #00e054; /* Changed from #4d7cfe to #00e054 */
}

.mp-movie-card-favorite-btn svg {
  width: 1em;
  height: 1em;
  color: #ff5e7d;
}

.mp-movie-card-rating-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ffc107;
  color: #111;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.mp-movie-card-info {
  padding: 15px;
  flex-grow: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #3a3f4d #1e2128;
}

.mp-movie-card-info::-webkit-scrollbar {
  width: 6px;
}

.mp-movie-card-info::-webkit-scrollbar-track {
  background: #1e2128;
  border-radius: 3px;
}

.mp-movie-card-info::-webkit-scrollbar-thumb {
  background-color: #3a3f4d;
  border-radius: 3px;
}

.mp-movie-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mp-movie-card-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  line-height: 1.3;
}

.mp-movie-card-ratings {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 15px;
}

.rating-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #272a34;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.imdb-rating {
  background-color: #ffc107;
  color: #111;
  font-weight: 900;
}

.ltb-rating {
  background-color: #ff4545;
  color: #fff;
  font-weight: 900;
}

.miq-rating {
  background-color: #0d1b2a;
  color: #fff;
  font-weight: 900;
}

.miq-rating label {
  color: #00e054;
  font-weight: 900;
}

.mp-movie-card-meta {
  font-size: 0.85rem;
  color: #a0a0a0;
  margin-top: 15px;
  border-top: 1px solid var(--border-color);
  padding-top: 10px;
}

.mp-movie-card-meta p {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.4;
}

.mp-movie-card-meta span {
  color: #c0c0c0;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.mp-movie-card-meta svg {
  width: 12px;
  height: 12px;
  fill: #a0a0a0;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Responsive layout for various screen sizes */
@media (max-width: 1240px) {
  .movie-archive-container {
    max-width: 100%;
    padding: 15px;
  }
}

@media (max-width: 900px) {
  .filter-controls {
    flex-direction: column;
    gap: 12px;
    padding: 15px;
  }

  .filter-group {
    width: 100%;
  }

  .filter-apply-button {
    margin-left: 0;
    width: 100%;
  }
}

@media (max-width: 600px) {
  .archive-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .movie-count {
    margin-left: 2px;
  }

  .mp-movie-card {
    max-height: none;
    flex-direction: column;
  }

  .mp-movie-card-poster-container {
    width: 100%;
    aspect-ratio: 16/9;
  }

  .mp-movie-card-info {
    padding: 12px;
  }

  .mp-movie-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .mp-movie-card-ratings {
    margin-top: 8px;
    flex-wrap: wrap;
  }
}

/* Tablet layout */
@media (min-width: 601px) and (max-width: 900px) {
  .mp-movie-card-poster-container {
    width: 120px;
  }
}
