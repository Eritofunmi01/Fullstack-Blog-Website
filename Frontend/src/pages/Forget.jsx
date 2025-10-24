import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default function Forget() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // starts as loading
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    const sendResetLink = async (email) => {
      try {
        const res = await axios.post(
          "https://blug-be-api.onrender.com/forgotPassword",
          { email }
        );
        setMessage(res.data.message || "Password reset link sent to your email!");

        // Open email provider
        const domain = email.split("@")[1].toLowerCase();
        setTimeout(() => {
          if (domain.includes("gmail")) window.open("https://mail.google.com", "_blank");
          else if (domain.includes("yahoo")) window.open("https://mail.yahoo.com", "_blank");
          else if (domain.includes("outlook") || domain.includes("hotmail"))
            window.open("https://outlook.live.com", "_blank");
          else alert("Check your inbox for the reset link.");
          navigate("/login");
        }, 1500);
      } catch (err) {
        console.error(err);
        setMessage(err.response?.data?.message || "Something went wrong. Try again.");
        setLoading(false); // stop loading so form can show if needed
      }
    };

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userEmail = decoded.email;
        if (userEmail) {
          // Auto-send reset link
          sendResetLink(userEmail);
        } else {
          setLoading(false); // fallback to show form
        }
      } catch (err) {
        console.error("Token decode error:", err);
        localStorage.removeItem("token");
        setLoading(false); // show form
      }
    } else {
      setLoading(false); // no token, show form
    }
  }, [navigate]);

  const [email, setEmail] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(
        "https://blug-be-api.onrender.com/forgotPassword",
        { email }
      );
      setMessage(res.data.message || "Password reset link sent to your email!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong. Try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Sending password reset link...
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
            className="w-full py-3 rounded-md bg-green-600 hover:bg-green-500 text-white font-medium transition-all"
          >
            Send Reset Link
          </button>

        <button onClick={() => navigate(-1)} className="bg-blue-600 p-2 rounded-2xl w-full justify-center text-md hover:bg-white hover:text-blue-600 hover:font-bold text-white ">Back</button>
          {/* <Link to="/login" className="text-green-600">Back to Login</Link> */}

        </form>

        {message && (
          <p className={`mt-4 text-center ${message.includes("sent") ? "text-green-500" : "text-red-500"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
