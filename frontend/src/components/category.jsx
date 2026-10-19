import starterImage from "../../images/category image/Starter.webp";
import northIndianImage from "../../images/category image/North Indian.webp";
import southIndianImage from "../../images/category image/South Indian.webp";
import indoChineseImage from "../../images/category image/Indo Chinese.webp";
import biryaniImage from "../../images/category image/Biryani.webp";
import dessertsImage from "../../images/category image/Desserts.webp";

function CategorySection() {
  const categories = [
    {
      name: "Starters",
      image: starterImage,
    },
    {
      name: "North Indian",
      image: northIndianImage,
    },
    {
      name: "South Indian",
      image: southIndianImage,
    },
    {
      name: "Indo-Chinese",
      image: indoChineseImage,
    },
    {
      name: "Biryani",
      image: biryaniImage,
    },
    {
      name: "Desserts",
      image: dessertsImage,
    },
  ];

  return (
    <section className="category-section">

      <div className="category-heading">
        <p>EXPLORE OUR MENU</p>

        <h2>
          Something delicious for every craving
        </h2>

        <span>
          Discover flavours from across India and beyond.
        </span>
      </div>

      <div className="category-grid">

        {categories.map((category) => (
          <div className="category-card" key={category.name}>

            <img
              src={category.image}
              alt={category.name}
            />

            <h3>{category.name}</h3>

          </div>
        ))}

      </div>

    </section>
  );
}

export default CategorySection;