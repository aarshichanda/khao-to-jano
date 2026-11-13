import Joi from "joi";

const menuItemSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().allow("").default(""),
  price: Joi.number().min(0).required(),
  isAvailable: Joi.boolean(),
});

export const restaurantSchema = Joi.object({
  name: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  image: Joi.string().trim().allow(""),
  cuisine: Joi.array().items(Joi.string().trim()),
  rating: Joi.number().min(0).max(5).allow(null),
  deliveryTime: Joi.string().trim().allow(""),
  menu: Joi.array().items(menuItemSchema),
  isActive: Joi.boolean(),
});