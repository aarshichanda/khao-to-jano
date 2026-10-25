
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL as API_BASE } from "../api";

const API_URL = `${API_BASE}/orders`;

function CustomerDashboard() {
  const customerName = localStorage.getItem("userName") || "Food Lover";
  const customerEmail = localStorage.getItem("userEmail") || "Not available";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please log in to view your order summary.");
        }

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load your orders."
          );
        }

        const fetchedOrders = result.orders ?? result.data ?? [];

        if (!Array.isArray(fetchedOrders)) {
          throw new Error("The server returned an unexpected order format.");
        }

        if (isMounted) {
          setOrders(fetchedOrders);
        }
      } catch (err) {
        console.error("Customer dashboard order fetch failed:", err);

        if (isMounted) {
          setError(err.message || "Unable to load order statistics.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  }, [orders]);

  const activeOrders = orders.filter((order) => {
    const status = String(
      order.orderStatus || order.status || "PLACED"
    ).toUpperCase();

    return !["DELIVERED", "CANCELLED"].includes(status);
  });

  const recentOrders = sortedOrders.slice(0, 3);

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatus = (order) =>
    String(order.orderStatus || order.status || "PLACED")
      .replaceAll("_", " ");

  return (
    <main style={styles.page}>
      {/* Welcome */}
      <section style={styles.welcome}>
        <p style={styles.eyebrow}>
          KHAO TO JANO | CUSTOMER ACCOUNT
        </p>

        <h1 style={styles.heading}>
          Welcome, {customerName}!
        </h1>

        <p style={styles.subtitle}>
          Your food journey starts here. Discover restaurants,
          track your orders, and enjoy your favourites.
        </p>
      </section>

      {/* Live order statistics */}
      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>Your Order Overview</h2>

        {loading ? (
          <p style={styles.muted}>Loading your order statistics...</p>
        ) : error ? (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
            <button
              type="button"
              style={styles.button}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div style={styles.statsGrid}>
            <StatCard
              title="Total Orders"
              value={orders.length}
              description="All your saved orders"
              icon="📦"
            />

            <StatCard
              title="Active Orders"
              value={activeOrders.length}
              description="Not yet delivered or cancelled"
              icon="🛵"
            />

            <StatCard
              title="Recent Orders"
              value={recentOrders.length}
              description="Latest three orders, at most"
              icon="🧾"
            />
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>What Would You Like to Do?</h2>

        <div style={styles.actionGrid}>
          <ActionCard
            icon="🍽️"
            title="Explore Restaurants"
            description="Discover dishes and browse restaurant menus."
            to="/restaurants"
          />

          <ActionCard
            icon="📦"
            title="My Orders"
            description="View your complete order history and discounts."
            to="/orders"
          />

          <ActionCard
            icon="🛒"
            title="My Cart"
            description="Review the dishes you have selected."
            to="/cart"
          />
        </div>
      </section>

      {/* Recent orders */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionHeading}>Recent Orders</h2>

          <Link to="/orders" style={styles.textLink}>
            View All
          </Link>
        </div>

        {loading ? (
          <p style={styles.muted}>Loading recent orders...</p>
        ) : error ? (
          <p style={styles.muted}>
            Recent orders are unavailable until the connection is restored.
          </p>
        ) : recentOrders.length === 0 ? (
          <div style={styles.empty}>
            <h3>No orders yet</h3>
            <p>Your placed orders will appear here.</p>
            <Link to="/restaurants" style={styles.buttonLink}>
              Explore Restaurants
            </Link>
          </div>
        ) : (
          <div style={styles.recentList}>
            {recentOrders.map((order) => (
              <article key={order._id} style={styles.orderCard}>
                <div style={styles.orderTop}>
                  <div>
                    <h3 style={styles.orderTitle}>
                      Order #{String(order._id || "").slice(-8)}
                    </h3>

                    <p style={styles.muted}>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <span style={styles.statusBadge}>
                    {getStatus(order)}
                  </span>
                </div>

                <div style={styles.orderItems}>
                  {(order.items || []).map((item, index) => (
                    <p key={`${order._id}-${index}`} style={styles.itemLine}>
                      {item.name} × {item.quantity}
                    </p>
                  ))}
                </div>

                {Number(order.discountAmount || 0) > 0 && (
                  <p style={styles.discount}>
                    Coupon {order.couponCode || "applied"}: −
                    {formatCurrency(order.discountAmount)}
                  </p>
                )}

                <div style={styles.orderBottom}>
                  <span style={styles.muted}>Order total</span>
                  <strong style={styles.orderTotal}>
                    {formatCurrency(order.totalAmount)}
                  </strong>
                </div>
              </article>
            ))}

            <Link to="/orders" style={styles.buttonLink}>
              View All My Orders
            </Link>
          </div>
        )}
      </section>

      {/* Customer profile */}
      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>Your Account</h2>

        <div style={styles.profileCard}>
          <h3>Customer Profile</h3>

          <p>
            <strong>Name:</strong> {customerName}
          </p>

          <p>
            <strong>Email:</strong> {customerEmail}
          </p>

          <p>
            <strong>Account type:</strong> Customer
          </p>
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <article style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <p style={styles.statTitle}>{title}</p>
      <p style={styles.statValue}>{value}</p>
      <p style={styles.statDescription}>{description}</p>
    </article>
  );
}

function ActionCard({ icon, title, description, to }) {
  return (
    <Link to={to} style={styles.actionCard}>
      <span style={styles.actionIcon}>{icon}</span>
      <h3 style={styles.actionTitle}>{title}</h3>
      <p style={styles.actionDescription}>{description}</p>
      <span style={styles.actionLink}>Open →</span>
    </Link>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 24px",
    minHeight: "75vh",
    color: "#29231f",
    fontFamily: "sans-serif",
  },
  welcome: {
    marginBottom: "36px",
  },
  eyebrow: {
    color: "#e76f27",
    fontWeight: 700,
    letterSpacing: "1px",
    fontSize: "13px",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "12px",
  },
  subtitle: {
    color: "#6b625c",
    lineHeight: 1.7,
  },
  section: {
    marginBottom: "40px",
  },
  sectionHeading: {
    marginBottom: "20px",
    fontSize: "1.35rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "20px",
  },
  statCard: {
    padding: "22px",
    background: "#fff",
    border: "1px solid #e8e0da",
    borderRadius: "14px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  statIcon: {
    fontSize: "1.8rem",
  },
  statTitle: {
    color: "#6b625c",
    marginBottom: "8px",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: 700,
    margin: "8px 0",
    color: "#8b2222",
  },
  statDescription: {
    color: "#716963",
    fontSize: "13px",
    marginBottom: 0,
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "20px",
  },
  actionCard: {
    display: "block",
    padding: "24px",
    background: "#fff",
    border: "1px solid #e8e0da",
    borderRadius: "14px",
    textDecoration: "none",
    color: "#29231f",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  actionIcon: {
    fontSize: "2rem",
  },
  actionTitle: {
    marginBottom: "10px",
  },
  actionDescription: {
    color: "#6b625c",
    lineHeight: 1.6,
    minHeight: "44px",
  },
  actionLink: {
    color: "#e76f27",
    fontWeight: 700,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  textLink: {
    color: "#e76f27",
    fontWeight: 700,
    textDecoration: "none",
  },
  recentList: {
    display: "grid",
    gap: "16px",
  },
  orderCard: {
    padding: "22px",
    border: "1px solid #e8e0da",
    borderRadius: "12px",
    background: "#fff",
  },
  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
  },
  orderTitle: {
    margin: "0 0 8px",
  },
  statusBadge: {
    background: "#fff0e5",
    color: "#a9430a",
    borderRadius: "20px",
    padding: "7px 11px",
    fontSize: "12px",
    fontWeight: 700,
  },
  orderItems: {
    margin: "14px 0",
  },
  itemLine: {
    margin: "6px 0",
    color: "#4e4742",
  },
  discount: {
    color: "#21813b",
    fontWeight: 600,
    fontSize: "14px",
  },
  orderBottom: {
    borderTop: "1px solid #eee6e0",
    paddingTop: "14px",
    marginTop: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },
  orderTotal: {
    fontSize: "1.1rem",
  },
  profileCard: {
    background: "#fff8f2",
    padding: "24px",
    borderRadius: "14px",
    border: "1px solid #f3dfce",
  },
  empty: {
    textAlign: "center",
    padding: "36px 20px",
    border: "1px solid #e8e0da",
    borderRadius: "12px",
  },
  button: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "7px",
    background: "#e96520",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonLink: {
    display: "inline-block",
    width: "fit-content",
    padding: "11px 18px",
    borderRadius: "7px",
    background: "#e96520",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
  },
  errorBox: {
    padding: "18px",
    border: "1px solid #f0b8b8",
    background: "#fff5f5",
    borderRadius: "10px",
  },
  errorText: {
    color: "#b42318",
  },
  muted: {
    color: "#716963",
    fontSize: "14px",
  },
};

export default CustomerDashboard;
