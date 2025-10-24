import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { FaTimesCircle, FaCheckCircle } from "react-icons/fa";

export default function SuspendPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = location.state || {}; // user passed from view profile
  const { id } = useParams(); // fallback to route param if needed

  const userId = user?.id || id;

  const [reason, setReason] = useState("Policy Violation");
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setError("User ID is required");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `https://blug-be-api.onrender.com/api/suspend/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason, duration }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Suspend failed");

      setMessage(data.message);
    } catch (err) {
      console.error("Suspend Error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-lg bg-gray-900 rounded-xl shadow-xl p-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-6">Suspend User</h1>

        {user && (
          <div className="mb-4 text-gray-300">
            <p>
              <span className="font-semibold text-white">Username:</span> {user.username}
            </p>
            <p>
              <span className="font-semibold text-white">Email:</span> {user.email}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Reason:</label>
            <div className="flex flex-col gap-2">
              {["Policy Violation", "Adult/Pornographic Content", "Harassment or Abuse"].map(
                (r) => (
                  <label key={r} className="flex items-center gap-2 text-gray-200">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="accent-blue-500"
                    />
                    {r}
                  </label>
                )
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Duration (hours):</label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
            >
              <FaTimesCircle /> Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                loading ? "bg-gray-600 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? "Suspending..." : "Suspend User"}
              <FaCheckCircle />
            </button>
          </div>
        </form>

        {/* Messages */}
        {message && <p className="mt-4 text-green-500 font-medium">{message}</p>}
        {error && <p className="mt-4 text-red-500 font-medium">{error}</p>}
      </div>
    </div>
  );
}
