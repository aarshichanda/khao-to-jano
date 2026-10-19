import { useNavigate } from "react-router-dom";
import brandLogo from "../../images/logos/brand logo.png";

function OurStory() {

  const navigate = useNavigate();

  return (
    <section className="our-story">

      <div className="our-story-logo">
        <img
          src={brandLogo}
          alt="Khao To Jano - एक स्वाद की कहानी"
        />
      </div>

      <div className="our-story-content">

        <p className="our-story-label">
          OUR STORY
        </p>

        <h2>
          एक स्वाद की कहानी
        </h2>

        <p className="our-story-intro">
          Every dish has a story. Every flavour carries a memory.
        </p>

        <p>
          At Khao To Jano, we believe food is more than something
          we eat. It brings people together, celebrates traditions
          and turns simple moments into memories.
        </p>

        <p>
          From familiar favourites to flavours worth discovering,
          every dish is prepared to make your meal a little more
          memorable.
        </p>

        <button
          className="story-button"
          onClick={() => navigate("/our-story")}
        >
          Discover Our Story
        </button>

      </div>

    </section>
  );
}

export default OurStory;