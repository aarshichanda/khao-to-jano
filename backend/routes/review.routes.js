import express from 'express';
import Review from '../models/review.model.js';
import Restaurant from '../models/restaurant.model.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Customer feedback systems, star rating aggregations, and restaurant review matrices
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit a new customer rating and review
 *     description: Persists a single review entry and triggers a reactive calculation layer to update the target restaurant's primary rating footprint in real time.
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - customerId
 *               - rating
 *             properties:
 *               restaurantId:
 *                 type: string
 *                 description: Unique 24-character hex ID of the target restaurant document
 *                 example: 65cb1a8b9f1d2c001f4a5678
 *               customerId:
 *                 type: string
 *                 description: Unique 24-character hex ID of the reviewing customer
 *                 example: 65cb1a8b9f1d2c001f4a5111
 *               customerName:
 *                 type: string
 *                 description: Display name of the customer profile
 *                 example: Aarshi Chanda
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Numeric star value assigned by the user (1 to 5 stars)
 *                 example: 5
 *               comment:
 *                 type: string
 *                 description: Explicit text review description written by the customer
 *                 example: "Absolutely delicious food! The presentation was clean and delivery was exceptionally fast."
 *     responses:
 *       201:
 *         description: Review submitted successfully and aggregate analytics recalculated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review submitted and restaurant aggregate rating updated successfully!
 *                 updatedRestaurantRating:
 *                   type: number
 *                   example: 4.5
 *       400:
 *         description: Bad request - Missing mandatory values or user already has a pending evaluation profile
 *       500:
 *         description: Internal runtime server fault
 */
// ROUTE 1: Submit a new review and recalculate restaurant average rating
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

    // 2.  MATH LOOP: Fetch all reviews for this specific restaurant to recalculate aggregate score
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

/**
 * @swagger
 * /api/reviews/restaurant/{restaurantId}:
 *   get:
 *     summary: Fetch all verified customer reviews for a given restaurant
 *     description: Publicly streams chronological review logs, comments, and star distributions for a target kitchen.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique 24-character hexadecimal MongoDB ObjectId of the target restaurant
 *         example: 65cb1a8b9f1d2c001f4a5678
 *     responses:
 *       200:
 *         description: Complete history of restaurant review documents fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error while retrieving data feed.
 */
// ROUTE 2: Fetch all reviews for a specific restaurant
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
