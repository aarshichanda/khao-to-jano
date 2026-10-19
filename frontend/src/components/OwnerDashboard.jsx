import React from 'react';

function OwnerDashboard() {
  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "30px" }}>
        <h1 style={{ color: "#333", margin: "0" }}>🍳 Restaurant Owner Control Panel</h1>
        <p style={{ color: "#777", margin: "5px 0 0 0" }}>Manage your kitchen menu grid pipeline and incoming orders.</p>
      </header>

      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div style={{ flex: "1", background: "#8B2222", color: "#fff", padding: "20px", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Active Orders</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: "0" }}>3 Pending</p>
        </div>
        <div style={{ flex: "1", background: "#e28743", color: "#fff", padding: "20px", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Today's Revenue</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: "0" }}>₹4,250.00</p>
        </div>
      </div>

      <section style={{ backgroundColor: "#f9f9f9", padding: "25px", borderRadius: "8px", border: "1px solid #eee" }}>
        <h2 style={{ margin: "0 0 15px 0", color: "#444" }}>Incoming Kitchen Stream</h2>
        <p style={{ color: "#666", fontStyle: "italic", fontSize: "14px" }}>No connection block errors. Real-time Socket.io active listener loading dashboard feed strings...</p>
      </section>
    </main>
  );
}

export default OwnerDashboard;
