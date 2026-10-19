import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

// Identify a cart item safely by restaurant ID, dish ID, or simple item name.
const getCartItemKey = (item) => {
  if (!item) return "";
  
  const restaurantId =
    item.restaurantId?._id ?? item.restaurantId ?? null;

  const dishId =
    item.dishId?._id ??
    item.dishId ??
    item._id ??
    null;

  // 💡 Safe Fallback: If structured IDs aren't present yet, use the item's name as a unique key
  if (!restaurantId && !dishId && item.name) {
    return `item::${item.name}`;
  }

  return `${restaurantId ?? "static-menu"}::${dishId ?? item.name}`;
};

const cartSlice = createSlice({
  name: "cart",
  initialState,

  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;

      const existingItem = state.items.find(
        (item) => getCartItemKey(item) === getCartItemKey(newItem)
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          ...newItem,
          quantity: 1,
        });
      }
    },

    removeFromCart: (state, action) => {
      const target = action.payload;

      if (typeof target === "string") {
        state.items = state.items.filter(
          (item) => item.name !== target
        );
        return;
      }

      if (!target || typeof target !== "object") {
        return;
      }

      state.items = state.items.filter(
        (item) => getCartItemKey(item) !== getCartItemKey(target)
      );
    },

    increaseQuantity: (state, action) => {
      const target = action.payload;

      const item = state.items.find((cartItem) => {
        if (typeof target === "string") {
          return cartItem.name === target;
        }

        if (!target || typeof target !== "object") {
          return false;
        }

        return getCartItemKey(cartItem) === getCartItemKey(target);
      });

      if (item) {
        item.quantity += 1;
      }
    },

    decreaseQuantity: (state, action) => {
      const target = action.payload;

      const item = state.items.find((cartItem) => {
        if (typeof target === "string") {
          return cartItem.name === target;
        }

        if (!target || typeof target !== "object") {
          return false;
        }

        return getCartItemKey(cartItem) === getCartItemKey(target);
      });

      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
