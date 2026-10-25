
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../redux/cartSlice";
import API_BASE_URL from "../api";

const API_BASE = API_BASE_URL;

function Checkout() {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const getRestaurantId = (item) => {
    const value =
      item?.restaurantId?._id ??
      item?.restaurantId ??
      item?.restaurant?._id ??
      item?.restaurant ??
      "";

    return typeof value === "string" ? value.trim() : "";
  };

  const getDishId = (item) => {
    const value =
      item?.dishId?._id ??
      item?.dishId ??
      item?.menuItemId?._id ??
      item?.menuItemId ??
      item?._id ??
      "";

    return typeof value === "string" ? value.trim() : "";
  };

  const itemSubtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.price ?? item.dishPrice ?? item.cost ?? 0);
    return sum + price * Number(item.quantity ?? 1);
  }, 0);

  const restaurantIds = [
    ...new Set(cartItems.map(getRestaurantId).filter(Boolean)),
  ];

  const deliveryFee = restaurantIds.length * 40;

  const finalGrandTotal = Math.max(
    0,
    itemSubtotal + deliveryFee - discountAmount
  );

  const handleApplyCoupon = async (e) => {
    e.preventDefault();

    if (isValidating || isSubmitting || couponSuccess) return;

    const cleanCode = couponCode.trim().toUpperCase();

    if (!cleanCode) {
      setCouponMessage("Please enter a coupon code.");
      return;
    }

    setIsValidating(true);
    setCouponMessage("");
    setError("");

    try {
      if (cleanCode !== "FIRST50") {
        throw new Error("Invalid coupon code. Try FIRST50.");
      }

      if (itemSubtotal <= 0) {
        throw new Error("Add items to your cart before applying a coupon.");
      }

      const previewDiscount =
        Math.round(Math.min(50, itemSubtotal * 0.1) * 100) / 100;

      setCouponCode(cleanCode);
      setDiscountAmount(previewDiscount);
      setCouponSuccess(true);
      setCouponMessage(
        `Estimated discount: ₹${previewDiscount.toFixed(2)}. The server will verify the final discount when you place the order.`
      );
    } catch (err) {
      setDiscountAmount(0);
      setCouponSuccess(false);
      setCouponMessage(err.message || "Coupon could not be applied.");
    } finally {
      setIsValidating(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (isSubmitting || cartItems.length === 0) return;

    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in before placing your order.");
      return;
    }

    if (
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {
      setError("Please complete all delivery details.");
      return;
    }

    const normalizedCartItems = cartItems.map((item) => ({
      restaurantId: getRestaurantId(item),
      dishId: getDishId(item),
      quantity: Number(item.quantity ?? 1),
    }));

    if (normalizedCartItems.some((item) => !item.restaurantId)) {
      setError(
        "A cart item has no restaurant ID. Clear the old cart and add the dish again from its restaurant page."
      );
      return;
    }

    const groupedItems = new Map();

    for (const item of normalizedCartItems) {
      if (
        !item.dishId ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1
      ) {
        setError(
          "A cart item has an invalid dish ID or quantity. Add the dish again from its restaurant page."
        );
        return;
      }

      if (!groupedItems.has(item.restaurantId)) {
        groupedItems.set(item.restaurantId, []);
      }

      groupedItems.get(item.restaurantId).push({
        dishId: item.dishId,
        quantity: item.quantity,
      });
    }

    const restaurants = [...groupedItems.entries()].map(
      ([restaurant, items]) => ({
        restaurant,
        items,
      })
    );

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurants,
          deliveryAddress: {
            street: address.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: pincode.trim(),
          },
          phone: phone.trim(),
          paymentMethod,
          couponCode: couponSuccess ? couponCode.trim().toUpperCase() : "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "The order could not be placed.");
      }

      const savedOrders = Array.isArray(result.orders)
        ? result.orders
        : result.order
          ? [result.order]
          : [];

      if (
        savedOrders.length === 0 ||
        savedOrders.some((order) => !order?._id)
      ) {
        throw new Error(
          "The server response did not contain saved orders. Check My Orders before retrying."
        );
      }

      if (paymentMethod === "ONLINE") {
        if (!result.checkoutId) {
          throw new Error(
            "The server did not return a checkout ID for PayU."
          );
        }

        const paymentResponse = await fetch(`${API_BASE}/api/payu/initiate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ checkoutId: result.checkoutId }),
        });

        const paymentResult = await paymentResponse.json();

        if (!paymentResponse.ok || !paymentResult.success) {
          throw new Error(
            paymentResult.message || "Could not initiate PayU payment."
          );
        }

        const payment = paymentResult.payment;

        if (!payment?.action || !payment?.fields) {
          throw new Error("PayU returned an invalid payment form.");
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = payment.action;

        Object.entries(payment.fields).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value ?? "");
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      const confirmedTotal = savedOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0
      );

      dispatch(clearCart());

      alert(
        `Order placed successfully!\nRestaurant orders: ${savedOrders.length}\nTotal: ₹${confirmedTotal.toFixed(2)}\nPayment: Cash on Delivery`
      );

      navigate("/orders");
    } catch (err) {
      console.error("Checkout submission failed:", err);
      setError(
        err.message || "Unable to continue checkout. Your cart has been preserved."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const boxStyle = {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    marginTop: "6px",
    boxSizing: "border-box",
  };

  if (cartItems.length === 0) {
    return (
      <main
        style={{
          maxWidth: "800px",
          margin: "40px auto",
          padding: "24px",
        }}
      >
        <h2>Your cart is empty</h2>
        <button
          type="button"
          onClick={() => navigate("/restaurants")}
          style={styles.button}
        >
          Explore Restaurants
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        display: "flex",
        flexWrap: "wrap",
        padding: "40px",
        gap: "40px",
        fontFamily: "sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <section style={{ flex: "2 1 400px", ...boxStyle }}>
        <h2 style={styles.sectionHeading}>Delivery &amp; Payment Details</h2>

        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}

        <form
          onSubmit={handlePlaceOrder}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              autoComplete="tel"
              required
            />
          </div>

          <div>
            <label style={styles.label}>Delivery Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ ...inputStyle, height: "80px" }}
              autoComplete="street-address"
              required
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ flex: "1 1 140px" }}>
              <label style={styles.label}>City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={inputStyle}
                autoComplete="address-level2"
                required
              />
            </div>

            <div style={{ flex: "1 1 140px" }}>
              <label style={styles.label}>State</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={inputStyle}
                autoComplete="address-level1"
                required
              />
            </div>

            <div style={{ flex: "1 1 140px" }}>
              <label style={styles.label}>Pincode</label>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                style={inputStyle}
                autoComplete="postal-code"
                required
              />
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: "12px", color: "#444" }}>
              Payment Method
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Cash on Delivery
              </label>

              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === "ONLINE"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                PayU Online Payment (Test Mode)
              </label>
            </div>

            <p style={styles.muted}>
              Online payments are processed through PayU Test Mode.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || cartItems.length === 0}
            style={{
              ...styles.button,
              width: "100%",
              padding: "15px",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting
              ? "Processing..."
              : `Place Order (₹${finalGrandTotal.toFixed(2)})`}
          </button>
        </form>
      </section>

      <section
        style={{
          flex: "1.2 1 300px",
          ...boxStyle,
          height: "fit-content",
        }}
      >
        <h2 style={styles.sectionHeading}>Order Summary</h2>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {cartItems.map((item, index) => (
            <div
              key={`${getRestaurantId(item)}-${getDishId(item) || item.name}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 4px", color: "#333" }}>
                  {item.name}
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#777" }}>
                  Qty: {item.quantity ?? 1}
                </p>
              </div>

              <span style={{ fontWeight: "bold", color: "#333" }}>
                ₹
                {(
                  Number(item.price ?? item.dishPrice ?? item.cost ?? 0) *
                  Number(item.quantity ?? 1)
                ).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.summary}>
          <div style={styles.amountRow}>
            <span>Subtotal (estimated)</span>
            <span>₹{itemSubtotal.toFixed(2)}</span>
          </div>

          <div style={styles.amountRow}>
            <span>
              Delivery ({restaurantIds.length} restaurant
              {restaurantIds.length === 1 ? "" : "s"})
            </span>
            <span>₹{deliveryFee.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div
              style={{
                ...styles.amountRow,
                color: "green",
                fontWeight: "bold",
              }}
            >
              <span>Coupon discount ({couponCode}) — estimated</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <form onSubmit={handleApplyCoupon} style={styles.couponForm}>
            <label style={styles.label}>Have a coupon?</label>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Enter code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setDiscountAmount(0);
                  setCouponSuccess(false);
                  setCouponMessage("");
                }}
                style={{
                  ...inputStyle,
                  flex: "1 1 120px",
                  marginTop: 0,
                }}
                disabled={couponSuccess || isSubmitting}
              />

              <button
                type="submit"
                disabled={isValidating || couponSuccess || isSubmitting}
                style={{
                  ...styles.button,
                  backgroundColor: couponSuccess ? "green" : "#8B2222",
                  marginTop: 0,
                }}
              >
                {isValidating
                  ? "Checking..."
                  : couponSuccess
                    ? "Applied!"
                    : "Apply"}
              </button>
            </div>

            {couponMessage && (
              <p
                role="status"
                style={{
                  fontSize: "12px",
                  color: couponSuccess ? "green" : "#b42318",
                  fontWeight: "bold",
                  lineHeight: 1.5,
                }}
              >
                {couponMessage}
              </p>
            )}
          </form>

          <div style={styles.totalRow}>
            <span>Estimated Total</span>
            <strong>₹{finalGrandTotal.toFixed(2)}</strong>
          </div>

          <p style={styles.muted}>
            Final prices and any coupon discount are recalculated by the server
            when you place the order.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  sectionHeading: {
    borderBottom: "2px solid #f5f5f5",
    paddingBottom: "10px",
    color: "#333",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    color: "#555",
    marginBottom: "6px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  muted: {
    fontSize: "13px",
    color: "#716963",
    lineHeight: 1.5,
  },
  error: {
    padding: "12px",
    borderRadius: "6px",
    background: "#fff0f0",
    color: "#b42318",
  },
  button: {
    border: "none",
    borderRadius: "4px",
    padding: "11px 18px",
    backgroundColor: "#8B2222",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  summary: {
    borderTop: "2px solid #f5f5f5",
    marginTop: "25px",
    paddingTop: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    fontSize: "14px",
    color: "#555",
  },
  amountRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
  },
  couponForm: {
    marginTop: "10px",
    borderTop: "1px dashed #ddd",
    paddingTop: "15px",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
    borderTop: "2px solid #f5f5f5",
    paddingTop: "15px",
    marginTop: "5px",
  },
};

export default Checkout;
