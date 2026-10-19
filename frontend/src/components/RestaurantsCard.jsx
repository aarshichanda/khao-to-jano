
import { useNavigate } from "react-router-dom";

function RestaurantsCard({ restaurant }) {
  const navigate = useNavigate();

  const handleRestaurantClick = () => {
    navigate(`/restaurants/${restaurant._id}`);
  };

  return (
    <article
      className="restaurant-card"
      onClick={handleRestaurantClick}
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          handleRestaurantClick();
        }
      }}
    >
      <div className="restaurant-card-image-wrapper">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="restaurant-card-image"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="restaurant-image-placeholder">
            Restaurant image coming soon
          </div>
        )}
      </div>

      <div className="restaurant-card-content">
        <h2>{restaurant.name}</h2>

        <p className="restaurant-card-cuisine">
          {restaurant.cuisine?.length
            ? restaurant.cuisine.join(" · ")
            : "Cuisine details coming soon"}
        </p>

        <div className="restaurant-card-meta">
          <span>
            ★ {restaurant.rating ?? "Not rated"}
          </span>
          <span>
            {restaurant.deliveryTime || "Delivery time to be confirmed"}
          </span>
        </div>

        <p className="restaurant-card-address">
          {restaurant.address}
        </p>

        <span className="restaurant-card-link">
          Explore menu →
        </span>
      </div>
    </article>
  );
}

export default RestaurantsCard;
