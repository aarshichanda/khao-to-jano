
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/OwnerRegister.css";
import { API_URL } from "../api";

function OwnerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    applicantName: "",
    email: "",
    phone: "",
    restaurantName: "",
    restaurantAddress: "",
    cuisine: "",
  });

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setIsSuccess(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/owner-applications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicantName: formData.applicantName.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            restaurantName: formData.restaurantName.trim(),
            restaurantAddress: formData.restaurantAddress.trim(),
            cuisine: formData.cuisine
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit your application."
        );
      }

      setIsSuccess(true);
      setMessage(
        "Application submitted successfully. Your application is pending review."
      );

      setFormData({
        applicantName: "",
        email: "",
        phone: "",
        restaurantName: "",
        restaurantAddress: "",
        cuisine: "",
      });
    } catch (error) {
      setIsSuccess(false);
      setMessage(
        error instanceof TypeError
          ? "Could not connect to the backend. Check that the server is running."
          : error.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="owner-register-page">
      <div className="owner-register-container">
        <button
          type="button"
          className="owner-register-back"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

        <header className="owner-register-header">
          <p className="owner-register-eyebrow">
            Khao To Jano Partners
          </p>
          <h1>Become a Restaurant Partner</h1>
          <p className="owner-register-description">
            Bring your food and your story to Khao To Jano.
            Submit your restaurant details for review. Access is
            granted only after approval and activation.
          </p>
        </header>

        <section className="owner-register-card">
          <h2 className="owner-register-section-title">
            Application Details
          </h2>

          <form
            className="owner-register-form"
            onSubmit={handleSubmit}
          >
            <div className="owner-register-field">
              <label htmlFor="applicantName">Your Full Name *</label>
              <input
                id="applicantName"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>

            <div className="owner-register-field">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                required
              />
            </div>

            <div className="owner-register-field">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                autoComplete="tel"
                maxLength={20}
                required
              />
            </div>

            <div className="owner-register-field">
              <label htmlFor="restaurantName">Restaurant Name *</label>
              <input
                id="restaurantName"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleChange}
                placeholder="Your restaurant's name"
                maxLength={150}
                required
              />
            </div>

            <div className="owner-register-field full-width">
              <label htmlFor="restaurantAddress">
                Restaurant Address *
              </label>
              <textarea
                id="restaurantAddress"
                name="restaurantAddress"
                value={formData.restaurantAddress}
                onChange={handleChange}
                placeholder="Enter the complete restaurant address"
                maxLength={500}
                required
              />
            </div>

            <div className="owner-register-field full-width">
              <label htmlFor="cuisine">Cuisine Types</label>
              <input
                id="cuisine"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleChange}
                placeholder="e.g. Bengali, Mughlai, Indian"
              />
              <p className="owner-register-hint">
                Separate multiple cuisines with commas.
              </p>
            </div>

            {message && (
              <p
                role="status"
                className={`owner-register-message ${
                  isSuccess ? "success" : "error"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              className="owner-register-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Submitting Application..."
                : "Submit Owner Application →"}
            </button>
          </form>
        </section>

        <aside className="owner-register-note">
          <span aria-hidden="true">ⓘ</span>
          <div>
            <strong>What happens next?</strong>
            <br />
            Our team will review your application. Submitting this
            form does not automatically grant restaurant management
            access.
          </div>
        </aside>
      </div>
    </main>
  );
}

export default OwnerRegister;
