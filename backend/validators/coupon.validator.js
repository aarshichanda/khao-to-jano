import Joi from "joi";

export const couponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),

  discountType: Joi.string()
    .valid("percentage", "flat")
    .required(),

  discountValue: Joi.number().min(0).required(),

  minOrderAmount: Joi.number().min(0).default(0),

  maxDiscountAmount: Joi.number().min(0),

  expiryDate: Joi.date().iso().required(),

  isActive: Joi.boolean().default(true),
});

export const couponValidationSchema = Joi.object({
  couponCode: Joi.string().trim().uppercase().required(),

  orderTotal: Joi.number().min(0).required(),
});