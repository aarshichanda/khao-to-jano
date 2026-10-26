import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";

function RestaurantDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Read the Vite dynamic deployment variable cleanly
      const baseUrl = import.meta.env.VITE_API_URL || "https://khao-to-jano-api.onrender.com";

      const res = await fetch(`${baseUrl}/api/restaurants/${id}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error("Failed to load profile");
      }

      const activeData = result.data || result.restaurant || result;

      if (!activeData || !activeData.name || !activeData._id) {
        throw new Error("Restaurant information or ID is missing.");
      }

      setRestaurant(activeData);

      const resReviews = await fetch(`${baseUrl}/api/reviews/${id}`);

      if (resReviews.ok) {
        const revResult = await resReviews.json();

        if (revResult.success && revResult.data) {
          setReviews(revResult.data);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Sync failure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddToCartClick = (dish) => {
    const restaurantId = restaurant?._id?.toString();
    const dishId = dish?._id?.toString();

    if (!restaurantId || !dishId) {
      alert("Restaurant or dish ID is missing. Please refresh the page.");
      return;
    }

    if (dish.isAvailable === false) {
      alert("Sorry, this dish is currently unavailable.");
      return;
    }

    dispatch(
      addToCart({
        dishId,
        restaurantId,
        restaurantName: restaurant.name,
        name: dish.name,
        price: Number(dish.price),
        description: dish.description || "",
      })
    );

    alert(`${dish.name} added to cart!`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      setSubmitMessage("");
      const baseUrl = import.meta.env.VITE_API_URL || "";

      const response = await fetch(`${baseUrl}/api/reviews/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: id,
          userId: "6aca575d5673cab2ac285452",
          username: "KTJ Test Customer",
          rating: Number(rating),
          comment: comment.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(true);
        setSubmitMessage("Review shared!");
        setComment("");
        await fetchData();
      } else {
        setSubmitSuccess(false);
        setSubmitMessage(result.message || "Submission failed.");
      }
    } catch (err) {
      console.error(err);
      setSubmitSuccess(false);
      setSubmitMessage("Connection error.");
    }
  };

  if (loading) {
    return (
      <div className="rest-loading">
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="rest-error">
        <h1>Profile Sync Error</h1>
        <p>{error}</p>
        <Link to="/restaurants">← Back</Link>
      </div>
    );
  }

  return (
    <main className="restaurant-details-wrapper">
      <header className="restaurant-hero-banner">
        <div className="restaurant-hero-img-box">
          {restaurant.image ? (
            <img
              src={restaurant.image}
              alt={`${restaurant.name} restaurant`}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="restaurant-image-placeholder">
              Image coming soon
            </div>
          )}
        </div>

        <div className="restaurant-hero-content-box">
          <Link to="/restaurants" className="back-listing-link">
            ← Back to Listings
          </Link>

          <h1 className="restaurant-title-text">{restaurant.name}</h1>

          <p className="restaurant-cuisine-tags">
            {restaurant.cuisine?.join(" • ")}
          </p>

          <div className="restaurant-metrics-row">
            <span className="rating-span">
              ⭐ {restaurant.rating} / 5.0
            </span>
            <span className="time-span">
              ⏱️ {restaurant.deliveryTime}
            </span>
            <span className="address-span">
              📍 {restaurant.address}
            </span>
          </div>
        </div>
      </header>

      <section className="menu-display-section">
        <h2 className="section-title">Our Menu</h2>

        <div className="menu-items-grid-container">
          {restaurant.menu?.map((dish, idx) => (
            <article
              key={dish._id || idx}
              className="dish-menu-card"
            >
              <div className="dish-info-block">
                <h3>{dish.name}</h3>
                <p>{dish.description}</p>
              </div>

              <div className="dish-action-row">
                <span className="price-tag-span">
                  ₹{dish.price}
                </span>

                <div className="button-group-div">
                  <Link
                    to={`/food/${encodeURIComponent(dish.name)}?restaurantId=${restaurant._id}&dishId=${dish._id || idx}`}
                    className="view-dish-btn"
                  >
                    View
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleAddToCartClick(dish)}
                    className="add-to-cart-btn"
                    disabled={dish.isAvailable === false}
                  >
                    {dish.isAvailable === false
                      ? "Unavailable"
                      : "Add to Cart"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="feedback-integration-row">
        <div className="submit-review-card-form">
          <h3>Share Your Experience</h3>

          <form onSubmit={handleReviewSubmit}>
            <div className="form-input-group">
              <label>Rating</label>

              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                <option value={4}>⭐⭐⭐⭐ Very Good</option>
                <option value={3}>⭐⭐⭐ Average</option>
                <option value={2}>⭐⭐ Fair</option>
                <option value={1}>⭐ Poor</option>
              </select>
            </div>

            <div className="form-input-group">
              <label>Review</label>

              <textarea
                placeholder="How was the food flavor or delivery speed?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="submit-feedback-action-btn"
            >
              Submit Feedback
            </button>

            {submitMessage && (
              <p className={submitSuccess ? "msg-ok" : "msg-fail"}>
                {submitMessage}
              </p>
            )}
          </form>
        </div>

        <div className="reviews-feed-stream-display">
          <h3>Customer Reviews ({reviews.length})</h3>

          <div className="reviews-scroller-box">
            {reviews.length === 0 ? (
              <p className="no-reviews-msg">
                No customer feedback shared yet.
              </p>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="user-review-bubble-card"
                >
                  <div className="review-card-header">
                    <span className="user-name-label">
                      {rev.username}
                    </span>
                    <span className="stars-label">
                      {"⭐".repeat(rev.rating)}
                    </span>
                  </div>

                  <p className="review-comment-text">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default RestaurantDetails;
