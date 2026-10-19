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
import Checkout from "./components/Checkout";
import OrderConfirmation from "./components/OrderConfirmation";
import MyOrders from "./components/MyOrders";
import Restaurants from "./components/Restaurants";
import RestaurantDetails from "./components/RestaurantDetails";
import ProtectedRoute from './components/ProtectedRoute';
import OwnerDashboard from './components/OwnerDashboard';

import "./App.css";

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

        {/* E-Commerce Core State Views */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/food/:name" element={<FoodDetails />} />

        {/* Authenticated Verification Entry Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Purchase & Processing Flows */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
        <Route path="/orders" element={<MyOrders />} />

        {/* Restaurant Directory Collections */}
        <Route path="/restaurants" element={<Restaurants />} />
        
        {/* Restaurant Details route */}
        <Route path="/restaurants/:id" element={<RestaurantDetails />} />

        {/* 🔒 PROTECTED RESTRICTED ROUTES: Accessible strictly by authenticated Restaurant Owners */}
        <Route element={<ProtectedRoute allowedRoles={['restaurant_owner']} />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
