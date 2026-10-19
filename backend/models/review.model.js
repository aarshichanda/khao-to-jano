import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Review must be linked to a restaurant']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a customer']
  },
  customerName: {
    type: String,
    required: true,
    default: 'Anonymous Customer'
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a star rating'],
    min: [1, 'Rating must be at least 1 star'],
    max: [5, 'Rating cannot exceed 5 stars']
  },
  comment: {
    type: String,
    trim: true,
    maxLength: [500, 'Comment cannot be longer than 500 characters']
  }
}, { timestamps: true });

// 💡 PRE-SAVE METRIC PROTECTION: Prevent a user from spamming multiple reviews on the same restaurant
reviewSchema.index({ restaurantId: 1, customerId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
