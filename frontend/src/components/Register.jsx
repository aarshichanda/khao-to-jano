import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";

function Register() {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState("customer");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setServerError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setServerError("");
    setIsSubmitting(true);

    try {
      if (accountType === "customer") {
        const response = await fetch(
          `${API_URL}/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: formData.name.trim(),
              email: formData.email.trim().toLowerCase(),
              phone: formData.phone.trim(),
              password: formData.password,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Registration failed. Please try again."
          );
        }

        navigate("/login", {
          state: {
            registrationSuccess:
              "Customer account created successfully. Please log in.",
            registeredEmail: formData.email.trim().toLowerCase(),
          },
        });

        return;
      }

      // Restaurant owners must apply for approval first.
      // This route must match the existing backend owner-application API.
      const response = await fetch(
        `${API_URL}/owner-applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicantName: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to submit your restaurant owner application."
        );
      }

      navigate("/login", {
        state: {
          registrationSuccess:
            "Your restaurant owner application has been submitted. You can activate your owner access after approval.",
          registeredEmail: formData.email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      if (error instanceof TypeError) {
        setServerError(
          "Could not connect to the server. Check that the backend is running."
        );
      } else {
        setServerError(error.message || "Unable to complete your request.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-container">
        <div className="register-brand">
          <p className="register-label">JOIN KHAO TO JANO</p>

          <h1>Create Your Account</h1>

          <p>
            Discover great food or apply to bring your restaurant to
            Khao To Jano.
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="accountType">I want to</label>
            <select
              id="accountType"
              value={accountType}
              onChange={(event) => {
                setAccountType(event.target.value);
                setServerError("");
                setErrors({});
              }}
              disabled={isSubmitting}
            >
              <option value="customer">Order food as a Customer</option>
              <option value="restaurant_owner">
                Apply as a Restaurant Owner
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
            {errors.name && (
              <span className="form-error">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
            {errors.phone && (
              <span className="form-error">{errors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword}</span>
            )}
          </div>

          {accountType === "restaurant_owner" && (
            <p className="owner-application-notice">
              Restaurant owner access requires admin approval. If you
              already have a customer account, use the same email address.
              Your existing password should remain unchanged during
              activation.
            </p>
          )}

          {serverError && (
            <p className="form-error" role="alert">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Please wait..."
              : accountType === "customer"
                ? "Create Customer Account"
                : "Submit Owner Application"}
          </button>
        </form>

        <div className="register-divider">
          <span>OR</span>
        </div>

        <div className="register-login">
          <p>Already have an account?</p>
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
