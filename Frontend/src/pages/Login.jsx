import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

// ⏳ Countdown Component
function Countdown({ until }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const end = new Date(until).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("⏳ Suspension ended. Please login again.");
        clearInterval(interval);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, [until]);

  return (
    <p className="text-green-400 font-semibold text-lg">
      {timeLeft || "Calculating..."}
    </p>
  );
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [popup, setPopup] = useState(null);

  // 🔹 Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("https://blug-be-api.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // 🔸 Handle Suspended or Banned Users
      if (!res.ok) {
        if (res.status === 403) {
          setPopup(data); // show popup
        } else {
          throw new Error(data.message || "Login failed");
        }
      } else {
        // ✅ Successful Login
        if (data.token) localStorage.setItem("token", data.token);
        toast.success("Login successful!");
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='h-[] bg-[url("/Img/bg1.png")] bg-cover bg-center bg-fixed'>
      <div className='sm:pt-[10%] pt-40 pb-129 sm:pb-[60%] font-serif'>
        <form
          onSubmit={handleLogin}
          className='fixed
            ml-[10%] w-[80%] 
            shadow-2xl shadow-green-700 bg-gray-950 rounded-2xl
            sm:ml-[10%] sm:mr-[10%] sm:w-[80%] 
            md:ml-[20%] md:mr-[20%] md:w-[60%] 
            lg:ml-[25%] lg:mr-[25%] lg:w-[50%]
          '
        >
          <h3 className='text-green-600 text-center pt-7 text-2xl sm:text-xl'>
            Welcome Back
          </h3>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='
              p-2 bg-white w-[80%] my-5 ml-7 rounded-full focus:outline
              sm:ml-4 sm:w-[92%]
            '
          />

          <div className="relative w-[80%] ml-7 my-5 sm:ml-4 sm:w-[92%]">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='p-2 bg-white w-full rounded-full focus:outline'
            />
            <span
              className="absolute right-3 top-3 cursor-pointer text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className='
              bg-green-600 ml-15 mb-10 mt-4 w-[35%] cursor-pointer p-1 rounded-full
              hover:text-green-600 hover:bg-white hover:outline-green-600 hover:outline-2 
              text-white text-2xl
              sm:w-[30%] sm:text-lg md:mb-10
            '
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            onClick={() => navigate(-1)}
            type="button"
            className="bg-blue-600 p-2 rounded-full w-20 ml-2  hover:outline-blue-600 hover:outline-2  md:w-50 md:ml-5 justify-center text-md hover:bg-white hover:text-blue-600 hover:font-bold text-white"
          >
            Back
          </button>

          <div className="mt-2 text-center gap-3 text-sm md:text-md">
            <Link to="/register" className="text-green-600 hover:underline">
              Don't have an account? Sign up
            </Link>
            <Link to="/forget" className="text-blue-600 pl-2 hover:underline">Forgotten Password</Link>
          </div>
        </form>
      </div>

      <ToastContainer position="top-center" />

      {/* 🔔 Popup for banned/suspended users */}
      {popup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white rounded-2xl p-8 w-[90%] max-w-md text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-3 text-green-500">
              {popup.status === "BANNED"
                ? "🚫 Account Banned"
                : "⚠️ Account Suspended"}
            </h2>

            <p className="mb-2 text-gray-300">
              {popup.reason
                ? `Reason: ${popup.reason}`
                : popup.message || "Violation of platform policies."}
            </p>

            {/* 🟠 Display strike count */}
            {popup.strikeCount !== undefined && (
              <p className="text-yellow-400 font-semibold mb-3">
                Strike Count: {popup.strikeCount}/7
              </p>
            )}

            {/* Countdown Timer */}
            {popup.status === "SUSPENDED" && popup.suspendedUntil && (
              <div className="my-3 border border-green-700 rounded-lg p-3 bg-gray-800">
                <Countdown until={popup.suspendedUntil} />
              </div>
            )}

            <p className="text-red-500 text-sm mt-2">
              ⚠️ Note: If your strike count reaches 7, you get banned permanently!
            </p>

            <button
              onClick={() => setPopup(null)}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full mt-4 text-lg transition duration-200"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
