import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { addToCart } from "../redux/cartSlice"; // FIXED: Points exactly to your true Redux folder path

import paneerTikkaImage from "../../images/Food card/Paneer Tikka.webp";
import chickenBiryaniImage from "../../images/Food card/Chicken Biryani.webp";
import masalaDosaImage from "../../images/Food card/Masala Dosa.webp";
import paneerButterMasalaImage from "../../images/Food card/Paneer Butter Masala.webp";
import gulabJamunImage from "../../images/Food card/Gulab jamun.webp";
import chickenButterMasalaImage from "../../images/Food card/Chicken Butter Masala.webp";
import hakkaNoodlesImage from "../../images/Food card/Hakka Noodles.webp";
import chholeBhatureImage from "../../images/Food card/Chhole Bhature.webp";

function FoodDetails() {
  const { name = "" } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const restaurantId = searchParams.get("restaurantId");
  const dishId = searchParams.get("dishId");

  const hasRestaurantDish = Boolean(restaurantId && dishId);

  const [restaurantDish, setRestaurantDish] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(hasRestaurantDish);
  const [error, setError] = useState("");

  const dishes = [
    {
      name: "Paneer Tikka",
      image: paneerTikkaImage,
      description: "Smoky, spiced paneer grilled to perfection.",
      price: 249,
      category: "Starters",
    },
    {
      name: "Chicken Biryani",
      image: chickenBiryaniImage,
      description: "Fragrant rice layered with flavourful chicken.",
      price: 299,
      category: "Biryani",
    },
    {
      name: "Masala Dosa",
      image: masalaDosaImage,
      description: "Crispy dosa served with a delicious spiced filling.",
      price: 179,
      category: "South Indian",
    },
    {
      name: "Paneer Butter Masala",
      image: paneerButterMasalaImage,
      description: "Creamy tomato gravy with tender paneer.",
      price: 269,
      category: "North Indian",
    },
    {
      name: "Gulab Jamun",
      image: gulabJamunImage,
      description: "Soft, syrup-soaked Indian sweet.",
      price: 129,
      category: "Desserts",
    },
    {
      name: "Chicken Butter Masala",
      image: chickenButterMasalaImage,
      description: "Tender chicken in a rich, creamy gravy.",
      price: 289,
      category: "North Indian",
    },
    {
      name: "Hakka Noodles",
      image: hakkaNoodlesImage,
      description: "Wok-tossed noodles with aromatic vegetables.",
      price: 199,
      category: "Indo-Chinese",
    },
    {
      name: "Chhole Bhature",
      image: chholeBhatureImage,
      description: "Spiced chickpeas paired with fluffy bhature.",
      price: 189,
      category: "North Indian",
    },
  ];

  useEffect(() => {
    if (!hasRestaurantDish) {
      setRestaurantDish(null);
      setRestaurantName("");
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchRestaurantDish = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/restaurants/${restaurantId}`,
          { signal: controller.signal }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load restaurant");
        }

        const restaurant = result.data;

        const selectedDish = restaurant.menu?.find(
          (item) => String(item._id) === String(dishId)
        );

        if (!selectedDish || selectedDish.isAvailable === false) {
          throw new Error("This dish is unavailable.");
        }

        setRestaurantDish(selectedDish);
        setRestaurantName(restaurant.name);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load dish");
          setRestaurantDish(null);
          setRestaurantName("");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRestaurantDish();

    return () => controller.abort();
  }, [restaurantId, dishId, hasRestaurantDish]);

  const staticDish = dishes.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );

 const dish = hasRestaurantDish
  ? {
      ...restaurantDish,
      image:
        restaurantDish?.image ||
        dishes.find(
          (item) =>
            item.name.toLowerCase() ===
            restaurantDish?.name?.toLowerCase()
        )?.image ||
        "",
    }
  : staticDish;

  const handleAddToCart = () => {
    if (hasRestaurantDish && restaurantDish) {
      dispatch(
        addToCart({
          name: restaurantDish.name,
          image: restaurantDish.image || "",
          description: restaurantDish.description || "",
          price: Number(restaurantDish.price),
          restaurantId,
          restaurantName,
          dishId,
        })
      );
      alert(`${restaurantDish.name} added to cart!`);
    } else if (staticDish) {
      dispatch(
        addToCart({
          name: staticDish.name,
          image: "", 
          description: staticDish.description || "",
          price: Number(staticDish.price),
          restaurantId: "static-menu",
          restaurantName: "Promotional Offer",
          dishId: `static-${staticDish.name}`,
        })
      );
      alert(`${staticDish.name} added to cart!`);
    } else {
      navigate("/restaurants");
    }
  };

  if (loading) {
    return (
      <main className="food-details-page">
        <section className="food-not-found">
          <p className="food-details-label">FOOD DETAILS</p>
          <h1>Loading dish...</h1>
        </section>
      </main>
    );
  }

  if (error || !dish) {
    return (
      <main className="food-details-page">
        <section className="food-not-found">
          <p className="food-details-label">FOOD DETAILS</p>
          <h1>{error || "Dish not found"}</h1>
          <p>We could not find the dish you are looking for.</p>

          <button
            className="food-back-button"
            onClick={() =>
              navigate(
                restaurantId ? `/restaurants/${restaurantId}` : "/menu"
              )
            }
          >
            {restaurantId ? "Back to Restaurant" : "Back to Menu"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="food-details-page">
      <section className="food-details-container">
        <div className="food-details-image">
          {dish.image ? (
            <img src={dish.image} alt={dish.name} />
          ) : (
            <div className="food-image-placeholder">
              <p>{dish.name}</p>
            </div>
          )}
        </div>

        <div className="food-details-content">
          <p className="food-details-label">
            {hasRestaurantDish ? restaurantName : dish.category}
          </p>

          <h1>{dish.name}</h1>

          <p className="food-details-description">
            {dish.description || "No description available yet."}
          </p>

          <div className="food-details-price">₹{dish.price}</div>

          <button
            className="food-add-button"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>

          <button
            className="food-back-button"
            onClick={() =>
              navigate(
                restaurantId ? `/restaurants/${restaurantId}` : "/menu"
              )
            }
          >
            {restaurantId ? "← Back to Restaurant" : "← Back to Menu"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default FoodDetails;
