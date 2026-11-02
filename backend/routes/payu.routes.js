import express from "express";
import crypto from "node:crypto";
import { protect } from "../middleware/auth.middleware.js";
import Order from "../models/order.model.js";

const router = express.Router();

const sha512 = (value) =>
  crypto.createHash("sha512").update(value).digest("hex");

const safeEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = Buffer.from(a.toLowerCase(), "utf8");
  const right = Buffer.from(b.toLowerCase(), "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const getConfig = () => {
  const {
    PAYU_KEY,
    PAYU_SALT,
    PAYU_BASE_URL,
    BACKEND_PUBLIC_URL,
    FRONTEND_URL,
  } = process.env;

  const missing = [
    ["PAYU_KEY", PAYU_KEY],
    ["PAYU_SALT", PAYU_SALT],
    ["PAYU_BASE_URL", PAYU_BASE_URL],
    ["BACKEND_PUBLIC_URL", BACKEND_PUBLIC_URL],
    ["FRONTEND_URL", FRONTEND_URL],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing PayU configuration: ${missing.join(", ")}`);
  }

  const baseUrl = PAYU_BASE_URL.replace(/\/+$/, "");

  return {
    PAYU_KEY,
    PAYU_SALT,
    PAYU_BASE_URL: baseUrl.endsWith("/_payment")
      ? baseUrl
      : `${baseUrl}/_payment`,
    BACKEND_PUBLIC_URL: BACKEND_PUBLIC_URL.replace(/\/+$/, ""),
    FRONTEND_URL: FRONTEND_URL.replace(/\/+$/, ""),
  };
};

router.post("/initiate", protect, async (req, res) => {
  try {
    const config = getConfig();
    const { checkoutId } = req.body ?? {};

    if (typeof checkoutId !== "string" || !checkoutId.trim()) {
      return res.status(400).json({
        success: false,
        message: "checkoutId is required.",
      });
    }

    const orders = await Order.find({
      checkoutId: checkoutId.trim(),
      customer: req.user._id,
      paymentMethod: "ONLINE",
      paymentStatus: "PENDING",
    });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "Pending online checkout not found.",
      });
    }

    const amounts = orders.map((order) => Number(order.totalAmount));

    if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
      return res.status(400).json({
        success: false,
        message: "The checkout contains an invalid order amount.",
      });
    }

    const totalPaise = amounts.reduce(
      (sum, amount) => sum + Math.round(amount * 100),
      0,
    );

    if (!Number.isSafeInteger(totalPaise) || totalPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: "The checkout total must be greater than zero.",
      });
    }

    const amount = (totalPaise / 100).toFixed(2);
    const userEmail = req.user.email;
    const phone = orders[0].phone;

    const firstname = String(
      req.user.name || req.user.firstName || "KTJ Customer",
    )
      .trim()
      .slice(0, 60);

    if (!userEmail || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Your account must have an email and checkout phone number for PayU.",
      });
    }

    const txnid = `KTJ${Date.now()}${crypto.randomBytes(4).toString("hex")}`;
    const productinfo = `Khao To Jano checkout ${checkoutId}`.slice(0, 100);

    const udf1 = checkoutId;
    const udf2 = "";
    const udf3 = "";
    const udf4 = "";
    const udf5 = "";

    const hashString = [
      config.PAYU_KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      userEmail,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      "",
      "",
      "",
      "",
      "",
      config.PAYU_SALT,
    ].join("|");

    const hash = sha512(hashString);

    const payment = {
      action: config.PAYU_BASE_URL,
      fields: {
        key: config.PAYU_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email: userEmail,
        phone,
        surl: `${config.BACKEND_PUBLIC_URL}/api/payu/callback`,
        furl: `${config.BACKEND_PUBLIC_URL}/api/payu/callback`,
        curl: `${config.BACKEND_PUBLIC_URL}/api/payu/callback`,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        hash,
      },
    };

    await Order.updateMany(
      {
        _id: { $in: orders.map((order) => order._id) },
        paymentStatus: "PENDING",
      },
      { $set: { paymentTransactionId: txnid } },
    );

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("[PAYU] Initiation failed:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Could not initiate PayU payment. Check the backend terminal.",
    });
  }
});

router.post("/callback", async (req, res) => {
  try {
    const p = req.body || {};
    const { PAYU_KEY, PAYU_SALT, FRONTEND_URL } = getConfig();

    if (!p.txnid || !p.hash || p.key !== PAYU_KEY) {
      return res.status(400).send("Invalid PayU callback.");
    }

    const reverseHashString = [
      PAYU_SALT,
      p.status || "",
      "",
      "",
      "",
      "",
      "",
      p.udf5 || "",
      p.udf4 || "",
      p.udf3 || "",
      p.udf2 || "",
      p.udf1 || "",
      p.email || "",
      p.firstname || "",
      p.productinfo || "",
      p.amount || "",
      p.txnid || "",
      p.key || "",
    ].join("|");

    if (!safeEqual(sha512(reverseHashString), p.hash)) {
      return res.status(400).send("PayU response hash verification failed.");
    }

    const orders = await Order.find({
      paymentTransactionId: p.txnid,
      paymentMethod: "ONLINE",
    });

    if (!orders.length) {
      return res.status(404).send("Matching checkout not found.");
    }

    const expectedPaise = orders.reduce(
      (sum, order) => sum + Math.round(Number(order.totalAmount) * 100),
      0,
    );

    const receivedPaise = Math.round(Number(p.amount) * 100);

    if (!Number.isFinite(receivedPaise) || expectedPaise !== receivedPaise) {
      return res.status(400).send("Payment amount mismatch.");
    }

    if (orders.some((order) => order.paymentStatus === "PAID")) {
      return res.redirect(`${FRONTEND_URL}/orders?payment=success`);
    }

    const paymentSucceeded = String(p.status).toLowerCase() === "success";

    if (paymentSucceeded) {
      await Order.updateMany(
        {
          paymentTransactionId: p.txnid,
          paymentMethod: "ONLINE",
          paymentStatus: "PENDING",
        },
        { $set: { paymentStatus: "PAID" } },
      );
    } else {
      await Order.updateMany(
        {
          paymentTransactionId: p.txnid,
          paymentMethod: "ONLINE",
          paymentStatus: "PENDING",
        },
        { $set: { paymentStatus: "FAILED" } },
      );
    }

    return res.redirect(
      `${FRONTEND_URL}/orders?payment=${paymentSucceeded ? "success" : "failed"}`,
    );
  } catch (error) {
    console.error("[PAYU] Callback failed:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).send("Could not process PayU response.");
  }
});

export default router;
