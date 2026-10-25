
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./../styles/AdminDashboard.css";
import API_BASE_URL, { API_URL } from "../api";

const API_BASE = API_URL;
const APPLICATIONS_API = `${API_BASE}/owner-applications`;
const RESTAURANTS_API = `${API_BASE}/restaurants`;
const ADMIN_ORDERS_API = `${API_BASE}/admin/orders`;

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "restaurants", label: "Restaurants", icon: "▤" },
  { id: "applications", label: "Owner Applications", icon: "♙" },
  { id: "orders", label: "Orders", icon: "▣" },
  { id: "customers", label: "Customers", icon: "♧" },
];

const ORDER_STATUSES = [
  "ALL",
  "PLACED",
  "RESTAURANT_ACCEPTED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
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

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getRecordId(record) {
  return record?._id || record?.id || "";
}

function getCustomerName(customer) {
  if (!customer) return "Customer details unavailable";
  if (typeof customer === "string") return "Customer";

  return (
    customer.name ||
    customer.username ||
    customer.fullName ||
    customer.email ||
    "Customer"
  );
}

function getRestaurantName(restaurant) {
  if (!restaurant) return "Restaurant details unavailable";
  if (typeof restaurant === "string") return "Restaurant";

  return restaurant.name || "Unnamed restaurant";
}

function getOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [applications, setApplications] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [availableExistingRestaurants, setAvailableExistingRestaurants] =
    useState([]);
  const [selectedExistingRestaurant, setSelectedExistingRestaurant] =
    useState({});
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  const getToken = () => localStorage.getItem("token");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Admin login token not found. Please log in again.");
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [
        applicationsResponse,
        restaurantsResponse,
        availableExistingRestaurantsResponse,
      ] = await Promise.all([
        fetch(APPLICATIONS_API, { headers }),
        fetch(RESTAURANTS_API, { headers }),
        fetch(`${APPLICATIONS_API}/available-existing-restaurants`, {
          headers,
        }).catch(() => null),
      ]);

      const applicationsData = await applicationsResponse.json();
      const restaurantsData = await restaurantsResponse.json();

      if (!applicationsResponse.ok) {
        throw new Error(
          applicationsData.message || "Could not load owner applications."
        );
      }

      if (!restaurantsResponse.ok) {
        throw new Error(
          restaurantsData.message || "Could not load restaurants."
        );
      }

      let availableExistingRestaurantsData = null;

      if (availableExistingRestaurantsResponse?.ok) {
        try {
          availableExistingRestaurantsData =
            await availableExistingRestaurantsResponse.json();
        } catch (err) {
          console.error("Could not parse available restaurants:", err);
        }
      }

      const applicationRecords = Array.isArray(applicationsData)
        ? applicationsData
        : applicationsData.applications ?? applicationsData.data ?? [];

      const restaurantRecords = Array.isArray(restaurantsData)
        ? restaurantsData
        : restaurantsData.restaurants ?? restaurantsData.data ?? [];

      let availableExistingRestaurantRecords = [];

      if (availableExistingRestaurantsData) {
        availableExistingRestaurantRecords = Array.isArray(
          availableExistingRestaurantsData
        )
          ? availableExistingRestaurantsData
          : availableExistingRestaurantsData.restaurants ??
            availableExistingRestaurantsData.data ??
            [];
      }

      if (!Array.isArray(applicationRecords)) {
        throw new Error("Unexpected owner application data.");
      }

      if (!Array.isArray(restaurantRecords)) {
        throw new Error("Unexpected restaurant data.");
      }

      if (
        !Array.isArray(availableExistingRestaurantRecords) ||
        availableExistingRestaurantRecords.length === 0
      ) {
        availableExistingRestaurantRecords = restaurantRecords;
      }

      setApplications(applicationRecords);
      setRestaurants(restaurantRecords);
      setAvailableExistingRestaurants(availableExistingRestaurantRecords);
    } catch (err) {
      console.error("Admin dashboard loading failed:", err);
      setError(err.message || "Could not load the Admin Dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setOrdersLoading(true);
    setOrderError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Admin login token not found. Please log in again.");
      }

      const response = await fetch(ADMIN_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Could not load marketplace orders.");
      }

      const records = Array.isArray(data)
        ? data
        : data.orders ?? data.data ?? [];

      if (!Array.isArray(records)) {
        throw new Error("Unexpected marketplace order response.");
      }

      setOrders(records);
    } catch (err) {
      setOrderError(err.message || "Could not load marketplace orders.");
    } finally {
      if (showLoading) setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadOrders();
  }, [loadDashboard, loadOrders]);

  // Refresh admin orders when the restaurant accepts or updates an order.
  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;

    const socket = io(API_BASE_URL,  {
      auth: { token },
    });

    const handleOrderUpdate = () => {
      loadOrders({ showLoading: false });
    };

    socket.on("order-updated", handleOrderUpdate);

    socket.on("connect_error", (err) => {
      console.error("Admin Socket.IO connection failed:", err.message);
    });

    return () => {
      socket.off("order-updated", handleOrderUpdate);
      socket.disconnect();
    };
  }, [loadOrders]);

  const refreshAll = async () => {
    await Promise.all([loadDashboard(), loadOrders()]);
  };

  const assignExistingRestaurant = async (applicationId) => {
    const restaurantId = selectedExistingRestaurant[applicationId];

    if (!restaurantId) {
      setError("Please select an existing restaurant first.");
      return;
    }

    setActionId(applicationId);
    setError("");
    setNotice("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Admin login token not found. Please log in again.");
      }

      const response = await fetch(
        `${APPLICATIONS_API}/${applicationId}/assign-existing`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ restaurantId }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Could not assign the restaurant.");
      }

      setNotice(data.message || "Existing restaurant linked to application.");

      setSelectedExistingRestaurant((previous) => ({
        ...previous,
        [applicationId]: "",
      }));

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Could not assign the restaurant.");
    } finally {
      setActionId(null);
    }
  };

  const reviewApplication = async (id, action) => {
    setActionId(id);
    setError("");
    setNotice("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Admin login token not found. Please log in again.");
      }

      const response = await fetch(`${APPLICATIONS_API}/${id}/${action}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || `Could not ${action} application.`);
      }

      setNotice(
        data.message ||
          `Application ${
            action === "approve" ? "approved" : "rejected"
          } successfully.`
      );

      await loadDashboard();
    } catch (err) {
      setError(err.message || "The action failed.");
    } finally {
      setActionId(null);
    }
  };

  const updateOrderStatus = async (order, orderStatus) => {
    const id = getRecordId(order);

    if (!id) {
      setOrderError("Cannot update this order because its ID is missing.");
      return;
    }

    if (order.orderStatus !== "RESTAURANT_ACCEPTED") {
      setOrderError(
        "The restaurant must accept the order before KTJ admin can confirm or cancel it."
      );
      return;
    }

    if (!["CONFIRMED", "CANCELLED"].includes(orderStatus)) {
      setOrderError("Unsupported admin order action.");
      return;
    }

    if (
      orderStatus === "CANCELLED" &&
      !window.confirm("Cancel this order? This action cannot be undone.")
    ) {
      return;
    }

    setActionId(id);
    setOrderError("");
    setError("");
    setNotice("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Admin login token not found. Please log in again.");
      }

      const response = await fetch(`${ADMIN_ORDERS_API}/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderStatus }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Could not update order status.");
      }

      setNotice(
        data.message || `Order ${formatStatus(orderStatus).toLowerCase()}.`
      );

      await loadOrders({ showLoading: false });
    } catch (err) {
      setOrderError(err.message || "Could not update order status.");
    } finally {
      setActionId(null);
    }
  };

  const pendingApplications = applications.filter(
    (application) => application.status === "pending"
  );

  const approvedApplications = applications.filter(
    (application) => application.status === "approved"
  );

  const rejectedApplications = applications.filter(
    (application) => application.status === "rejected"
  );

  const filteredOrders =
    orderStatusFilter === "ALL"
      ? orders
      : orders.filter((order) => order.orderStatus === orderStatusFilter);

  const placedOrders = orders.filter(
    (order) => order.orderStatus === "RESTAURANT_ACCEPTED"
  );

  const renderApplications = () => {
    if (loading) {
      return <div className="admin-empty-state">Loading applications...</div>;
    }

    if (applications.length === 0) {
      return (
        <div className="admin-empty-state">
          <span className="admin-empty-icon">♙</span>
          <h3>No applications yet</h3>
          <p>New restaurant-owner applications will appear here.</p>
        </div>
      );
    }

    return (
      <div className="admin-application-list">
        {applications.map((application) => {
          const id = getRecordId(application);
          const status = application.status || "unknown";
          const pending = status === "pending";

          return (
            <article className="admin-application-card" key={id}>
              <div className="admin-application-top">
                <div>
                  <h3>{application.restaurantName || "Unnamed restaurant"}</h3>
                  <p className="admin-muted">
                    Applicant: {application.applicantName || "Not provided"}
                  </p>
                </div>

                <span className={`admin-status status-${status}`}>
                  {status}
                </span>
              </div>

              <div className="admin-application-details">
                <p>
                  <strong>Email</strong>
                  <span>{application.email || "—"}</span>
                </p>
                <p>
                  <strong>Phone</strong>
                  <span>{application.phone || "—"}</span>
                </p>
                <p>
                  <strong>Address</strong>
                  <span>{application.restaurantAddress || "—"}</span>
                </p>
                <p>
                  <strong>Cuisine</strong>
                  <span>
                    {Array.isArray(application.cuisine)
                      ? application.cuisine.join(", ") || "Not specified"
                      : application.cuisine || "Not specified"}
                  </span>
                </p>
              </div>

              {pending && (
                <div className="admin-application-actions admin-owner-assignment">
                  <label className="admin-existing-restaurant-field">
                    Assign an existing restaurant
                    <select
                      value={selectedExistingRestaurant[id] || ""}
                      onChange={(event) =>
                        setSelectedExistingRestaurant((previous) => ({
                          ...previous,
                          [id]: event.target.value,
                        }))
                      }
                      disabled={actionId !== null}
                    >
                      <option value="">Select restaurant...</option>
                      {availableExistingRestaurants.map((restaurant) => (
                        <option
                          key={getRecordId(restaurant)}
                          value={getRecordId(restaurant)}
                        >
                          {restaurant.name || "Unnamed restaurant"} —{" "}
                          {restaurant.address || "Address not provided"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    className="admin-approve-button"
                    disabled={
                      actionId !== null || !selectedExistingRestaurant[id]
                    }
                    onClick={() => assignExistingRestaurant(id)}
                  >
                    {actionId === id
                      ? "Processing..."
                      : "Link Existing Restaurant"}
                  </button>

                  <button
                    type="button"
                    className="admin-approve-button"
                    disabled={actionId !== null}
                    onClick={() => reviewApplication(id, "approve")}
                  >
                    {actionId === id ? "Processing..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    className="admin-reject-button"
                    disabled={actionId !== null}
                    onClick={() => reviewApplication(id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  const renderRestaurants = () => {
    if (loading) {
      return <div className="admin-empty-state">Loading restaurants...</div>;
    }

    if (restaurants.length === 0) {
      return (
        <div className="admin-empty-state">
          <span className="admin-empty-icon">▤</span>
          <h3>No active restaurants returned</h3>
          <p>
            This list uses the existing public endpoint, which returns active
            restaurants only.
          </p>
        </div>
      );
    }

    return (
      <div className="admin-restaurant-grid">
        {restaurants.map((restaurant) => (
          <article
            className="admin-restaurant-card"
            key={getRecordId(restaurant)}
          >
            {restaurant.image ? (
              <img
                className="admin-restaurant-image"
                src={restaurant.image}
                alt={restaurant.name || "Restaurant"}
              />
            ) : (
              <div className="admin-restaurant-image admin-image-placeholder">
                Restaurant
              </div>
            )}

            <div className="admin-restaurant-content">
              <div className="admin-restaurant-title">
                <h3>{restaurant.name || "Unnamed restaurant"}</h3>
                <span className="admin-status status-approved">Active</span>
              </div>

              <p>{restaurant.address || "Address not provided"}</p>

              <p>
                {Array.isArray(restaurant.cuisine)
                  ? restaurant.cuisine.join(" · ") || "Cuisine not specified"
                  : restaurant.cuisine || "Cuisine not specified"}
              </p>

              <div className="admin-restaurant-meta">
                <span>Rating: {restaurant.rating ?? "—"}</span>
                <span>Menu items: {restaurant.menu?.length ?? 0}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderOrders = () => {
    if (ordersLoading) {
      return (
        <div className="admin-empty-state">
          <h3>Loading marketplace orders...</h3>
          <p>Retrieving orders across restaurants.</p>
        </div>
      );
    }

    if (orderError && orders.length === 0) {
      return (
        <div className="admin-empty-state" role="alert">
          <h3>Could not load marketplace orders</h3>
          <p>{orderError}</p>
          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => loadOrders()}
          >
            Try again
          </button>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="admin-empty-state">
          <span className="admin-empty-icon">▣</span>
          <h3>No marketplace orders yet</h3>
          <p>
            Orders from all restaurants will appear here when customers place
            them.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="admin-section-heading">
          <div>
            <h2>Marketplace orders</h2>
            <p>
              {orders.length} total orders · {placedOrders.length} awaiting
              KTJ admin approval
            </p>
          </div>

          <select
            className="admin-order-filter"
            value={orderStatusFilter}
            onChange={(event) => setOrderStatusFilter(event.target.value)}
            aria-label="Filter orders by status"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        {orderError && (
          <div className="admin-message admin-error" role="alert">
            <strong>Order action failed</strong>
            <span>{orderError}</span>
            <button type="button" onClick={() => setOrderError("")}>
              Dismiss
            </button>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No orders match this filter</h3>
            <p>Select another order status to see more records.</p>
          </div>
        ) : (
          <div className="admin-orders-list">
            {filteredOrders.map((order) => {
              const id = getRecordId(order);
              const status = order.orderStatus || "UNKNOWN";
              const canReview = status === "RESTAURANT_ACCEPTED";
              const customer = order.customer;
              const restaurant = order.restaurant;
              const items = getOrderItems(order);
              const deliveryAddress = order.deliveryAddress;
              const isProcessing = actionId === id;

              return (
                <article className="admin-order-card" key={id}>
                  <div className="admin-order-header">
                    <div>
                      <h3>Order #{String(id).slice(-8).toUpperCase()}</h3>
                      <p className="admin-muted">
                        Placed {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`admin-status status-${status.toLowerCase()}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </div>

                  <div className="admin-order-details">
                    <p>
                      <strong>Restaurant</strong>
                      <br />
                      {getRestaurantName(restaurant)}
                    </p>

                    <p>
                      <strong>Customer</strong>
                      <br />
                      {getCustomerName(customer)}
                      {customer?.email ? (
                        <>
                          <br />
                          {customer.email}
                        </>
                      ) : null}
                    </p>

                    <p>
                      <strong>Payment method</strong>
                      <br />
                      {order.paymentMethod || "Not specified"}
                    </p>

                    <p>
                      <strong>Payment status</strong>
                      <br />
                      {formatStatus(order.paymentStatus || "UNKNOWN")}
                    </p>

                    {deliveryAddress && (
                      <p>
                        <strong>Delivery address</strong>
                        <br />
                        {typeof deliveryAddress === "string"
                          ? deliveryAddress
                          : [
                              deliveryAddress.street,
                              deliveryAddress.addressLine,
                              deliveryAddress.city,
                              deliveryAddress.state,
                              deliveryAddress.postalCode,
                            ]
                              .filter(Boolean)
                              .join(", ") || "Address not provided"}
                      </p>
                    )}
                  </div>

                  <ul className="admin-order-items">
                    {items.length === 0 ? (
                      <li>Order item details unavailable</li>
                    ) : (
                      items.map((item, index) => (
                        <li
                          key={item._id || item.id || `${item.name}-${index}`}
                        >
                          {item.name || item.dishName || "Menu item"} ×{" "}
                          {item.quantity || 1} —{" "}
                          {formatCurrency(
                            Number(item.price || 0) *
                              Number(item.quantity || 1)
                          )}
                        </li>
                      ))
                    )}
                  </ul>

                  <div className="admin-order-total">
                    <span>Order total</span>
                    <strong>
                      {formatCurrency(order.totalAmount ?? order.total)}
                    </strong>
                  </div>

                  {canReview ? (
                    <div className="admin-order-actions">
                      <button
                        type="button"
                        className="admin-order-confirm-button"
                        disabled={actionId !== null}
                        onClick={() => updateOrderStatus(order, "CONFIRMED")}
                      >
                        {isProcessing ? "Processing..." : "Confirm order"}
                      </button>

                      <button
                        type="button"
                        className="admin-order-cancel-button"
                        disabled={actionId !== null}
                        onClick={() => updateOrderStatus(order, "CANCELLED")}
                      >
                        Cancel order
                      </button>
                    </div>
                  ) : (
                    <p className="admin-muted">
                      {status === "PLACED"
                        ? "Awaiting restaurant acceptance."
                        : "This order is no longer awaiting admin approval."}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const renderOverview = () => (
    <>
      <section className="admin-metrics-grid">
        <article className="admin-metric-card">
          <span className="admin-metric-icon purple">▤</span>
          <p>Active Restaurants</p>
          <strong>{loading ? "—" : restaurants.length}</strong>
          <span className="admin-metric-footnote">From the restaurant API</span>
        </article>

        <article className="admin-metric-card">
          <span className="admin-metric-icon orange">♙</span>
          <p>Total Applications</p>
          <strong>{loading ? "—" : applications.length}</strong>
          <span className="admin-metric-footnote">
            All returned application statuses
          </span>
        </article>

        <article className="admin-metric-card">
          <span className="admin-metric-icon yellow">◷</span>
          <p>Pending Applications</p>
          <strong>{loading ? "—" : pendingApplications.length}</strong>
          <span className="admin-metric-footnote">Awaiting admin review</span>
        </article>

        <article className="admin-metric-card">
          <span className="admin-metric-icon green">✓</span>
          <p>Awaiting KTJ Approval</p>
          <strong>{ordersLoading ? "—" : placedOrders.length}</strong>
          <span className="admin-metric-footnote">
            Restaurant-accepted orders
          </span>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel admin-overview-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Owner Applications</h2>
              <p>Review requests to join the marketplace.</p>
            </div>

            <button
              type="button"
              className="admin-text-button"
              onClick={() => setActiveSection("applications")}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <p className="admin-muted">Loading applications...</p>
          ) : pendingApplications.length === 0 ? (
            <div className="admin-inline-empty">
              <span>✓</span>
              <p>No pending applications to review.</p>
            </div>
          ) : (
            <div className="admin-recent-list">
              {pendingApplications.slice(0, 5).map((application) => (
                <div
                  className="admin-recent-row"
                  key={getRecordId(application)}
                >
                  <div className="admin-avatar">
                    {(application.restaurantName || "R")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="admin-recent-info">
                    <strong>
                      {application.restaurantName || "Unnamed restaurant"}
                    </strong>
                    <span>
                      {application.applicantName || "Applicant not specified"}
                    </span>
                  </div>

                  <span className="admin-status status-pending">Pending</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="admin-panel admin-overview-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Restaurant Directory</h2>
              <p>Active restaurant listings currently available.</p>
            </div>

            <button
              type="button"
              className="admin-text-button"
              onClick={() => setActiveSection("restaurants")}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <p className="admin-muted">Loading restaurants...</p>
          ) : restaurants.length === 0 ? (
            <p className="admin-muted">No active restaurants returned.</p>
          ) : (
            <div className="admin-recent-list">
              {restaurants.slice(0, 5).map((restaurant) => (
                <div
                  className="admin-recent-row"
                  key={getRecordId(restaurant)}
                >
                  {restaurant.image ? (
                    <img
                      className="admin-small-restaurant-image"
                      src={restaurant.image}
                      alt=""
                    />
                  ) : (
                    <div className="admin-small-restaurant-image admin-small-placeholder">
                      ▤
                    </div>
                  )}

                  <div className="admin-recent-info">
                    <strong>{restaurant.name || "Unnamed restaurant"}</strong>
                    <span>{restaurant.address || "Address not provided"}</span>
                  </div>

                  <span className="admin-status status-approved">Active</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="admin-panel admin-data-notice">
        <div className="admin-data-notice-icon">i</div>
        <div>
          <h2>Marketplace orders</h2>
          <p>
            The Orders section uses the authenticated admin endpoint to display
            orders across restaurants. Order totals are customer order values
            and should not be treated as KTJ commission revenue.
          </p>
          <button
            type="button"
            className="admin-text-button"
            onClick={() => setActiveSection("orders")}
          >
            Review marketplace orders →
          </button>
        </div>
      </section>
    </>
  );

  const sectionTitles = {
    overview: {
      title: "Dashboard Overview",
      subtitle: "Monitor Khao To Jano marketplace activity.",
    },
    restaurants: {
      title: "Restaurants",
      subtitle: "Browse active restaurants in the marketplace.",
    },
    applications: {
      title: "Owner Applications",
      subtitle: "Review and manage restaurant onboarding requests.",
    },
    orders: {
      title: "Orders",
      subtitle: "Review restaurant-accepted orders and approve or cancel them.",
    },
    customers: {
      title: "Customers",
      subtitle: "Customer management is not connected yet.",
    },
  };

  const currentSection = sectionTitles[activeSection];

  const navigateTo = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);

    if (sectionId === "orders") {
      loadOrders();
    }
  };

  return (
    <main className="admin-shell">
      {mobileMenuOpen && (
        <button
          type="button"
          className="admin-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}
      >
        <div className="admin-brand">
          <div className="admin-brand-mark">K</div>
          <div>
            <strong>KHAO TO JANO</strong>
            <span>ADMIN CONSOLE</span>
          </div>
        </div>

        <div className="admin-nav-label">WORKSPACE</div>

        <nav className="admin-navigation" aria-label="Admin navigation">
          {NAVIGATION.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${
                activeSection === item.id ? "active" : ""
              }`}
              onClick={() => navigateTo(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>

              {item.id === "applications" &&
                pendingApplications.length > 0 && (
                  <span className="admin-nav-count">
                    {pendingApplications.length}
                  </span>
                )}

              {item.id === "orders" && placedOrders.length > 0 && (
                <span className="admin-nav-count">{placedOrders.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-help">
            <span className="admin-help-icon">?</span>
            <div>
              <strong>Admin workspace</strong>
              <span>Marketplace management</span>
            </div>
          </div>

          <div className="admin-profile">
            <div className="admin-profile-avatar">A</div>
            <div>
              <strong>KTJ Admin</strong>
              <span>Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-mobile-menu-button"
            aria-label="Open navigation"
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>

          <div className="admin-breadcrumb">
            <span>KTJ Admin</span>
            <span>/</span>
            <strong>{currentSection.title}</strong>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={refreshAll}
            disabled={loading || ordersLoading || actionId !== null}
          >
            <span
              className={loading || ordersLoading ? "admin-refreshing" : ""}
            >
              ↻
            </span>
            {loading || ordersLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <div className="admin-page-content">
          <header className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">KHAO TO JANO · ADMINISTRATION</p>
              <h1>{currentSection.title}</h1>
              <p>{currentSection.subtitle}</p>
            </div>

            <div className="admin-date-label">
              <span className="admin-live-dot" />
              Marketplace workspace
            </div>
          </header>

          {error && (
            <div className="admin-message admin-error" role="alert">
              <strong>Unable to load dashboard data</strong>
              <span>{error}</span>
              <button type="button" onClick={loadDashboard}>
                Try again
              </button>
            </div>
          )}

          {notice && (
            <div className="admin-message admin-notice" role="status">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")}>
                Dismiss
              </button>
            </div>
          )}

          {activeSection === "overview" && renderOverview()}

          {activeSection === "restaurants" && (
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>Active Restaurant Directory</h2>
                  <p>
                    {restaurants.length} active listings returned by the API.
                    Inactive listings require an admin-specific endpoint.
                  </p>
                </div>
              </div>

              {renderRestaurants()}
            </section>
          )}

          {activeSection === "applications" && (
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>All Owner Applications</h2>
                  <p>
                    {pendingApplications.length} pending ·{" "}
                    {approvedApplications.length} approved ·{" "}
                    {rejectedApplications.length} rejected
                  </p>
                </div>
              </div>

              {renderApplications()}
            </section>
          )}

          {activeSection === "orders" && (
            <section className="admin-section">{renderOrders()}</section>
          )}

          {activeSection === "customers" && (
            <section className="admin-empty-state admin-coming-soon">
              <span className="admin-empty-icon">♧</span>
              <h2>Customer management</h2>
              <p>
                Customer management is not connected yet. Marketplace orders
                are available in the Orders section.
              </p>
            </section>
          )}

          <footer className="admin-footer">
            <span>Khao To Jano Admin Console</span>
            <span>Marketplace management</span>
          </footer>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;
