
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Restaurant from "./models/restaurant.model.js";
import Coupon from "./models/coupon.model.js";

const areas = [
  { name: "Park Street", zip: "700016" },
  { name: "Salt Lake Sector V", zip: "700091" },
  { name: "Behala Chowrasta", zip: "700034" },
  { name: "New Town Action Area 1", zip: "700156" },
  { name: "Gariahat Crossing", zip: "700019" },
  { name: "Bidhannagar", zip: "700067" },
];

const restaurantNames = [
  "The Royal Biryani House",
  "Kolkata Spice Kitchen",
  "The Healthy Green Bowl",
  "Munchies Fast Food Corner",
  "Sweet Bengal Desserts",
  "Flavors of North India",
  "Chinatown Express",
  "The South Indian Tiffin Room",
  "Continental Bistro",
  "Tandoori Junction",
  "Bhojohori Ranna",
  "The Daily Salad Co.",
  "Wok & Roll",
  "Idli Street",
  "The Kebab Factory",
  "Cafe Coffee Lounge",
  "Aminia Express",
  "Arsalan Delights",
  "Peter Cat Replica",
  "Mocambo Vibes",
  "Kusum Rolls",
  "The Burger Club",
  "Pizza Fusion",
  "Dawat-e-Khas",
  "6 Ballygunge Place Mini",
  "Oudh Aromas",
  "Wow Momo Hub",
  "The Dessert Parlour",
  "Healthy Keto Kitchen",
  "Street Food Express",
];

// Restaurant username configuration.
// Account creation and authentication will be implemented separately.
const restaurantAccounts = [
  { restaurantName: "The Royal Biryani House", username: "royalbiryani" },
  { restaurantName: "Kolkata Spice Kitchen", username: "kolkataspice" },
  { restaurantName: "The Healthy Green Bowl", username: "healthygreenbowl" },
  { restaurantName: "Munchies Fast Food Corner", username: "munchies" },
  { restaurantName: "Sweet Bengal Desserts", username: "sweetbengal" },
  { restaurantName: "Flavors of North India", username: "flavorsofnorthindia" },
  { restaurantName: "Chinatown Express", username: "chinatownexpress" },
  { restaurantName: "The South Indian Tiffin Room", username: "southindiantiffin" },
  { restaurantName: "Continental Bistro", username: "continentalbistro" },
  { restaurantName: "Tandoori Junction", username: "tandoorijunction" },
  { restaurantName: "Bhojohori Ranna", username: "bhojohoriranna" },
  { restaurantName: "The Daily Salad Co.", username: "dailysalad" },
  { restaurantName: "Wok & Roll", username: "wokandroll" },
  { restaurantName: "Idli Street", username: "idlistreet" },
  { restaurantName: "The Kebab Factory", username: "kebabfactory" },
  { restaurantName: "Cafe Coffee Lounge", username: "cafecoffeelounge" },
  { restaurantName: "Aminia Express", username: "aminiaexpress" },
  { restaurantName: "Arsalan Delights", username: "arsalandelights" },
  { restaurantName: "Peter Cat Replica", username: "petercatreplica" },
  { restaurantName: "Mocambo Vibes", username: "mocambovibes" },
  { restaurantName: "Kusum Rolls", username: "kusumrolls" },
  { restaurantName: "The Burger Club", username: "theburgerclub" },
  { restaurantName: "Pizza Fusion", username: "pizzafusion" },
  { restaurantName: "Dawat-e-Khas", username: "dawateekhas" },
  { restaurantName: "6 Ballygunge Place Mini", username: "ballygunge6mini" },
  { restaurantName: "Oudh Aromas", username: "oudharomas" },
  { restaurantName: "Wow Momo Hub", username: "wowmomohub" },
  { restaurantName: "The Dessert Parlour", username: "dessertparlour" },
  { restaurantName: "Healthy Keto Kitchen", username: "healthyketokitchen" },
  { restaurantName: "Street Food Express", username: "streetfoodexpress" },
];

const cuisinesList = [
  ["Bengali", "Biryani"],
  ["Bengali", "Indian"],
  ["Healthy", "Vegetarian"],
  ["Fast Food", "Snacks"],
  ["Desserts", "Bakery"],
  ["North Indian", "Mughlai"],
  ["Indo-Chinese", "Noodles"],
  ["South Indian", "Pure Veg"],
  ["Continental", "Italian"],
  ["Mughlai", "Kebabs"],
  ["Bengali", "Traditional"],
  ["Healthy", "Salads"],
  ["Indo-Chinese", "Asian"],
  ["South Indian", "Breakfast"],
  ["Mughlai", "Kebabs"],
  ["Cafe", "Continental"],
  ["Biryani", "Mughlai"],
  ["Biryani", "North Indian"],
  ["Continental", "European"],
  ["Continental", "Cafe"],
  ["Street Food", "Rolls"],
  ["Fast Food", "Burgers"],
  ["Italian", "Pizza"],
  ["Mughlai", "North Indian"],
  ["Bengali", "Regional"],
  ["Awadhi", "Mughlai"],
  ["Fast Food", "Momos"],
  ["Desserts", "Bakery"],
  ["Healthy", "Keto"],
  ["Street Food", "Indian"],
];

// Five menu items per restaurant.
// Each item is [dish name, price in INR].
const menuItems = [
  [["Kolkata Chicken Biryani",249],["Kolkata Mutton Biryani",329],["Egg Chicken Roll",149],["Chicken Chaap",279],["Firni",99]],
  [["Kosha Mangsho",299],["Luchi and Aloor Dum",149],["Doi Katla",249],["Shorshe Ilish",399],["Mishti Doi",89]],
  [["Quinoa Salad Bowl",219],["Grilled Paneer Bowl",229],["Chickpea Protein Bowl",199],["Avocado Toast",249],["Fresh Fruit Bowl",149]],
  [["Crispy Veg Burger",129],["Cheese Loaded Fries",149],["Chicken Sandwich",189],["Peri Peri Chicken Wings",219],["Chocolate Brownie",99]],
  [["Baked Cheesecake",179],["Chocolate Truffle Pastry",119],["Brownie with Ice Cream",159],["Blueberry Muffin",99],["Classic Tiramisu",189]],
  [["Paneer Butter Masala",249],["Dal Makhani",199],["Butter Naan",49],["Chicken Tikka Masala",279],["Jeera Rice",129]],
  [["Chicken Hakka Noodles",199],["Chilli Chicken",249],["Veg Manchurian",189],["Schezwan Fried Rice",199],["Crispy Chilli Baby Corn",179]],
  [["Masala Dosa",149],["Idli Sambar",99],["Medu Vada",89],["Ghee Podi Idli",129],["Filter Coffee",59]],
  [["Margherita Pizza",249],["Farmhouse Pizza",349],["Penne Alfredo",279],["Garlic Bread",119],["Tiramisu Cup",149]],
  [["Chicken Seekh Kebab",249],["Mutton Galouti Kebab",329],["Chicken Tikka",269],["Roomali Roti",39],["Shahi Tukda",129]],
  [["Chingri Malai Curry",329],["Bengali Chicken Curry",229],["Basanti Pulao",169],["Posto Bora",119],["Nolen Gur Payesh",99]],
  [["Mediterranean Salad",199],["Roasted Vegetable Bowl",219],["Grilled Chicken Salad",249],["Sprout and Corn Bowl",159],["Lemon Herb Rice Bowl",179]],
  [["Veg Hakka Noodles",179],["Dragon Chicken",259],["Honey Chilli Potato",169],["Burnt Garlic Fried Rice",189],["Hot and Sour Soup",119]],
  [["Plain Dosa",99],["Onion Uttapam",119],["Pongal",109],["Mini Idli Sambar",99],["Filter Coffee",59]],
  [["Chicken Reshmi Kebab",269],["Mutton Seekh Kebab",329],["Paneer Tikka",229],["Chicken Malai Tikka",279],["Mint Paratha",69]],
  [["Cappuccino",129],["Grilled Veg Sandwich",159],["Chicken Club Sandwich",219],["Chocolate Waffle",179],["Cold Coffee",149]],
  [["Chicken Dum Biryani",249],["Mutton Biryani",329],["Chicken Rezala",269],["Egg Biryani",179],["Chicken Chaap",279]],
  [["Special Chicken Biryani",269],["Mutton Biryani",339],["Chicken Bharta",249],["Chicken Reshmi Butter Masala",289],["Firni",99]],
  [["Fish and Chips",329],["Grilled Chicken Steak",349],["Creamy Mushroom Pasta",279],["Herb Garlic Bread",119],["Chocolate Mousse",149]],
  [["Espresso",89],["Cappuccino",129],["Pesto Pasta",249],["Cheese Garlic Toast",139],["Chocolate Fudge Cake",159]],
  [["Kathi Chicken Roll",149],["Egg Chicken Roll",169],["Paneer Kathi Roll",129],["Double Egg Roll",119],["Masala Lemon Soda",69]],
  [["Classic Veg Burger",129],["Double Cheese Burger",179],["Crispy Chicken Burger",199],["Peri Peri Fries",119],["Chocolate Thick Shake",159]],
  [["Margherita Pizza",249],["Farmhouse Pizza",349],["Paneer Tikka Pizza",329],["Garlic Breadsticks",129],["Chocolate Lava Cake",129]],
  [["Mutton Korma",329],["Chicken Changezi",279],["Paneer Lababdar",249],["Roomali Roti",39],["Shahi Tukda",129]],
  [["Shukto",149],["Kosha Mangsho",299],["Dhokar Dalna",179],["Luchi and Cholar Dal",149],["Bengali Chutney",69]],
  [["Awadhi Chicken Biryani",269],["Mutton Galouti Kebab",329],["Lucknowi Chicken Korma",289],["Sheermal Roti",79],["Shahi Tukda",129]],
  [["Steamed Chicken Momos",129],["Pan Fried Veg Momos",119],["Chicken Cheese Momos",159],["Chilli Garlic Momos",149],["Hot Garlic Sauce",29]],
  [["Chocolate Truffle Cake",179],["Red Velvet Pastry",139],["Blueberry Cheesecake",189],["Chocolate Chip Cookies",79],["Brownie Sundae",169]],
  [["Keto Paneer Bowl",249],["Cauliflower Fried Rice",199],["Grilled Chicken and Vegetables",279],["Avocado Egg Salad",229],["Almond Flour Brownie",149]],
  [["Puchka Platter",79],["Papri Chaat",99],["Ghugni Chaat",89],["Chicken Mughlai Paratha",189],["Jhalmuri",59]],
];

const foodImages = [
  "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80",
];

// Validate seed data before connecting to or modifying the database.
const usernames = restaurantAccounts.map((account) => account.username);

if (
  restaurantNames.length !== 30 ||
  cuisinesList.length !== restaurantNames.length ||
  menuItems.length !== restaurantNames.length ||
  menuItems.some((menu) => menu.length !== 5) ||
  foodImages.length === 0 ||
  restaurantAccounts.length !== restaurantNames.length ||
  new Set(usernames).size !== usernames.length ||
  restaurantAccounts.some(
    (account, index) =>
      account.restaurantName !== restaurantNames[index] ||
      !/^[a-z0-9]+$/.test(account.username)
  )
) {
  throw new Error(
    "Seed data validation failed. Check restaurant names, usernames, cuisines, menus, and images."
  );
}

const generatedRestaurants = restaurantNames.map((name, i) => {
  const chosenArea = areas[i % areas.length];

  const menu = menuItems[i].map(([dishName, price]) => ({
    name: dishName,
    description: `Freshly prepared ${dishName.toLowerCase()}.`,
    price,
    isAvailable: true,
  }));

  // Deterministic values keep seed results consistent across runs.
  const rating = Number((3.8 + (i % 12) * 0.1).toFixed(1));
  const deliveryStart = 20 + (i % 6) * 5;
  const deliveryEnd = deliveryStart + 10;

  return {
    name,
    address: `${chosenArea.name}, Kolkata, West Bengal`,
    image: foodImages[i % foodImages.length],
    cuisine: cuisinesList[i],
    rating,
    deliveryTime: `${deliveryStart}-${deliveryEnd} min`,
    menu,
    isActive: true,
  };
});

const seed = async () => {
  try {
    await connectDB();

    console.log("Seeding 30 restaurants...");

    let createdCount = 0;
    let updatedCount = 0;

    for (const restaurantData of generatedRestaurants) {
      const existingRestaurant = await Restaurant.findOne({
        name: restaurantData.name,
      });

      if (existingRestaurant) {
        // Only update fields explicitly listed here.
        // The existing owner mapping and restaurant ID remain unchanged.
        const { owner, ...restaurantFields } = restaurantData;

        await Restaurant.updateOne(
          { _id: existingRestaurant._id },
          { $set: restaurantFields },
          { runValidators: true }
        );

        updatedCount++;
      } else {
        // New restaurants use the schema's default owner value.
        await Restaurant.create(restaurantData);
        createdCount++;
      }
    }

    console.log(
      `Restaurant seeding complete. Created: ${createdCount}; updated: ${updatedCount}.`
    );

    const testCoupon = await Coupon.findOneAndUpdate(
      { code: "FIRST50" },
      {
        $set: {
          code: "FIRST50",
          discountType: "percentage",
          discountValue: 10,
          minOrderAmount: 100,
          maxDiscountAmount: 50,
          expiryDate: new Date("2027-12-31"),
          isActive: true,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      }
    );

    console.log(`Coupon verified: ${testCoupon.code}`);
    console.log("Restaurant username configuration validated.");
    console.log("No owner accounts or passwords were created or modified.");
    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

seed();
