
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get("http://localhost:5000/api/orders");
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load orders. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const checkoutGroups = useMemo(() => {
    const groups = new Map();

    orders.forEach((order) => {
      // Older orders without checkoutId remain separate.
      const groupKey = order.checkoutId || `single-${order._id}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          checkoutId: order.checkoutId || null,
          orders: [],
        });
      }

      groups.get(groupKey).orders.push(order);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const dateA = new Date(
        Math.max(
          ...a.orders.map((order) => new Date(order.createdAt || 0).getTime())
        )
      );
      const dateB = new Date(
        Math.max(
          ...b.orders.map((order) => new Date(order.createdAt || 0).getTime())
        )
      );

      return dateB - dateA;
    });
  }, [orders]);

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const viewCheckout = (group) => {
    const firstOrder = group.orders[0];

    if (!firstOrder) return;

    navigate(`/order-confirmation/${firstOrder._id}`, {
      state: {
        ...firstOrder,
        checkoutId: group.checkoutId,
        checkoutOrders: group.orders,
      },
    });
  };

  if (loading) {
    return <div style={styles.page}>Loading your orders...</div>;
  }

  if (error) {
    return (
      <div style={styles.page}>
        <h2>My Orders</h2>
        <p style={styles.error}>{error}</p>
        <button style={styles.button} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.heading}>My Orders</h1>
      <p style={styles.subtitle}>
        View your checkouts and the orders placed with each restaurant.
      </p>

      {checkoutGroups.length === 0 ? (
        <section style={styles.empty}>
          <h2>No orders yet</h2>
          <p>Your placed orders will appear here.</p>
          <button
            style={styles.button}
            onClick={() => navigate("/")}
          >
            Explore Food
          </button>
        </section>
      ) : (
        <div style={styles.list}>
          {checkoutGroups.map((group) => {
            const firstOrder = group.orders[0];
            const checkoutSubtotal = group.orders.reduce(
              (sum, order) => sum + Number(order.subtotal || 0),
              0
            );
            const totalDelivery = group.orders.reduce(
              (sum, order) => sum + Number(order.deliveryCharge || 0),
              0
            );
            const checkoutTotal = group.orders.reduce(
              (sum, order) => sum + Number(order.totalAmount || 0),
              0
            );

            return (
              <section key={group.checkoutId || firstOrder._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.checkoutTitle}>Checkout</h2>
                    <p style={styles.muted}>
                      {formatDate(firstOrder.createdAt)}
                    </p>
                    <p style={styles.reference}>
                      Reference: {group.checkoutId || firstOrder._id}
                    </p>
                  </div>

                  <span style={styles.badge}>
                    {group.orders.length}{" "}
                    {group.orders.length === 1 ? "order" : "restaurant orders"}
                  </span>
                </div>

                <div style={styles.restaurantList}>
                  {group.orders.map((order, index) => (
                    <div key={order._id} style={styles.restaurantOrder}>
                      <h3 style={styles.restaurantTitle}>
                        Restaurant {index + 1}
                      </h3>

                      <p style={styles.muted}>
                        Order ID: {order._id}
                      </p>

                      <p>
                        Status:{" "}
                        <strong>{String(order.orderStatus || "PLACED").replaceAll("_", " ")}</strong>
                      </p>

                      <ul style={styles.items}>
                        {(order.items || []).map((item, itemIndex) => (
                          <li key={`${order._id}-${itemIndex}`}>
                            {item.name} × {item.quantity} —{" "}
                            {formatCurrency(
                              Number(item.price) * Number(item.quantity)
                            )}
                          </li>
                        ))}
                      </ul>

                      <div style={styles.amountRow}>
                        <span>Restaurant subtotal</span>
                        <strong>{formatCurrency(order.subtotal)}</strong>
                      </div>

                      <div style={styles.amountRow}>
                        <span>Delivery charge</span>
                        <strong>{formatCurrency(order.deliveryCharge)}</strong>
                      </div>

                      <div style={styles.amountRow}>
                        <span>Restaurant order total</span>
                        <strong>{formatCurrency(order.totalAmount)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.summary}>
                  <div style={styles.amountRow}>
                    <span>Combined food subtotal</span>
                    <span>{formatCurrency(checkoutSubtotal)}</span>
                  </div>

                  <div style={styles.amountRow}>
                    <span>Combined delivery charges</span>
                    <span>{formatCurrency(totalDelivery)}</span>
                  </div>

                  <div style={styles.totalRow}>
                    <span>Checkout total</span>
                    <strong>{formatCurrency(checkoutTotal)}</strong>
                  </div>

                  <p style={styles.muted}>
                    Payment: {firstOrder.paymentMethod || "Not specified"}
                  </p>

                  <button
                    style={styles.button}
                    onClick={() => viewCheckout(group)}
                  >
                    View Checkout Details
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

const styles = {
  page: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "32px 20px",
    color: "#29231f",
  },
  heading: {
    marginBottom: "8px",
  },
  subtitle: {
    color: "#6b625c",
    marginBottom: "28px",
  },
  list: {
    display: "grid",
    gap: "24px",
  },
  card: {
    border: "1px solid #e7ded7",
    borderRadius: "12px",
    padding: "22px",
    background: "#fff",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
    borderBottom: "1px solid #eee6e0",
    paddingBottom: "16px",
  },
  checkoutTitle: {
    margin: "0 0 8px",
  },
  muted: {
    color: "#716963",
    fontSize: "14px",
    overflowWrap: "anywhere",
  },
  reference: {
    fontSize: "13px",
    overflowWrap: "anywhere",
  },
  badge: {
    background: "#fff0e5",
    color: "#a9430a",
    padding: "7px 10px",
    borderRadius: "20px",
    fontSize: "13px",
  },
  restaurantList: {
    display: "grid",
    gap: "18px",
  },
  restaurantOrder: {
    padding: "18px 0",
    borderBottom: "1px solid #eee6e0",
  },
  restaurantTitle: {
    marginTop: 0,
    marginBottom: "8px",
  },
  items: {
    paddingLeft: "20px",
    lineHeight: 1.8,
  },
  amountRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    margin: "9px 0",
  },
  summary: {
    paddingTop: "18px",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    borderTop: "1px solid #e7ded7",
    paddingTop: "14px",
    marginTop: "14px",
    fontSize: "18px",
  },
  button: {
    border: "none",
    borderRadius: "7px",
    padding: "11px 18px",
    background: "#e96520",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "12px",
  },
  empty: {
    textAlign: "center",
    padding: "48px 20px",
    border: "1px solid #e7ded7",
    borderRadius: "12px",
  },
  error: {
    color: "#b42318",
  },
};

export default MyOrders;
