import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");
    if (!tokenFromUrl) {
      setMessage("Invalid or missing reset token.");
    } else {
      setToken(tokenFromUrl);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "https://blug-be-api.onrender.com/reset-password",
        { token, newPassword }
      );
      setMessage(res.data.message || "Password reset successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Failed to reset password. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-white text-2xl font-semibold mb-6 text-center">
          Reset Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="relative">
            <label className="text-white block mb-2">New Password</label>
            <input
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-600 pr-10"
              placeholder="Enter new password"
            />
            <div
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-10 text-gray-400 cursor-pointer"
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="text-white block mb-2">Confirm Password</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-600 pr-10"
              placeholder="Confirm new password"
            />
            <div
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-10 text-gray-400 cursor-pointer"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-green-600 hover:bg-green-500 text-white font-medium transition-all"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.includes("successful") ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <p
          onClick={() => navigate("/login")}
          className="mt-6 text-center text-blue-600 hover:underline cursor-pointer">
          Back to Login
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
