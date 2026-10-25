import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;

console.log("\n--- OWNER ACCOUNT ---");
console.log(JSON.stringify(
  await db.collection("users")
    .find({ _id: new mongoose.Types.ObjectId("6ad78bd771836817830740a3") })
    .project({ username: 1, email: 1, role: 1, roles: 1 })
    .toArray(),
  null, 2
));

console.log("\n--- OWNER APPLICATIONS ---");
console.log(JSON.stringify(
  await db.collection("ownerapplications")
    .find({})
    .sort({ _id: -1 })
    .limit(10)
    .project({ applicantName: 1, email: 1, restaurant: 1, restaurantName: 1, status: 1 })
    .toArray(),
  null, 2
));

await mongoose.disconnect();
