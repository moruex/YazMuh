import '@styles/components/Breadcrumbs.css';

interface BreadcrumbsProps {
  currentPage: string;
  currentPath?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  currentPage,
  currentPath 
}) => {
  return (
    <nav className="breadcrumbs-container" aria-label="breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumb-item">
          <a href="/" className="breadcrumb-link home-link">
            Home
          </a>
        </li>
        <li className="breadcrumb-separator">/</li>
        <li className="breadcrumb-item active">
          <span className="breadcrumb-text">
            {currentPath ? (
              <a href={currentPath} className="breadcrumb-div">
                {currentPage}
              </a>
            ) : (
              currentPage
            )}
          </span>
        </li>
      </ol>
    </nav>
  );
};

export default Breadcrumbs;