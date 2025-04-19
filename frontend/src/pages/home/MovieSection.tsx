import React, { ReactNode } from "react";

interface MovieSectionProps {
  title: string;
  link?: string;
  children: ReactNode;
}

const MovieSection: React.FC<MovieSectionProps> = ({ title, children }) => {
  return (
    <section>
      <div className="movie-section-header">
        <h2>{title}</h2>
        
      </div>
      <div className="movie-grid">
        {children}
      </div>
    </section>
  );
};

export default MovieSection;
