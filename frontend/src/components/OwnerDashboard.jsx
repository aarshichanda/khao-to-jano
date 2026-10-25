import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import "../styles/OwnerDashboard.css";
import API_BASE_URL, { API_URL as API_ROOT } from "../api";

const API_URL = `${API_ROOT}/owner`;
const RESTAURANTS_API_URL = `${API_ROOT}/restaurants`;

const NEXT_STATUSES = {
  PLACED: ["RESTAURANT_ACCEPTED", "CANCELLED"],
  RESTAURANT_ACCEPTED: [],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const NAV_ITEMS = [
  { id: "overview", icon: "▦", label: "Overview" },
  { id: "orders", icon: "▣", label: "Incoming Orders" },
  { id: "restaurant", icon: "⌂", label: "My Restaurant" },
  { id: "menu", icon: "☷", label: "Menu Management" },
  { id: "analytics", icon: "▥", label: "Analytics" },
  { id: "reviews", icon: "☆", label: "Reviews" },
  { id: "directory", icon: "♧", label: "All Restaurants" },
];

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatStatus(status) {
  return (status || "UNKNOWN")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAddress(address) {
  if (!address) return "Not available";
  if (typeof address === "string") return address;

  return [
    address.street,
    address.city,
    address.state,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ") || "Not available";
}

function OwnerDashboard() {
  const [section, setSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState("");

  const getToken = () => localStorage.getItem("token");

  const fetchDashboard = useCallback(async () => {
    const token = getToken();

    if (!token) {
      throw new Error("Session expired. Please log in again.");
    }

    const response = await fetch(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load dashboard.");
    }

    setDashboard(result.data);
  }, []);

  const fetchOrders = useCallback(async () => {
    const token = getToken();

    if (!token) {
      throw new Error("Session expired. Please log in again.");
    }

    const response = await fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load incoming orders.");
    }

    setOrders(Array.isArray(result.data) ? result.data : []);
  }, []);

  const fetchRestaurants = useCallback(async () => {
    setRestaurantsLoading(true);
    setRestaurantsError("");

    try {
      const response = await fetch(RESTAURANTS_API_URL);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load restaurants.");
      }

      const list = Array.isArray(result)
        ? result
        : result.data ?? result.restaurants ?? [];

      if (!Array.isArray(list)) {
        throw new Error("Unexpected restaurant-list response.");
      }

      setRestaurants(list);
    } catch (err) {
      setRestaurantsError(err.message || "Unable to load restaurants.");
    } finally {
      setRestaurantsLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);

      setError("");
      setOrdersError("");

      try {
        await fetchDashboard();
      } catch (err) {
        setError(err.message || "Unable to load dashboard.");

        if (!quiet) setLoading(false);
        return;
      }

      try {
        await fetchOrders();
      } catch (err) {
        setOrdersError(err.message || "Unable to load incoming orders.");
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [fetchDashboard, fetchOrders]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;

    const socket = io(API_BASE_URL, {
      auth: { token },
    });

    socket.on("new-order", () => {
      loadDashboard({ quiet: true });
    });

    socket.on("order-updated", () => {
      loadDashboard({ quiet: true });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection failed:", err.message);
    });

    return () => socket.disconnect();
  }, [loadDashboard]);

  const updateOrderStatus = async (orderId, orderStatus) => {
    const token = getToken();

    if (!token) {
      setActionError("Session expired. Please log in again.");
      return;
    }

    setUpdatingOrderId(orderId);
    setActionError("");
    setActionMessage("");

    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderStatus }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update order status.");
      }

      setActionMessage(
        orderStatus === "RESTAURANT_ACCEPTED"
          ? "Order accepted. Waiting for KTJ admin approval."
          : orderStatus === "CANCELLED"
            ? "Order rejected/cancelled."
            : `Order updated to ${formatStatus(orderStatus)}.`
      );

      await Promise.all([fetchOrders(), fetchDashboard()]);
    } catch (err) {
      setActionError(err.message || "Unable to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const { restaurant, metrics } = dashboard || {};

  const orderSummary = useMemo(() => {
    const summary = {
      PLACED: 0,
      RESTAURANT_ACCEPTED: 0,
      CONFIRMED: 0,
      PREPARING: 0,
      READY: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orders.forEach((order) => {
      if (Object.hasOwn(summary, order.orderStatus)) {
        summary[order.orderStatus] += 1;
      }
    });

    return summary;
  }, [orders]);

  const popularItems = useMemo(() => {
    const totals = new Map();

    orders.forEach((order) => {
      if (order.orderStatus === "CANCELLED") return;

      (order.items || []).forEach((item) => {
        const name = item.name || "Menu item";
        totals.set(
          name,
          (totals.get(name) || 0) + Number(item.quantity || 0)
        );
      });
    });

    return [...totals.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const titleBySection = {
    overview: ["Dashboard Overview", "Your restaurant at a glance."],
    orders: ["Incoming Orders", "Manage orders placed with your restaurant."],
    restaurant: ["My Restaurant", "Your restaurant profile and listing details."],
    menu: ["Menu Management", "Review the menu currently stored for your restaurant."],
    analytics: ["Restaurant Analytics", "Insights calculated from available order records."],
    reviews: ["Reviews", "Restaurant ratings and customer feedback."],
    directory: ["All Restaurants", "Browse restaurants listed on Khao To Jano."],
  };

  const pageTitle = titleBySection[section];

  const renderOrderCard = (order) => {
    const id = order._id;
    const nextStatuses = NEXT_STATUSES[order.orderStatus] || [];

    return (
      <article className="owner-order-card" key={id}>
        <div className="owner-order-card__header">
          <div>
            <h3>Order #{String(id).slice(-6).toUpperCase()}</h3>
            <p>
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString("en-IN")
                : "Date unavailable"}
            </p>
          </div>

          <span
            className={`owner-pill owner-pill--${(
              order.orderStatus || ""
            ).toLowerCase()}`}
          >
            {formatStatus(order.orderStatus)}
          </span>
        </div>

        <div className="owner-order-card__details">
          <p>
            <strong>Customer</strong>
            <span>{order.customer?.username || "Customer"}</span>
          </p>

          <p>
            <strong>Phone</strong>
            <span>
              {order.phone || order.customer?.phone || "Not available"}
            </span>
          </p>

          <p>
            <strong>Payment</strong>
            <span>
              {order.paymentMethod || "Not specified"} ·{" "}
              {formatStatus(order.paymentStatus)}
            </span>
          </p>

          <p>
            <strong>Order total</strong>
            <span>{formatCurrency(order.totalAmount)}</span>
          </p>

          <p className="owner-address-row">
            <strong>Delivery address</strong>
            <span>{formatAddress(order.deliveryAddress)}</span>
          </p>
        </div>

        <div className="owner-order-card__items">
          <strong>Items</strong>

          {Array.isArray(order.items) && order.items.length ? (
            <ul>
              {order.items.map((item, index) => (
                <li key={item._id || `${item.name}-${index}`}>
                  {item.name || "Menu item"} × {item.quantity ?? 1}
                  {item.price != null
                    ? ` — ${formatCurrency(item.price)} each`
                    : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p>Item details unavailable.</p>
          )}
        </div>

        {nextStatuses.length > 0 ? (
          <div className="owner-order-card__actions">
            <span>Update status</span>

            {nextStatuses.map((status) => (
              <button
                type="button"
                key={status}
                disabled={updatingOrderId !== null}
                onClick={() => updateOrderStatus(id, status)}
              >
                {updatingOrderId === id
                  ? "Updating..."
                  : status === "RESTAURANT_ACCEPTED"
                    ? "Accept order"
                    : status === "CANCELLED" &&
                        order.orderStatus === "PLACED"
                      ? "Reject order"
                      : formatStatus(status)}
              </button>
            ))}
          </div>
        ) : (
          <p className="owner-muted">
            {order.orderStatus === "RESTAURANT_ACCEPTED"
              ? "Waiting for KTJ admin approval."
              : "No further actions available for this status."}
          </p>
        )}
      </article>
    );
  };

  const renderOrders = (limit) => {
    if (ordersError) {
      return (
        <div className="owner-empty">
          <p role="alert">{ordersError}</p>
          <button type="button" onClick={fetchOrders}>
            Retry orders
          </button>
        </div>
      );
    }

    const shownOrders = limit ? orders.slice(0, limit) : orders;

    if (!shownOrders.length) {
      return (
        <div className="owner-empty">
          <span className="owner-empty__icon">▣</span>
          <h3>No orders found</h3>
          <p>Orders assigned to your restaurant will appear here.</p>
        </div>
      );
    }

    return (
      <div className="owner-orders-list">
        {shownOrders.map(renderOrderCard)}
      </div>
    );
  };

  if (loading && !dashboard) {
    return (
      <main className="owner-workspace">
        <div className="owner-loading">Loading restaurant dashboard...</div>
      </main>
    );
  }

  if (error && !dashboard) {
    return (
      <main className="owner-workspace">
        <div className="owner-empty">
          <h2>Unable to load your dashboard</h2>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => loadDashboard()}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!dashboard) return null;

  return (
    <main className="owner-workspace">
      {mobileMenuOpen && (
        <button
          type="button"
          className="owner-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`owner-sidebar ${
          mobileMenuOpen ? "owner-sidebar--open" : ""
        }`}
      >
        <div className="owner-brand">
          <div className="owner-brand__mark">K</div>
          <div>
            <strong>KHAO TO JANO</strong>
            <span>OWNER CONSOLE</span>
          </div>
        </div>

        <p className="owner-nav-label">RESTAURANT WORKSPACE</p>

        <nav className="owner-navigation" aria-label="Owner dashboard navigation">
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`owner-nav-item ${
                section === item.id ? "is-active" : ""
              }`}
              onClick={() => {
                setSection(item.id);
                setMobileMenuOpen(false);
              }}
            >
              <span className="owner-nav-item__icon">{item.icon}</span>
              <span>{item.label}</span>

              {item.id === "orders" && orders.length > 0 && (
                <span className="owner-nav-count">
                  {
                    orders.filter(
                      (order) =>
                        !["DELIVERED", "CANCELLED"].includes(order.orderStatus)
                    ).length
                  }
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="owner-sidebar__bottom">
          <div className="owner-help">
            <span>?</span>
            <div>
              <strong>Owner workspace</strong>
              <small>Manage your restaurant</small>
            </div>
          </div>

          <div className="owner-profile">
            <div className="owner-profile__avatar">
              {(restaurant?.name || "R").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{restaurant?.name || "My Restaurant"}</strong>
              <small>Restaurant Owner</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="owner-main">
        <header className="owner-topbar">
          <button
            type="button"
            className="owner-menu-toggle"
            aria-label="Open navigation"
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>

          <div className="owner-breadcrumb">
            <span>Owner Console</span>
            <span>/</span>
            <strong>{pageTitle[0]}</strong>
          </div>

          <button
            type="button"
            className="owner-refresh"
            disabled={loading}
            onClick={() => loadDashboard()}
          >
            ↻ {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <div className="owner-content">
          {error && (
            <div className="owner-alert owner-alert--error" role="alert">
              {error}
            </div>
          )}

          {actionMessage && (
            <div className="owner-alert owner-alert--success" role="status">
              {actionMessage}
            </div>
          )}

          {actionError && (
            <div className="owner-alert owner-alert--error" role="alert">
              {actionError}
            </div>
          )}

          <header className="owner-page-heading">
            <div>
              <p className="owner-eyebrow">
                KHAO TO JANO · RESTAURANT MANAGEMENT
              </p>
              <h1>{pageTitle[0]}</h1>
              <p>{pageTitle[1]}</p>
            </div>

            <div className="owner-restaurant-chip">
              {restaurant?.image ? (
                <img src={restaurant.image} alt="" />
              ) : (
                <span className="owner-restaurant-chip__placeholder">♨</span>
              )}
              <div>
                <strong>{restaurant?.name || "My Restaurant"}</strong>
                <small>{restaurant?.address || "Address not provided"}</small>
              </div>
            </div>
          </header>

          {section === "overview" && (
            <>
              <section className="owner-kpis">
                <article className="owner-kpi">
                  <span className="owner-kpi__icon">▣</span>
                  <p>Active Orders</p>
                  <strong>{metrics.activeOrders ?? 0}</strong>
                  <small>Not delivered or cancelled</small>
                </article>

                <article className="owner-kpi">
                  <span className="owner-kpi__icon owner-kpi__icon--orange">₹</span>
                  <p>Today's Order Value</p>
                  <strong>{formatCurrency(metrics.todayRevenue)}</strong>
                  <small>
                    Non-cancelled orders created today; not necessarily collected
                  </small>
                </article>

                <article className="owner-kpi">
                  <span className="owner-kpi__icon owner-kpi__icon--green">↗</span>
                  <p>Today's Orders</p>
                  <strong>{metrics.todayOrderCount ?? 0}</strong>
                  <small>Non-cancelled orders created today</small>
                </article>

                <article className="owner-kpi">
                  <span className="owner-kpi__icon owner-kpi__icon--gold">☷</span>
                  <p>All-Time Orders</p>
                  <strong>{metrics.totalOrders ?? 0}</strong>
                  <small>Orders recorded for this restaurant</small>
                </article>
              </section>

              <section className="owner-panel-grid">
                <article className="owner-panel">
                  <div className="owner-panel__heading">
                    <div>
                      <h2>Order Status</h2>
                      <p>Current status breakdown for your orders.</p>
                    </div>
                    <button type="button" onClick={() => setSection("orders")}>
                      View orders →
                    </button>
                  </div>

                  <div className="owner-status-list">
                    {Object.entries(orderSummary)
                      .filter(([status]) => status !== "CANCELLED")
                      .map(([status, count]) => {
                        const total = orders.length || 1;

                        return (
                          <div className="owner-status-row" key={status}>
                            <span>{formatStatus(status)}</span>
                            <div className="owner-status-track">
                              <span style={{ width: `${(count / total) * 100}%` }} />
                            </div>
                            <strong>{count}</strong>
                          </div>
                        );
                      })}
                  </div>
                </article>

                <article className="owner-panel">
                  <div className="owner-panel__heading">
                    <div>
                      <h2>Popular Dishes</h2>
                      <p>Quantities across non-cancelled orders available to this dashboard.</p>
                    </div>
                    <button type="button" onClick={() => setSection("analytics")}>
                      Analytics →
                    </button>
                  </div>

                  {popularItems.length ? (
                    <div className="owner-popular-list">
                      {popularItems.map((item, index) => (
                        <div className="owner-popular-row" key={item.name}>
                          <span className="owner-popular-rank">{index + 1}</span>
                          <strong>{item.name}</strong>
                          <span>{item.quantity} sold</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="owner-inline-empty">
                      Dish rankings will appear after this restaurant receives orders.
                    </div>
                  )}
                </article>
              </section>

              <section className="owner-panel owner-recent-panel">
                <div className="owner-panel__heading">
                  <div>
                    <h2>Recent Incoming Orders</h2>
                    <p>Orders assigned to {restaurant?.name || "your restaurant"}.</p>
                  </div>
                  <button type="button" onClick={() => setSection("orders")}>
                    View all →
                  </button>
                </div>
                {renderOrders(3)}
              </section>
            </>
          )}

          {section === "orders" && (
            <section className="owner-panel">
              <div className="owner-panel__heading">
                <div>
                  <h2>Incoming Orders</h2>
                  <p>Review customer details and update order status.</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadDashboard()}
                  disabled={updatingOrderId !== null}
                >
                  Refresh orders
                </button>
              </div>
              {renderOrders()}
            </section>
          )}

          {section === "restaurant" && (
            <section className="owner-panel owner-profile-panel">
              {restaurant?.image ? (
                <img
                  className="owner-profile-panel__image"
                  src={restaurant.image}
                  alt={restaurant.name || "Restaurant"}
                />
              ) : (
                <div className="owner-profile-panel__image owner-image-placeholder">
                  Restaurant image not available
                </div>
              )}

              <div className="owner-profile-panel__details">
                <span className="owner-pill owner-pill--active">Active listing</span>
                <h2>{restaurant?.name || "My Restaurant"}</h2>
                <p><strong>Address:</strong> {restaurant?.address || "Not provided"}</p>
                <p>
                  <strong>Cuisine:</strong>{" "}
                  {Array.isArray(restaurant?.cuisine)
                    ? restaurant.cuisine.join(", ") || "Not specified"
                    : restaurant?.cuisine || "Not specified"}
                </p>
                <p>
                  <strong>Menu items:</strong>{" "}
                  {restaurant?.menu?.length ?? "Not included in dashboard response"}
                </p>
                <p className="owner-muted">
                  This view uses the restaurant linked to your owner account. Editing the profile will be added only after the appropriate protected backend endpoint is defined.
                </p>
              </div>
            </section>
          )}

          {section === "menu" && (
            <section className="owner-panel">
              <div className="owner-panel__heading">
                <div>
                  <h2>Current Menu</h2>
                  <p>Menu items returned with the restaurant profile.</p>
                </div>
              </div>

              {Array.isArray(restaurant?.menu) && restaurant.menu.length ? (
                <div className="owner-menu-grid">
                  {restaurant.menu.map((item, index) => (
                    <article
                      className="owner-menu-card"
                      key={item._id || item.id || `${item.name}-${index}`}
                    >
                      <div>
                        <h3>{item.name || "Unnamed dish"}</h3>
                        <p>{item.description || "No description provided"}</p>
                      </div>
                      <strong>
                        {item.price != null
                          ? formatCurrency(item.price)
                          : "Price unavailable"}
                      </strong>
                      <span
                        className={`owner-pill ${
                          item.isAvailable === false || item.available === false
                            ? "owner-pill--cancelled"
                            : "owner-pill--active"
                        }`}
                      >
                        {item.isAvailable === false || item.available === false
                          ? "Unavailable"
                          : "Availability not specified"}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="owner-empty">
                  <span className="owner-empty__icon">☷</span>
                  <h3>No menu items returned</h3>
                  <p>
                    The restaurant profile currently has no menu items, or the dashboard endpoint does not include the menu. We need to verify the database record before adding menu-management controls.
                  </p>
                </div>
              )}
            </section>
          )}

          {section === "analytics" && (
            <>
              <section className="owner-kpis owner-kpis--three">
                <article className="owner-kpi">
                  <span className="owner-kpi__icon">▣</span>
                  <p>Orders Returned</p>
                  <strong>{orders.length}</strong>
                  <small>Records currently loaded</small>
                </article>

                <article className="owner-kpi">
                  <span className="owner-kpi__icon owner-kpi__icon--orange">₹</span>
                  <p>Order Value</p>
                  <strong>
                    {formatCurrency(
                      orders
                        .filter((order) => order.orderStatus !== "CANCELLED")
                        .reduce(
                          (sum, order) => sum + Number(order.totalAmount || 0),
                          0
                        )
                    )}
                  </strong>
                  <small>
                    Non-cancelled order totals, not confirmed collected revenue
                  </small>
                </article>

                <article className="owner-kpi">
                  <span className="owner-kpi__icon owner-kpi__icon--green">✓</span>
                  <p>Delivered Orders</p>
                  <strong>{orderSummary.DELIVERED}</strong>
                  <small>Delivered status in loaded records</small>
                </article>
              </section>

              <section className="owner-panel">
                <div className="owner-panel__heading">
                  <div>
                    <h2>Best-Selling Dishes</h2>
                    <p>
                      Calculated from currently loaded non-cancelled orders; this is not a historical trend.
                    </p>
                  </div>
                </div>

                {popularItems.length ? (
                  <div className="owner-popular-list">
                    {popularItems.map((item, index) => (
                      <div className="owner-popular-row" key={item.name}>
                        <span className="owner-popular-rank">{index + 1}</span>
                        <strong>{item.name}</strong>
                        <span>{item.quantity} units</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="owner-inline-empty">
                    No sales data is available for this restaurant yet.
                  </div>
                )}
              </section>

              <section className="owner-panel owner-data-note">
                <strong>Historical charts not available yet</strong>
                <p>
                  The current dashboard API does not provide date-bucketed order history. We should add a backend analytics endpoint before drawing monthly or weekly trends.
                </p>
              </section>
            </>
          )}

          {section === "reviews" && (
            <section className="owner-panel">
              <div className="owner-panel__heading">
                <div>
                  <h2>Restaurant Reviews</h2>
                  <p>Customer ratings for your restaurant.</p>
                </div>
              </div>

              <div className="owner-empty">
                <span className="owner-empty__icon">☆</span>
                <h3>Review data not connected</h3>
                <p>
                  The current owner dashboard does not fetch restaurant-specific reviews. We need to confirm the review schema and endpoint before showing ratings or feedback.
                </p>
              </div>
            </section>
          )}

          {section === "directory" && (
            <section className="owner-panel">
              <div className="owner-panel__heading">
                <div>
                  <h2>All Restaurants</h2>
                  <p>
                    Browse restaurants listed on Khao To Jano. This does not grant permission to manage other restaurants.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchRestaurants}
                  disabled={restaurantsLoading}
                >
                  {restaurantsLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {restaurantsError && (
                <p className="owner-error" role="alert">{restaurantsError}</p>
              )}

              {restaurantsLoading && !restaurants.length ? (
                <p className="owner-muted">Loading restaurants...</p>
              ) : restaurants.length ? (
                <div className="owner-restaurant-grid">
                  {restaurants.map((item) => (
                    <article
                      className="owner-restaurant-card"
                      key={item._id || item.id}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name || "Restaurant"} />
                      ) : (
                        <div className="owner-restaurant-card__placeholder">
                          Image unavailable
                        </div>
                      )}

                      <div className="owner-restaurant-card__body">
                        <div className="owner-restaurant-card__title">
                          <h3>{item.name || "Unnamed restaurant"}</h3>
                          <span className="owner-pill owner-pill--active">
                            {item.isActive === false ? "Inactive" : "Active"}
                          </span>
                        </div>
                        <p>{item.address || "Address not available"}</p>
                        <p>
                          {Array.isArray(item.cuisine)
                            ? item.cuisine.join(" · ")
                            : item.cuisine || "Cuisine not specified"}
                        </p>
                        <small>{item.menu?.length ?? 0} menu items</small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="owner-empty">
                  <h3>No restaurants found</h3>
                  <p>No active restaurant listings were returned.</p>
                </div>
              )}
            </section>
          )}

          <footer className="owner-footer">
            <span>Khao To Jano · Owner Console</span>
            <span>Managing: {restaurant?.name || "My Restaurant"}</span>
          </footer>
        </div>
      </div>
    </main>
  );
}

export default OwnerDashboard;