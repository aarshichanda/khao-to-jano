
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/RestaurantDashboard.css";
import API_BASE_URL, { API_URL as API_ROOT } from "../api";

const API =`${API_ROOT}/owner`;

function RestaurantDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in with your restaurant owner account.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [dashboardResponse, ordersResponse] = await Promise.all([
        fetch(`${API}/dashboard`, { headers }),
        fetch(`${API}/orders`, { headers }),
      ]);

      if (!dashboardResponse.ok || !ordersResponse.ok) {
        throw new Error(
          "Unable to load restaurant data. Check your account access."
        );
      }

      const dashboardResult = await dashboardResponse.json();
      const ordersResult = await ordersResponse.json();

      setDashboard(
        dashboardResult.data ??
          dashboardResult.dashboard ??
          dashboardResult
      );

      const orderList =
        ordersResult.data ??
        ordersResult.orders ??
        ordersResult.results ??
        [];

      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (err) {
      setError(err.message || "Could not load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const socket = io(API_BASE_URL, {
      auth: { token },
    });

    socket.on("new-order", loadDashboard);
    socket.on("order-updated", loadDashboard);

    return () => socket.disconnect();
  }, [loadDashboard]);

  const restaurant =
    dashboard?.restaurant ??
    dashboard?.myRestaurant ??
    dashboard?.data?.restaurant ??
    {};

  const metrics =
    dashboard?.stats ??
    dashboard?.metrics ??
    dashboard?.summary ??
    {};

  const getStatus = (order) =>
    String(order.status ?? order.orderStatus ?? "PENDING").toUpperCase();

  const getOrderTotal = (order) =>
    Number(order.totalAmount ?? order.total ?? order.grandTotal ?? 0);

  const activeOrders = orders.filter(
    (order) => !["DELIVERED", "CANCELLED"].includes(getStatus(order))
  );

  const today = new Date().toDateString();

  const todaysOrders = orders.filter((order) => {
    const date = order.createdAt ?? order.orderDate;
    return date && new Date(date).toDateString() === today;
  });

  const revenue = orders
    .filter((order) => !["CANCELLED"].includes(getStatus(order)))
    .reduce((sum, order) => sum + getOrderTotal(order), 0);

  if (loading) {
    return (
      <main className="rd-page">
        <div className="rd-loading">
          <div className="rd-spinner" />
          <p>Preparing your restaurant dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="rd-page">
      <section className="rd-hero">
        <div>
          <span className="rd-eyebrow">KHAO TO JANO · PARTNER SPACE</span>
          <h1>
            Welcome to your
            <br />
            <span>Restaurant Dashboard</span>
          </h1>
          <p>
            Keep track of incoming orders and your restaurant performance
            from one place.
          </p>
        </div>

        <div className="rd-hero-icon" aria-hidden="true">
          <span>KTJ</span>
          <div>Restaurant<br />Partner</div>
        </div>
      </section>

      {error && (
        <div className="rd-alert" role="alert">
          <strong>Dashboard notice</strong>
          <p>{error}</p>
          <button type="button" onClick={loadDashboard}>
            Try again
          </button>
        </div>
      )}

      <section className="rd-section-heading">
        <div>
          <h2>Performance overview</h2>
          <p>Your restaurant at a glance</p>
        </div>
        <span className="rd-live-label">
          <span /> Live updates enabled
        </span>
      </section>

      <section className="rd-stats">
        <article className="rd-stat-card">
          <div className="rd-stat-top">
            <span>Total orders</span>
            <span className="rd-stat-icon">▤</span>
          </div>
          <strong>
            {metrics.totalOrders ?? metrics.ordersCount ?? orders.length}
          </strong>
          <p>Orders available in your dashboard</p>
        </article>

        <article className="rd-stat-card">
          <div className="rd-stat-top">
            <span>Active orders</span>
            <span className="rd-stat-icon">◷</span>
          </div>
          <strong>{activeOrders.length}</strong>
          <p>Orders not yet delivered or cancelled</p>
        </article>

        <article className="rd-stat-card">
          <div className="rd-stat-top">
            <span>Today's orders</span>
            <span className="rd-stat-icon">▦</span>
          </div>
          <strong>{todaysOrders.length}</strong>
          <p>Orders placed today</p>
        </article>

        <article className="rd-stat-card rd-revenue-card">
          <div className="rd-stat-top">
            <span>Order value</span>
            <span className="rd-stat-icon">₹</span>
          </div>
          <strong>
            ₹{Number(metrics.revenue ?? metrics.totalRevenue ?? revenue).toLocaleString("en-IN")}
          </strong>
          <p>Based on available order records</p>
        </article>
      </section>

      <section className="rd-content-grid">
        <article className="rd-panel rd-restaurant-panel">
          <div className="rd-panel-heading">
            <div>
              <h2>Your restaurant</h2>
              <p>Restaurant profile overview</p>
            </div>
            <span className="rd-restaurant-symbol">⌂</span>
          </div>

          <h3>
            {restaurant.name ??
              restaurant.restaurantName ??
              dashboard?.restaurantName ??
              "Restaurant Partner"}
          </h3>

          <p className="rd-muted">
            {restaurant.address ??
              restaurant.location ??
              "Your restaurant details will appear here when available."}
          </p>

          <div className="rd-detail-row">
            <span>Availability</span>
            <strong>
              {restaurant.isOpen === false || restaurant.isAvailable === false
                ? "Currently closed"
                : "Partner account"}
            </strong>
          </div>

          <div className="rd-detail-row">
            <span>Menu items</span>
            <strong>
              {restaurant.menu?.length ??
                restaurant.menuItems?.length ??
                dashboard?.menuCount ??
                "—"}
            </strong>
          </div>

          <Link className="rd-secondary-link" to="/owner/dashboard">
            Open owner management →
          </Link>
        </article>

        <article className="rd-panel rd-quick-panel">
          <div className="rd-panel-heading">
            <div>
              <h2>Quick actions</h2>
              <p>Jump to a key area</p>
            </div>
          </div>

          <Link className="rd-action-link" to="/owner/dashboard">
            <span className="rd-action-icon">▤</span>
            <span>
              <strong>Manage orders</strong>
              <small>Review orders and their current status</small>
            </span>
            <span className="rd-arrow">→</span>
          </Link>

          <Link className="rd-action-link" to="/restaurants">
            <span className="rd-action-icon">⌕</span>
            <span>
              <strong>Browse restaurants</strong>
              <small>View the customer-facing directory</small>
            </span>
            <span className="rd-arrow">→</span>
          </Link>

          <Link className="rd-action-link" to="/owner/dashboard">
            <span className="rd-action-icon">⚙</span>
            <span>
              <strong>Owner console</strong>
              <small>Open existing management tools</small>
            </span>
            <span className="rd-arrow">→</span>
          </Link>
        </article>
      </section>

      <section className="rd-panel rd-orders-panel">
        <div className="rd-panel-heading">
          <div>
            <h2>Recent orders</h2>
            <p>Latest orders returned by your account</p>
          </div>
          <Link className="rd-text-link" to="/owner/dashboard">
            View management console →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rd-empty">
            <span>▤</span>
            <h3>No orders to display</h3>
            <p>Orders will appear here when the backend returns them.</p>
          </div>
        ) : (
          <div className="rd-table-wrap">
            <table className="rd-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((order, index) => {
                  const items = order.items ?? order.orderItems ?? [];
                  const date = order.createdAt ?? order.orderDate;

                  return (
                    <tr key={order._id ?? order.id ?? index}>
                      <td>
                        <strong>
                          #{String(order._id ?? order.id ?? index + 1).slice(-6).toUpperCase()}
                        </strong>
                      </td>
                      <td>
                        {date ? new Date(date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td>{Array.isArray(items) ? items.length : "—"}</td>
                      <td>₹{getOrderTotal(order).toLocaleString("en-IN")}</td>
                      <td>
                        <span
                          className={`rd-status rd-status-${getStatus(order).toLowerCase()}`}
                        >
                          {getStatus(order).replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="rd-footer">
        <span>Khao To Jano</span>
        <span>Restaurant Partner Dashboard</span>
      </footer>
    </main>
  );
}

export default RestaurantDashboard;
