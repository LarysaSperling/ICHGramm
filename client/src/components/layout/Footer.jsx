import "../../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <nav className="footer-links">
        <a href="/">Home</a>
        <a href="/search">Search</a>
        <a href="/explore">Explore</a>
        <a href="/messages">Messages</a>
        <a href="/notifications">Notifications</a>
        <a href="/create">Create</a>
      </nav>

      <p className="footer-copy">© 2026 ICHGramm</p>
    </footer>
  );
};

export default Footer;