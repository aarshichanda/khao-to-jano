import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (formData.phone.length < 10) {
      newErrors.phone =
        "Please enter a valid phone number.";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    return newErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    // Backend registration will be connected here later.
  };

  return (
    <main className="register-page">

      <section className="register-container">

        <div className="register-brand">
          <p className="register-label">
            JOIN KHAO TO JANO
          </p>

          <h1>Create Your Account</h1>

          <p>
            Create an account and make every food discovery
            worth knowing.
          </p>
        </div>

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label htmlFor="name">
              Full Name
            </label>

            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />

            {errors.name && (
              <span className="form-error">
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
            />

            {errors.email && (
              <span className="form-error">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number
            </label>

            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />

            {errors.phone && (
              <span className="form-error">
                {errors.phone}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
            />

            {errors.password && (
              <span className="form-error">
                {errors.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />

            {errors.confirmPassword && (
              <span className="form-error">
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="register-button"
          >
            Create Account
          </button>

        </form>

        <div className="register-divider">
          <span>OR</span>
        </div>

        <div className="register-login">

          <p>
            Already have an account?
          </p>

          <button
            type="button"
            className="login-link-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

        </div>

        <button
          type="button"
          className="register-home-button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </section>

    </main>
  );
}

export default Register;