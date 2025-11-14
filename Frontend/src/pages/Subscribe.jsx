import React, { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

export default function Subscribe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    { name: "WEEKLY", label: "Weekly", price: 5000, duration: "7 days" },
    { name: "MONTHLY", label: "Monthly", price: 15000, duration: "30 days" },
    { name: "YEARLY", label: "Yearly", price: 150000, duration: "365 days" },
  ];

  const handleSubscribe = async (plan) => {
    setSelectedPlan(plan.name);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch(
        "https://blug-be-api.onrender.com/subscription/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan: plan.name }), // MUST BE UPPERCASE
        }
      );

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        toast.error(data.message || "Payment initiation failed");
        return;
      }

      if (data.paymentLink) {
        // ✅ Redirect to Flutterwave checkout page
        window.location.href = data.paymentLink;
      } else {
        toast.error("Payment link not received. Try again.");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6">
      <h1 className="text-4xl md:text-5xl font-bold text-green-500 mb-4">
        Become an Author
      </h1>
      <p className="text-gray-300 text-center mb-12 max-w-xl">
        Unlock the ability to write blogs and share your thoughts with the
        world. Choose a subscription plan below and become a Phantom Blugger
        Author today!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-gray-900 border-2 ${
              selectedPlan === plan.name ? "border-green-500" : "border-gray-700"
            } rounded-xl p-6 flex flex-col justify-between transition transform hover:scale-105`}
          >
            <h2 className="text-2xl font-bold text-green-500 mb-2">
              {plan.label}
            </h2>
            <p className="text-gray-300 mb-4">{plan.duration}</p>
            <p className="text-3xl font-extrabold text-white mb-6">
              ₦{plan.price.toLocaleString()}
            </p>
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={loading}
              className="mt-auto bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && selectedPlan === plan.name
                ? "Processing..."
                : "Subscribe"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-gray-400 mt-12 text-center max-w-md">
        Your subscription will automatically upgrade your account to Author. If
        you’re already subscribed, your current plan will be extended.
      </p>
    </div>
  );
}
