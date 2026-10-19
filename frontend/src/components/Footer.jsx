import brandLogo from "../../images/logos/brand logo.png";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-main">

        {/* Brand */}
        <div className="footer-brand">
          <img
            src={brandLogo}
            alt="Khao To Jano - एक स्वाद की कहानी"
          />

          <p>
            A taste worth knowing.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h3>Quick Links</h3>

          <a href="/">Home</a>
          <a href="/menu">Menu</a>
          <a href="/orders">My Orders</a>
          <a href="/login">Login</a>
        </div>

        {/* Customer */}
        <div className="footer-column">
          <h3>Customer</h3>

          <a href="/cart">Cart</a>
          <a href="/orders">My Orders</a>
          <a href="/register">Create Account</a>
        </div>

        {/* Social Media */}
        <div className="footer-column footer-social">
          <h3>Follow Us</h3>

          <div className="social-icons">

            {/* Instagram */}
            <a href="#" aria-label="Instagram">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="5"
                />

                <circle
                  cx="12"
                  cy="12"
                  r="4"
                />

                <circle
                  cx="17.5"
                  cy="6.5"
                  r="1"
                  className="social-dot"
                />
              </svg>
            </a>

            {/* Facebook */}
            <a href="#" aria-label="Facebook">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M14 8h3V4h-3c-3.3 0-5 1.9-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1z"
                />
              </svg>
            </a>

            {/* YouTube */}
            <a href="#" aria-label="YouTube">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2C1.9 9 1.9 12 1.9 12s0 3 .5 4.8a2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2c.5-1.8.5-4.8.5-4.8s0-3-.5-4.8z"
                />

                <path
                  d="M10 15.5 15 12l-5-3.5v7z"
                  className="social-play"
                />
              </svg>
            </a>

          </div>
        </div>

        {/* Contact */}
        <div className="footer-column">
          <h3>Contact</h3>

          <p>Email: hello@khaotojano.com</p>
          <p>Phone: +91 00000 00000</p>
          <p>India</p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 Khao To Jano. All rights reserved.</p>
        <p>एक स्वाद की कहानी</p>
      </div>

    </footer>
  );
}

export default Footer;