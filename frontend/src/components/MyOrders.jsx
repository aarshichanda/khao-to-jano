import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import API_BASE_URL, { API_URL } from "../api";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchOrders = async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in to view your orders.");
        return;
      }

      const response = await axios.get(API_URL + "/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = response.data;

      const fetchedOrders = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.orders)
          ? payload.orders
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.data?.orders)
              ? payload.data.orders
              : Array.isArray(payload?.results)
                ? payload.results
                : null;

      if (!fetchedOrders) {
        throw new Error(
          "Unexpected orders API response. Check the backend response format."
        );
      }

      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);

      if (err.response?.status === 401) {
        setError(
          "Your session is invalid or has expired. Please log in again."
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load orders. Please try again."
        );
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const token = localStorage.getItem("token");

    if (!token) return undefined;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const handleOrderUpdated = (updatedOrder) => {
      console.log("Order status update received:", updatedOrder);
      fetchOrders({ showLoading: false });
    };

    const handleConnectError = (socketError) => {
      console.error(
        "Order tracking socket error:",
        socketError.message
      );
    };

    socket.on("order-updated", handleOrderUpdated);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("order-updated", handleOrderUpdated);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, []);

  const checkoutGroups = useMemo(() => {
    const groups = new Map();

    orders.forEach((order) => {
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
      const dateA = Math.max(
        ...a.orders.map((order) =>
          new Date(order.createdAt || 0).getTime()
        )
      );

      const dateB = Math.max(
        ...b.orders.map((order) =>
          new Date(order.createdAt || 0).getTime()
        )
      );

      return dateB - dateA;
    });
  }, [orders]);

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const formatStatus = (order) =>
    String(order?.orderStatus || order?.status || "PLACED")
      .replaceAll("_", " ")
      .toUpperCase();

  const getStatusMessage = (order) => {
    const status = String(
      order?.orderStatus || order?.status || "PLACED"
    ).toUpperCase();

    const messages = {
      PLACED: "Waiting for the restaurant to accept this order.",
      RESTAURANT_ACCEPTED:
        "Restaurant accepted. Waiting for KTJ Admin approval.",
      CONFIRMED: "KTJ Admin approved this order.",
      PREPARING: "The restaurant is preparing your order.",
      READY: "Your order is ready.",
      OUT_FOR_DELIVERY: "Your order is out for delivery.",
      DELIVERED: "Your order has been delivered.",
      CANCELLED: "This order has been cancelled.",
    };

    return messages[status] || "Your order status will update here.";
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
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
      <main style={styles.page}>
        <h1 style={styles.heading}>My Orders</h1>
        <p style={styles.error}>{error}</p>

        {error.includes("log in") || error.includes("session") ? (
          <button
            style={styles.button}
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        ) : (
          <button
            style={styles.button}
            onClick={() => fetchOrders()}
          >
            Try Again
          </button>
        )}
      </main>
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
            onClick={() => navigate("/restaurants")}
          >
            Explore Restaurants
          </button>
        </section>
      ) : (
        <div style={styles.list}>
          {checkoutGroups.map((group) => {
            const firstOrder = group.orders[0];

            const checkoutSubtotal = group.orders.reduce(
              (sum, order) =>
                sum + Number(order.subtotal || 0),
              0
            );

            const totalDelivery = group.orders.reduce(
              (sum, order) =>
                sum + Number(order.deliveryCharge || 0),
              0
            );

            const checkoutDiscount = group.orders.reduce(
              (sum, order) =>
                sum + Number(order.discountAmount || 0),
              0
            );

            const checkoutTotal = group.orders.reduce(
              (sum, order) =>
                sum + Number(order.totalAmount || 0),
              0
            );

            const couponCodes = [
              ...new Set(
                group.orders
                  .map((order) => order.couponCode?.trim())
                  .filter(Boolean)
              ),
            ];

            return (
              <section
                key={group.checkoutId || firstOrder._id}
                style={styles.card}
              >
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
                    {group.orders.length === 1
                      ? "order"
                      : "restaurant orders"}
                  </span>
                </div>

                <div style={styles.restaurantList}>
                  {group.orders.map((order, index) => (
                    <div
                      key={order._id}
                      style={styles.restaurantOrder}
                    >
                      <h3 style={styles.restaurantTitle}>
                        {order.restaurant?.name ||
                          `Restaurant ${index + 1}`}
                      </h3>

                      <p style={styles.muted}>
                        Order ID: {order._id}
                      </p>

                      <p style={styles.statusLine}>
                        Status: <strong>{formatStatus(order)}</strong>
                      </p>

                      <p style={styles.statusMessage}>
                        {getStatusMessage(order)}
                      </p>

                      <ul style={styles.items}>
                        {(order.items || []).map((item, itemIndex) => (
                          <li key={`${order._id}-${itemIndex}`}>
                            {item.name} × {item.quantity} —{" "}
                            {formatCurrency(
                              Number(item.price) *
                                Number(item.quantity)
                            )}
                          </li>
                        ))}
                      </ul>

                      <div style={styles.amountRow}>
                        <span>Restaurant subtotal</span>
                        <strong>
                          {formatCurrency(order.subtotal)}
                        </strong>
                      </div>

                      <div style={styles.amountRow}>
                        <span>Delivery charge</span>
                        <strong>
                          {formatCurrency(order.deliveryCharge)}
                        </strong>
                      </div>

                      {Number(order.discountAmount || 0) > 0 && (
                        <>
                          <div style={styles.couponRow}>
                            <span>Coupon applied</span>
                            <strong>
                              {order.couponCode || "Discount"}
                            </strong>
                          </div>

                          <div style={styles.discountRow}>
                            <span>Discount</span>
                            <strong>
                              -{formatCurrency(order.discountAmount)}
                            </strong>
                          </div>
                        </>
                      )}

                      <div style={styles.amountRow}>
                        <span>Restaurant order total</span>
                        <strong>
                          {formatCurrency(order.totalAmount)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.summary}>
                  <h3 style={styles.summaryHeading}>
                    Checkout Summary
                  </h3>

                  <div style={styles.amountRow}>
                    <span>Combined food subtotal</span>
                    <span>{formatCurrency(checkoutSubtotal)}</span>
                  </div>

                  <div style={styles.amountRow}>
                    <span>Combined delivery charges</span>
                    <span>{formatCurrency(totalDelivery)}</span>
                  </div>

                  {checkoutDiscount > 0 && (
                    <>
                      <div style={styles.couponRow}>
                        <span>Coupon code</span>
                        <strong>
                          {couponCodes.length > 0
                            ? couponCodes.join(", ")
                            : "Applied discount"}
                        </strong>
                      </div>

                      <div style={styles.discountRow}>
                        <span>Total discount</span>
                        <strong>
                          -{formatCurrency(checkoutDiscount)}
                        </strong>
                      </div>
                    </>
                  )}

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
  statusLine: {
    marginBottom: "6px",
  },
  statusMessage: {
    marginTop: 0,
    color: "#6b625c",
    fontSize: "14px",
  },
  amountRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    margin: "9px 0",
  },
  couponRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    margin: "9px 0",
    color: "#276738",
  },
  discountRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    margin: "9px 0",
    color: "green",
    fontWeight: 600,
  },
  summary: {
    paddingTop: "18px",
  },
  summaryHeading: {
    marginTop: 0,
    marginBottom: "16px",
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