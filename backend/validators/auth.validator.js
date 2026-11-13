import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2),
  username: Joi.string().trim().min(2),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().trim().allow(""),
  password: Joi.string().min(6).required(),
}).or("name", "username");

export const loginSchema = Joi.object({
  identifier: Joi.string().trim(),
  username: Joi.string().trim(),
  email: Joi.string().trim(),
  password: Joi.string().required(),
}).or("identifier", "username", "email");

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().required(),

  password: Joi.string().min(12).required(),

  confirmPassword: Joi.string().valid(Joi.ref("password")),
});
export const activateOwnerSchema = Joi.object({
  token: Joi.string().trim().required(),
  password: Joi.string().min(12),
  loginUsername: Joi.string().trim().lowercase().allow(""),
});