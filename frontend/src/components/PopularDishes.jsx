import FoodCard from "./FoodCard";

import paneerTikkaImage from "../../images/Food card/Paneer Tikka.webp";
import chickenBiryaniImage from "../../images/Food card/Chicken Biryani.webp";
import masalaDosaImage from "../../images/Food card/Masala Dosa.webp";
import paneerButterMasalaImage from "../../images/Food card/Paneer Butter Masala.webp";
import gulabJamunImage from "../../images/Food card/Gulab jamun.webp";
import chickenButterMasalaImage from "../../images/Food card/Chicken Butter Masala.webp";
import hakkaNoodlesImage from "../../images/Food card/Hakka Noodles.webp";
import chholeBhatureImage from "../../images/Food card/Chhole Bhature.webp";

function PopularDishes() {

  const dishes = [
    {
      name: "Paneer Tikka",
      image: paneerTikkaImage,
      description: "Smoky, spiced paneer grilled to perfection.",
      price: 249,
    },
    {
      name: "Chicken Biryani",
      image: chickenBiryaniImage,
      description: "Fragrant rice layered with flavourful chicken.",
      price: 299,
    },
    {
      name: "Masala Dosa",
      image: masalaDosaImage,
      description: "Crispy dosa served with a delicious spiced filling.",
      price: 179,
    },
    {
      name: "Paneer Butter Masala",
      image: paneerButterMasalaImage,
      description: "Creamy tomato gravy with tender paneer.",
      price: 269,
    },
    {
      name: "Gulab Jamun",
      image: gulabJamunImage,
      description: "Soft, syrup-soaked Indian sweet.",
      price: 129,
    },
    {
      name: "Chicken Butter Masala",
      image: chickenButterMasalaImage,
      description: "Tender chicken in a rich, creamy gravy.",
      price: 289,
    },
    {
      name: "Hakka Noodles",
      image: hakkaNoodlesImage,
      description: "Wok-tossed noodles with aromatic vegetables.",
      price: 199,
    },
    {
      name: "Chhole Bhature",
      image: chholeBhatureImage,
      description: "Spiced chickpeas paired with fluffy bhature.",
      price: 189,
    },
  ];

  return (
    <section className="popular-dishes">

      <div className="popular-heading">

        <p>POPULAR DISHES</p>

        <h2>
          Flavours everyone loves
        </h2>

        <span>
          A few favourites to get you started.
        </span>

      </div>

      <div className="food-card-grid">

        {dishes.map((dish) => (
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
  );
}

export default PopularDishes;