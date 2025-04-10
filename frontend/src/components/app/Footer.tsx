const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <p className="brand">Mov<span className="accent">i</span>e<span className="accent">Q</span></p>
          <p>The social platform for sharing your taste in film.</p>
        </div>
        <div className="footer-section">
          <h4>Navigation</h4>
          <ul>
            <li>Home</li>
            <li>Films</li>
            <li>Lists</li>
            <li>Reviews</li>
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
            <span>Twitter</span>
            <span>Facebook</span>
            <span>Instagram</span>
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