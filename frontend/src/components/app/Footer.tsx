const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <p className="brand">
            Mov<span className="accent">i</span>e
            <span className="accent">Q</span>
          </p>
          <p>The social platform for sharing your taste in movie.</p>
        </div>
        <div className="footer-section">
          <h4>Navigation</h4>
          <ul className="footer-navigation">
            <li><a href="/home">Home</a></li>
            <li><a href="/movies">Movies</a></li>
            <li><a href="/recommended">Recommended</a></li>
            <li><a href="/news">News</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contacts">Contacts</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Legal</h4>
          <ul>
            <li>Terms of Service</li>
            <li>Privacy Policy</li>
            <li>Cookie Policy</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Connect</h4>
          <div className="social-links">
            <span>
              <img src="/x.svg" alt="X" /> @movieq
            </span>
            <span>
              <img src="/f.svg" alt="Facebook" /> movieq
            </span>
            <span>
              <img src="/i.svg" alt="Instagram" /> @movieq
            </span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} MovieQ. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
