import React, { ReactNode } from "react";

interface MovieSectionProps {
  title: string;
  link?: string;
  children: ReactNode;
}

const MovieSection: React.FC<MovieSectionProps> = ({ title, link, children }) => {
  return (
    <section>
      <div className="movie-section-header">
        <h2>{title}</h2>
        {link && (
          <a href={link} className="movie-see-all">
            See All
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        )}
      </div>
      <div className="movie-grid">
        {children}
      </div>
    </section>
  );
};

export default MovieSection;