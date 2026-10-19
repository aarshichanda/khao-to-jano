
import Restaurant from "../models/restaurant.model.js";

// GET /api/restaurants
export const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true })
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    console.error("Failed to fetch restaurants:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants",
    });
  }
};

// GET /api/restaurants/:id
export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    console.error("Failed to fetch restaurant:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch restaurant",
    });
  }
};
