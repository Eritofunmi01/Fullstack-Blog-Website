const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
if (!FLW_SECRET_KEY) {
  console.error("❌ FLW_SECRET_KEY is not set in .env!");
  process.exit(1);
}

// -------------------- INITIATE PAYMENT --------------------
exports.initiatePayment = async (req, res) => {
  try {
    const { plan } = req.body; // "WEEKLY" | "MONTHLY" | "YEARLY"
    const validPlans = ["WEEKLY", "MONTHLY", "YEARLY"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Define amount for each plan
    let amount;
    switch (plan) {
      case "WEEKLY": amount = 500; break;
      case "MONTHLY": amount = 2000; break;
      case "YEARLY": amount = 20000; break;
    }

    const tx_ref = uuidv4();

    const paymentData = {
      tx_ref,
      amount,
      currency: "NGN",
      redirect_url: "https://phantombluggers.vercel.app/verify-payment",
      customer: {
        email: user.email,
        full_name: user.username,
      },
      meta: {
        plan,
        userId: user.id, // optional, just for reference
      },
      customizations: {
        title: "Blog Subscription",
        description: `Payment for ${plan} subscription`,
      },
    };

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();
    if (data.status === "success") {
      return res.status(200).json({ paymentLink: data.data.link, tx_ref });
    }

    return res.status(400).json({ message: "Failed to initiate payment" });
  } catch (error) {
    console.error("Initiate Payment Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- VERIFY PAYMENT --------------------
exports.verifyPayment = async (req, res) => {
  try {
    const { transaction_id, tx_ref } = req.body;

    // Require at least one
    if (!transaction_id && !tx_ref) {
      return res.status(400).json({ message: "transaction_id or tx_ref is required" });
    }

    // Prefer transaction_id if available
    const verifyUrl = transaction_id
      ? `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`
      : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`;

    // ✅ Verify with Flutterwave
    const response = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Flutterwave verify response:", data);

    if (data.status !== "success" || data.data.status !== "successful") {
      return res.status(400).json({ message: "Payment not successful", raw: data });
    }

    // Get user from middleware (JWT)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Read subscription plan from metadata
    const plan = data.data.meta?.plan;
    if (!["WEEKLY", "MONTHLY", "YEARLY"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan in payment metadata" });
    }

    // Calculate subscription expiry
    let expiresAt = new Date();
    switch (plan) {
      case "WEEKLY": expiresAt.setDate(expiresAt.getDate() + 7); break;
      case "MONTHLY": expiresAt.setMonth(expiresAt.getMonth() + 1); break;
      case "YEARLY": expiresAt.setFullYear(expiresAt.getFullYear() + 1); break;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "AUTHOR",
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAt,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Subscription successful! You are now an Author.",
      user: updatedUser,
      tx_ref: data.data.tx_ref,
      transaction_id: data.data.id,
    });
  } catch (error) {
    console.error("❌ Verify Payment Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
