import { useNavigate } from "react-router-dom";

function CTA() {

  const navigate = useNavigate();

  return (
    <section className="cta">

      <p className="cta-label">
        YOUR NEXT FAVOURITE AWAITS
      </p>

      <h2>
        Ready for your next delicious
        <br />
        discovery?
      </h2>

      <p className="cta-text">
        Explore our menu and find something worth knowing.
      </p>

      <button
        className="cta-button"
        onClick={() => navigate("/menu")}
      >
        Explore Menu
      </button>

    </section>
  );
}

export default CTA;