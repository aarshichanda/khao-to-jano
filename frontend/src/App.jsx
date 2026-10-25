
import { Routes, Route } from "react-router-dom";

import Hero from "./components/Hero";
import CategorySection from "./components/category";
import PopularDishes from "./components/PopularDishes";
import OurStory from "./components/OurStory";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Menu from "./components/Menu";
import Cart from "./components/Cart";
import FoodDetails from "./components/FoodDetails";
import Login from "./components/Login";
import Register from "./components/Register";
import OwnerRegister from "./components/OwnerRegister";
import Checkout from "./components/Checkout";
import OrderConfirmation from "./components/OrderConfirmation";
import MyOrders from "./components/MyOrders";
import Restaurants from "./components/Restaurants";
import RestaurantDetails from "./components/RestaurantDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerDashboard from "./components/OwnerDashboard";
import CustomerDashboard from "./components/CustomerDashboard";
import ActivateOwner from "./components/ActivateOwner";
import AdminDashboard from "./components/AdminDashboard";
import RestaurantDashboard from "./components/RestaurantDashboard";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

import "./styles/index.css";
import "./styles/App.css";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Home View */}
        <Route
          path="/"
          element={
            <>
              <Hero />
              <CategorySection />
              <Restaurants />
              <PopularDishes />
              <OurStory />
              <CTA />
              <Footer />
            </>
          }
        />

        {/* Static Content Routes */}
        <Route path="/our-story" element={<OurStory />} />
        <Route path="/menu" element={<Menu />} />

        {/* Cart and Food Details */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/food/:name" element={<FoodDetails />} />

        {/* Customer and Restaurant Owner Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/owner/register" element={<OwnerRegister />} />
        <Route path="/activate-owner" element={<ActivateOwner />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Checkout and Orders */}
        <Route path="/checkout" element={<Checkout />} />
        <Route
          path="/order-confirmation/:id"
          element={<OrderConfirmation />}
        />
        <Route path="/orders" element={<MyOrders />} />

        {/* Restaurant Directory */}
        <Route path="/restaurants" element={<Restaurants />} />
        <Route
          path="/restaurants/:id"
          element={<RestaurantDetails />}
        />

        {/* Protected Customer Dashboard */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route
            path="/customer/dashboard"
            element={<CustomerDashboard />}
          />
        </Route>

        {/* Protected Restaurant Owner Dashboard */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["restaurant_owner"]} />
          }
        >
          <Route
            path="/owner/dashboard"
            element={<OwnerDashboard />}
          />
        </Route>
        {/* Protected Restaurant Dashboard */}
       <Route
            element={
        <ProtectedRoute allowedRoles={["restaurant_owner"]} />
        }
        >
       <Route
          path="/restaurant/dashboard"
          element={<RestaurantDashboard />}
        />
        </Route>
        {/* Protected Admin Dashboard */}
       <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />
     </Route>
      </Routes>
    </>
  );
}

export default App;
