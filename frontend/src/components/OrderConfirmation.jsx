
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [orders, setOrders] = useState(
    location.state?.checkoutOrders ||
      (location.state?._id ? [location.state] : [])
  );
  const [loading, setLoading] = useState(!location.state?.checkoutOrders);
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state?.checkoutOrders?.length) {
      setOrders(location.state.checkoutOrders);
      setLoading(false);
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/orders/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success || !data.order) {
          throw new Error(data.message || "Failed to fetch order.");
        }

        const firstOrder = data.order;

        if (firstOrder.checkoutId) {
          const allResponse = await fetch("/api/orders");
          const allData = await allResponse.json();

          if (!allResponse.ok || !allData.success) {
            throw new Error(allData.message || "Failed to fetch checkout orders.");
          }

          setOrders(
            allData.orders.filter(
              (order) => order.checkoutId === firstOrder.checkoutId
            )
          );
        } else {
          setOrders([firstOrder]);
        }
      } catch (err) {
        setError(err.message || "Unable to load order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [id, location.state]);

  if (loading) {
    return (
      <main className="order-confirmation-page">
        <p>Loading order details...</p>
      </main>
    );
  }

  if (error || orders.length === 0) {
    return (
      <main className="order-confirmation-page">
        <section className="confirmation-empty">
          <p className="confirmation-label">ORDER CONFIRMATION</p>
          <h1>{error ? "Unable to load order" : "No order found"}</h1>
          <p>{error || "We could not find an order to display."}</p>
          <button
            className="confirmation-button"
            onClick={() => navigate("/menu")}
          >
            Explore Menu
          </button>
        </section>
      </main>
    );
  }

  const firstOrder = orders[0];
  const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
  const delivery = orders.reduce((sum, order) => sum + order.deliveryCharge, 0);
  const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <main className="order-confirmation-page">
      <section className="confirmation-header">
        <div className="confirmation-icon">✓</div>
        <p className="confirmation-label">ORDER CONFIRMED</p>
        <h1>Your order is on its way!</h1>
        <p>Thank you for ordering from Khao To Jano.</p>
      </section>

      <section className="confirmation-content">
        <div className="confirmation-main">
          {orders.map((order, orderIndex) => (
            <div className="confirmation-card" key={order._id}>
              <h2>
                {orders.length > 1
                  ? `Restaurant Order ${orderIndex + 1}`
                  : "Order Details"}
              </h2>

              <div className="confirmation-order-number">
                <span>Order Reference</span>
                <strong>{order._id}</strong>
              </div>

              <div className="confirmation-items">
                {order.items.map((item, index) => (
                  <div
                    className="confirmation-item"
                    key={item._id || `${item.name}-${index}`}
                  >
                    <div>
                      <h3>{item.name}</h3>
                      <span>Quantity: {item.quantity}</span>
                    </div>
                    <strong>₹{item.price * item.quantity}</strong>
                  </div>
                ))}
              </div>

              <div className="confirmation-total">
                <div>
                  <span>Subtotal</span>
                  <strong>₹{order.subtotal}</strong>
                </div>
                <div>
                  <span>Delivery</span>
                  <strong>₹{order.deliveryCharge}</strong>
                </div>
                <div>
                  <span>Order status</span>
                  <strong>{order.orderStatus}</strong>
                </div>
                <div className="confirmation-grand-total">
                  <span>Order total</span>
                  <strong>₹{order.totalAmount}</strong>
                </div>
              </div>
            </div>
          ))}

          <div className="confirmation-card">
            <h2>Checkout Summary</h2>
            <div className="confirmation-total">
              <div>
                <span>Combined subtotal</span>
                <strong>₹{subtotal.toFixed(2)}</strong>
              </div>
              <div>
                <span>Total delivery</span>
                <strong>₹{delivery.toFixed(2)}</strong>
              </div>
              <div className="confirmation-grand-total">
                <span>Total paid / payable</span>
                <strong>₹{total.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <div className="confirmation-card">
            <h2>Delivery Details</h2>
            <p>{firstOrder.deliveryAddress?.street || "-"}</p>
            <p>
              {[
                firstOrder.deliveryAddress?.city,
                firstOrder.deliveryAddress?.state,
                firstOrder.deliveryAddress?.postalCode,
              ].filter(Boolean).join(", ") || "-"}
            </p>
          </div>

          <div className="confirmation-card">
            <h2>Payment Method</h2>
            <p className="payment-confirmation">{firstOrder.paymentMethod}</p>
          </div>
        </div>

        <aside className="confirmation-actions">
          <h2>What would you like to do next?</h2>
          <button
            className="confirmation-primary-button"
            onClick={() => navigate("/menu")}
          >
            Continue Shopping
          </button>
          <button
            className="confirmation-secondary-button"
            onClick={() => navigate("/orders")}
          >
            View My Orders
          </button>
        </aside>
      </section>
    </main>
  );
}

export default OrderConfirmation;
