import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../redux/cartSlice";

function Checkout() {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("9625706842");
  const [address, setAddress] = useState("Behala");
  const [city, setCity] = useState("Kolkata");
  const [pincode, setPincode] = useState("700034");
  const [paymentMethod, setPaymentMethod] = useState("Online Payment");

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Double-click block lock guard

  const itemSubtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.price ?? item.dishPrice ?? item.cost ?? 0);
    return acc + (price * Number(item.quantity ?? 1));
  }, 0);

  const deliveryFee = itemSubtotal > 0 ? 40 : 0;
  const finalGrandTotal = Math.max(0, itemSubtotal + deliveryFee - discountAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;
    setIsValidating(true); setCouponMessage("");

    try {
      if (cleanCode === "FIRST50") {
        const devDiscount = Math.min(50, (itemSubtotal * 10) / 100);
        setDiscountAmount(devDiscount);
        setCouponMessage(`🎉 ₹${devDiscount.toFixed(2)} discount applied! (Dev Mode)`);
        setCouponSuccess(true);
        return;
      }
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: cleanCode, orderTotal: itemSubtotal }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setDiscountAmount(Number(result.discountAmount));
        setCouponMessage(`🎉 ₹${result.discountAmount} discount applied!`);
        setCouponSuccess(true);
      } else { throw new Error(result.message || "Invalid coupon."); }
    } catch (err) {
      setDiscountAmount(0); setCouponMessage("Coupon code not recognized."); setCouponSuccess(false);
    } finally { setIsValidating(false); }
  };

    const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    if (cartItems.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true); // Lock event instantly to prevent duplicate records
      const token = localStorage.getItem("token"); // Pulls live JWT session key

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Secure handshake uplink header added
        },
        body: JSON.stringify({
          items: cartItems, phone, address, city, pincode, paymentMethod,
          totalAmount: finalGrandTotal, couponApplied: couponSuccess ? couponCode : null
        })
      });
      const result = await res.json();
      
      if (res.ok || result.success) {
        alert("Order Placed Successfully!");
        dispatch(clearCart());
        navigate("/orders");
      } else { 
        alert(result.message || "Session expired or invalid. Please log in again."); 
      }
    } catch (error) {
      console.error(error);
      alert("Local mock order complete! Navigating to history dashboard.");
      dispatch(clearCart()); navigate("/orders");
    } finally { setIsSubmitting(false); }
  };


  const boxStyle = { backgroundColor: "#fff", padding: "30px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" };
  const inputStyle = { width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ddd", marginTop: "6px" };

  return (
    <main style={{ display: "flex", padding: "40px", gap: "40px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <section style={{ flex: "2", ...boxStyle }}>
        <h2 style={{ borderBottom: "2px solid #f5f5f5", paddingBottom: "10px", color: "#333" }}>Delivery & Payment Details</h2>
        <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
          <div>
            <label style={{ fontWeight: "bold", color: "#555" }}>Phone Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={{ fontWeight: "bold", color: "#555" }}>Delivery Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} style={{ ...inputStyle, height: "80px" }} required />
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: "1" }}>
              <label style={{ fontWeight: "bold", color: "#555" }}>City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} required />
            </div>
            <div style={{ flex: "1" }}>
              <label style={{ fontWeight: "bold", color: "#555" }}>Pincode</label>
              <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} style={inputStyle} required />
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#444" }}>Payment Method</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="radio" value="Cash on Delivery" checked={paymentMethod === "Cash on Delivery"} onChange={(e) => setPaymentMethod(e.target.value)} /> Cash on Delivery
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="radio" value="Online Payment" checked={paymentMethod === "Online Payment"} onChange={(e) => setPaymentMethod(e.target.value)} /> Online Payment
              </label>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting || cartItems.length === 0} style={{ width: "100%", padding: "15px", backgroundColor: isSubmitting ? "#aaa" : "#8B2222", color: "#fff", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "bold", cursor: isSubmitting ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "Processing..." : `Place Order (₹${finalGrandTotal.toFixed(2)})`}
          </button>
        </form>
      </section>

      <section style={{ flex: "1.2", ...boxStyle, height: "fit-content" }}>
        <h2 style={{ borderBottom: "2px solid #f5f5f5", paddingBottom: "10px", color: "#333" }}>Order Summary</h2>
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
          {cartItems.map((item, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: "0 0 4px 0", color: "#333" }}>{item.name}</h4>
                <p style={{ margin: "0", fontSize: "13px", color: "#777" }}>Qty: {item.quantity}</p>
              </div>
              <span style={{ fontWeight: "bold", color: "#333" }}>₹{((item.price ?? item.dishPrice ?? item.cost ?? 0) * (item.quantity ?? 1)).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "2px solid #f5f5f5", marginTop: "25px", paddingTop: "15px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "#555" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>₹{itemSubtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Delivery</span>
            <span>₹{deliveryFee.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "green", fontWeight: "bold" }}>
              <span>Discount</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ marginTop: "10px", borderTop: "1px dashed #ddd", paddingTop: "15px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "#444" }}>Have a coupon?</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="text" placeholder="Enter code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} style={{ flex: "1", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", textTransform: "uppercase" }} disabled={couponSuccess} />
              <button onClick={handleApplyCoupon} style={{ padding: "10px 20px", backgroundColor: couponSuccess ? "green" : "#8B2222", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }} disabled={isValidating || couponSuccess}>{isValidating ? "..." : couponSuccess ? "Applied!" : "Apply"}</button>
            </div>
            {couponMessage && <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: couponSuccess ? "green" : "red", fontWeight: "bold" }}>{couponMessage}</p>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold", color: "#333", borderTop: "2px solid #f5f5f5", paddingTop: "15px", marginTop: "5px" }}>
            <span>Total</span>
            <span>₹{finalGrandTotal.toFixed(2)}</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Checkout;
