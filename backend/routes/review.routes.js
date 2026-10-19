import express from 'express';
import Review from '../models/review.model.js';
import Restaurant from '../models/restaurant.model.js';

const router = express.Router();

// 🚀 ROUTE 1: Submit a new review and recalculate restaurant average rating
router.post('/', async (req, res) => {
  try {
    const { restaurantId, customerId, customerName, rating, comment } = req.body;

    if (!restaurantId || !customerId || !rating) {
      return res.status(400).json({ success: false, message: "Missing required review fields" });
    }

    // 1. Save the new review to the database
    const newReview = new Review({
      restaurantId,
      customerId,
      customerName: customerName || "Khao to Jano Customer",
      rating: Number(rating),
      comment: comment || ""
    });

    await newReview.save();

    // 2. 🧮 MATH LOOP: Fetch all reviews for this specific restaurant to recalculate aggregate score
    const allReviews = await Review.find({ restaurantId });
    
    const totalRatingSum = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const complexAverage = totalRatingSum / allReviews.length;
    const roundedRating = Math.round(complexAverage * 10) / 10; // Round to 1 decimal place (e.g., 4.3★)

    // 3. Persist the newly computed rating directly back onto the target Restaurant profile document
    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: roundedRating
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted and restaurant aggregate rating updated successfully!",
      data: newReview,
      updatedRestaurantRating: roundedRating
    });

  } catch (error) {
    console.error("Review posting backend issue:", error);
    // Handle unique index compound crash smoothly if user already left a review
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already left a review for this restaurant!" });
    }
    return res.status(500).json({ success: false, message: "Internal server processing review failure" });
  }
});

// 🚀 ROUTE 2: Fetch all reviews for a specific restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const reviews = await Review.find({ restaurantId }).sort({ createdAt: -1 }); // Newest reviews first

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error("Fetch reviews route break:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve restaurant reviews" });
  }
});

export default router;
