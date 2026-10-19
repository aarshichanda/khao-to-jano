
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
} from "../redux/cartSlice";

function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector((state) => state.cart.items);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <main className="cart-page">
        <section className="cart-empty">
          <p className="cart-label">YOUR CART</p>

          <h1>Your cart is empty</h1>

          <p>
            Add something delicious from our menu
            and it will appear here.
          </p>

          <button
            className="cart-menu-button"
            onClick={() => navigate("/menu")}
          >
            Explore Menu
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-header">
        <p className="cart-label">YOUR CART</p>

        <h1>Your delicious selections</h1>

        <p>
          Review your items before moving to checkout.
        </p>
      </section>

      <section className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => {
            const restaurantId =
              item.restaurantId?._id ??
              item.restaurantId ??
              "static-menu";

            const dishId =
              item.dishId?._id ??
              item.dishId ??
              item._id ??
              item.name;

            const itemKey = `${restaurantId}::${dishId}`;

            return (
              <article
                className="cart-item"
                key={itemKey}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-image"
                  />
                ) : (
                  <div
                    className="cart-item-image cart-item-image-placeholder"
                    role="img"
                    aria-label="No dish image available"
                  >
                    Image unavailable
                  </div>
                )}

                <div className="cart-item-details">
                  <h2>{item.name}</h2>

                  {item.restaurantName && (
                    <p className="cart-item-restaurant">
                      From {item.restaurantName}
                    </p>
                  )}

                  <p>{item.description}</p>

                  <span className="cart-item-price">
                    ₹{item.price}
                  </span>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() =>
                        dispatch(decreaseQuantity(item))
                      }
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() =>
                        dispatch(increaseQuantity(item))
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="remove-button"
                    onClick={() =>
                      dispatch(removeFromCart(item))
                    }
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>₹{subtotal.toFixed(2)}</strong>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <strong>₹{subtotal.toFixed(2)}</strong>
          </div>

          <button
            className="checkout-button"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>
        </aside>
      </section>
    </main>
  );
}

export default Cart;
