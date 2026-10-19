
import { useNavigate } from "react-router-dom";

function FoodCard({ name, image, description, price }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/food/${encodeURIComponent(name)}`);
  };

  const handleFindRestaurant = () => {
    navigate("/restaurants");
  };

  return (
    <article className="food-card">
      <img
        src={image}
        alt={name}
        className="food-card-image"
        onClick={handleViewDetails}
      />

      <div className="food-card-content">
        <h3
          onClick={handleViewDetails}
          className="food-card-title"
        >
          {name}
        </h3>

        <p>{description}</p>

        <div className="food-card-bottom">
          <span className="food-price">₹{price}</span>

          <button
            type="button"
            className="add-button"
            onClick={handleFindRestaurant}
          >
            Find Restaurant
          </button>
        </div>
      </div>
    </article>
  );
}

export default FoodCard;
