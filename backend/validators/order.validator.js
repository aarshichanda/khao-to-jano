import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const itemSchema = Joi.object({
  dishId: objectId.required(),
  quantity: Joi.number().integer().min(1).required(),
});

const restaurantGroupSchema = Joi.object({
  restaurant: objectId.required(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const addressSchema = Joi.object({
  street: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  postalCode: Joi.string().trim().required(),
});

export const orderSchema = Joi.object({
  restaurant: objectId,
  items: Joi.array().items(itemSchema).min(1),

  restaurants: Joi.array()
    .items(restaurantGroupSchema)
    .min(1),

  deliveryAddress: addressSchema.required(),

  phone: Joi.string().trim().required(),

  paymentMethod: Joi.string()
    .valid("COD", "ONLINE")
    .required(),

  couponCode: Joi.string().trim().allow("").default(""),

  idempotencyKey: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required(),
}).custom((value, helpers) => {
  if (value.restaurants?.length) {
    return value;
  }

  if (value.restaurant && value.items?.length) {
    return value;
  }

  return helpers.error("any.custom");
}).messages({
  "any.custom":
    "Provide either a restaurant with its items or a restaurants array.",
});