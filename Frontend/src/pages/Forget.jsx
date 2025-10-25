import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default function Forget() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // starts as loading
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0); // seconds remaining
  const [buttonDisabled, setButtonDisabled] = useState(false);

  // Function to detect email provider and open it
  const openEmailProvider = (email) => {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return alert("Check your inbox for the reset link.");

    if (domain.includes("gmail")) window.open("https://mail.google.com", "_blank");
    else if (domain.includes("yahoo")) window.open("https://mail.yahoo.com", "_blank");
    else if (domain.includes("outlook") || domain.includes("hotmail"))
      window.open("https://outlook.live.com", "_blank");
    else alert("Check your inbox for the reset link.");
  };

  // Function to send reset link
  const sendResetLink = async (email, fromAuto = false) => {
    try {
      const res = await axios.post(
        "https://blug-be-api.onrender.com/forgotPassword",
        { email }
      );
      setMessage(res.data.message || "Password reset link sent to your email!");
      openEmailProvider(email);

      // Start 2-minute countdown for manual case
      if (!fromAuto) {
        setButtonDisabled(true);
        setCountdown(120);
      }

      if (fromAuto) {
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      if (fromAuto) setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setButtonDisabled(false);
    }
  }, [countdown]);

  // Auto process if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userEmail = decoded.email;
        if (userEmail) {
          sendResetLink(userEmail, true);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Token decode error:", err);
        localStorage.removeItem("token");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (buttonDisabled) return; // prevent multiple clicks
    setMessage("");
    setLoading(true);
    await sendResetLink(email);
    setLoading(false);
  };

  // Format countdown as mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // When auto-sending
  if (loading && !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white text-center px-4">
        Your password reset link will be sent to you soon!..
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-white text-2xl font-semibold mb-6 text-center">
          Forgot Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-white block mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-600"
              placeholder="Enter your registered email"
            />
          </div>

          <button
            type="submit"
            disabled={buttonDisabled}
            className={`w-full py-3 rounded-md font-medium transition-all ${
              buttonDisabled
                ? "bg-gray-700 cursor-not-allowed text-gray-400"
                : "bg-green-600 hover:bg-green-500 text-white"
            }`}
          >
            {buttonDisabled
              ? countdown > 0
                ? `Resend link in ${formatTime(countdown)}`
                : "Resend Link"
              : loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>

          <button
            onClick={() => navigate(-1)}
            type="button"
            className="bg-blue-600 p-2 rounded-2xl w-full justify-center text-md hover:bg-white hover:text-blue-600 hover:font-bold text-white"
          >
            Back
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.toLowerCase().includes("sent")
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
