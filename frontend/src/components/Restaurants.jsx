
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RestaurantsCard from "./RestaurantsCard";

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  const searchQuery = (searchParams.get("search") || "").trim();
  const locationQuery = (searchParams.get("location") || "").trim();

  useEffect(() => {
    const controller = new AbortController();

    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/restaurants", {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load restaurants"
          );
        }

        setRestaurants(result.data || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load restaurants");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRestaurants();

    return () => controller.abort();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesSearch =
        !query ||
        restaurant.name?.toLowerCase().includes(query) ||
        (restaurant.cuisine || []).some((cuisine) =>
          cuisine.toLowerCase().includes(query)
        ) ||
        (restaurant.menu || []).some(
          (dish) =>
            dish.name?.toLowerCase().includes(query) ||
            dish.description?.toLowerCase().includes(query)
        );

      const matchesLocation =
        !locationQuery ||
        restaurant.address?.toLowerCase().includes(
          locationQuery.toLowerCase()
        );

      return matchesSearch && matchesLocation;
    });
  }, [restaurants, searchQuery, locationQuery]);

  return (
    <main className="restaurants-section">
      <h1>
        {searchQuery ? `Search results for "${searchQuery}"` : "Discover Restaurants"}
      </h1>

      {locationQuery && (
        <p>Delivery location: {locationQuery}</p>
      )}

      {loading && <p>Loading restaurants...</p>}

      {!loading && error && <p role="alert">{error}</p>}

      {!loading && !error && filteredRestaurants.length === 0 && (
        <p>
          {searchQuery || locationQuery
            ? "No matching restaurants found. Try another search."
            : "No restaurants are available right now."}
        </p>
      )}

      {!loading && !error && filteredRestaurants.length > 0 && (
        <>
          {searchQuery && (
            <p>{filteredRestaurants.length} matching restaurant(s) found.</p>
          )}

          <div className="restaurants-grid">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantsCard
                key={restaurant._id}
                restaurant={restaurant}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export default Restaurants;
