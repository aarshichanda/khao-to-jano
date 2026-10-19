import { useState } from "react";
import FoodCard from "./FoodCard";

import paneerTikkaImage from "../../images/Food card/Paneer Tikka.webp";
import chickenBiryaniImage from "../../images/Food card/Chicken Biryani.webp";
import masalaDosaImage from "../../images/Food card/Masala Dosa.webp";
import paneerButterMasalaImage from "../../images/Food card/Paneer Butter Masala.webp";
import gulabJamunImage from "../../images/Food card/Gulab jamun.webp";
import chickenButterMasalaImage from "../../images/Food card/Chicken Butter Masala.webp";
import hakkaNoodlesImage from "../../images/Food card/Hakka Noodles.webp";
import chholeBhatureImage from "../../images/Food card/Chhole Bhature.webp";

function Menu() {
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const categories = [
    "All",
    "Starters",
    "North Indian",
    "South Indian",
    "Indo-Chinese",
    "Biryani",
    "Desserts",
  ];

  const filteredDishes =
    selectedCategory === "All"
      ? dishes
      : dishes.filter(
          (dish) => dish.category === selectedCategory
        );

  return (
    <main className="menu-page">

      {/* Menu Header */}
      <section className="menu-header">
        <p className="menu-label">OUR MENU</p>

        <h1>Discover something delicious</h1>

        <p className="menu-description">
          Explore flavours from across India and beyond,
          prepared to make every meal worth knowing.
        </p>
      </section>

      {/* Category Filters */}
      <section className="menu-filters">
        {categories.map((category) => (
          <button
            key={category}
            className={
              selectedCategory === category
                ? "menu-filter active"
                : "menu-filter"
            }
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </section>

      {/* Food Grid */}
      <section className="menu-food-section">
        <div className="menu-food-grid">

          {filteredDishes.map((dish) => (
            <FoodCard
              key={dish.name}
              name={dish.name}
              image={dish.image}
              description={dish.description}
              price={dish.price}
            />
          ))}

        </div>
      </section>

    </main>
  );
}

export default Menu;