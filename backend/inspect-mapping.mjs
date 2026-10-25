import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);

const restaurants = await mongoose.connection
  .collection("restaurants")
  .find({})
  .project({ name: 1, owner: 1, isActive: 1 })
  .toArray();

console.log("\n--- TARGET RESTAURANTS ---");
console.log(JSON.stringify(
  restaurants.filter(r =>
    /6 Ballygunge Place|PechuMechhu/i.test(r.name)
  ),
  null,
  2
));

const orders = await mongoose.connection
  .collection("orders")
  .find({})
  .sort({ _id: -1 })
  .limit(3)
  .project({
    restaurant: 1,
    restaurantId: 1,
    customer: 1,
    orderStatus: 1,
    totalAmount: 1
  })
  .toArray();

console.log("\n--- LATEST 3 ORDERS ---");
console.log(JSON.stringify(orders, null, 2));

await mongoose.disconnect();
