import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router";
import Header from "./components/Header";
import Carousel from "./components/Carousel";
import BlogItems from "./components/BlogItems";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Forget from "./pages/Forget";
import About from "./components/About";
import { BlogProvider } from "./Context/BlogContext";
import LatestBlog from "./components/LatestBlog";
import Trending from "./components/Trending";
import WriteBlog from "./pages/WriteBlog";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Blog from "./pages/Blog";
import Suspend from "./pages/Suspend";
import ResetPassword from "./pages/ResetPassword";
import TopCat from "./pages/TopCat";
import BlogDetails from "./pages/BlogDetails";
import EditProfile from "./pages/EditProfile";
import ViewProfile from "./pages/ViewProfile";
import EditBlog from "./pages/EditBlog";
import Subscribe from "./pages/Subscribe";
import VerifyPayment from "./pages/VerifyPayment";
import Draft from "./pages/Draft";
import useInactivity from "./hooks/useInactivity";
import axios from "axios";

// 🔹 Setup global axios interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("token-expired"));
    }
    return Promise.reject(error);
  }
);

// 🔹 Patch fetch globally
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const res = await originalFetch(...args);
  if (res.status === 401) {
    window.dispatchEvent(new Event("token-expired"));
  }
  return res;
};

function App() {
  const [expired, setExpired] = useState(false);
  const [notification, setNotification] = useState(null); // 🔔 for promotion/demotion popup
  const navigate = useNavigate();

  useInactivity(10 * 60 * 1000, () => {
    setExpired(true);
    localStorage.removeItem("token");
  });

  // 🔹 Listen for unauthorized token
  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem("token");
      setExpired(true);
    };

    window.addEventListener("token-expired", handleExpired);
    return () => window.removeEventListener("token-expired", handleExpired);
  }, []);

  // 🔹 Fetch unread notifications once after login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // not logged in

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`https://blug-be-api.onrender.com/unread`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.notifications?.length > 0) {
          const latest = res.data.notifications[0];
          setNotification({
            message: latest.message,
            type: latest.type || "info",
          });
        }
      } catch (err) {
        console.error("Error fetching unread notifications:", err);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <BlogProvider>
      <div>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Header />
                <Carousel />
                <TopCat />
                <LatestBlog />
                <Trending />
                <Footer />
              </>
            }
          />
          <Route
            path="/contact"
            element={
              <>
                <Header />
                <Contact />
                <Footer />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <Header />
                <About />
                <Footer />
              </>
            }
          />
          <Route
            path="/write"
            element={
              <>
                <Header />
                <WriteBlog />
                <Footer />
              </>
            }
          />
          <Route
            path="/profile"
            element={
              <>
                <Header />
                <Profile />
              </>
            }
          />

          <Route
            path="/profile/:id"
            element={
              <>
                <Header />
                <ViewProfile />
              </>
            }
          />

          <Route
            path="/suspend/:id"
            element={
              <>
                <Header />
                <Suspend />
              </>
            }
          />

          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-payment" element={<VerifyPayment />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/blogs"
            element={
              <>
                <Header />
                <Blog />
                <Footer />
              </>
            }
          />

          <Route
            path="/forget"
            element={
              <>
                <Forget />
              </>
            }
          />

          <Route
            path="/blog/:id"
            element={
              <>
                <Header />
                <BlogDetails />
                <Footer />
              </>
            }
          />

          <Route
            path="/subscribe"
            element={
              <>
                <Header />
                <Subscribe />
              </>
            }
          />

          <Route path="/editprofile" element={<EditProfile />} />
          <Route path="/drafts" element={<Draft />} />
          <Route path="/edit-blog/:id" element={<EditBlog />} />
        </Routes>

        {/* 🔔 Promotion/Demotion Popup */}
        {notification && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg w-80">
            <p className="text-lg font-semibold mb-2">{notification.type}</p>
            <p className="text-sm mb-4">{notification.message}</p>

            <button
              onClick={async () => {
                const token = localStorage.getItem("token"); // ✅ fix added here
                try {
                  await axios.put(
                    `https://blug-be-api.onrender.com/read/${notification.id}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  setNotification(null);
                } catch (err) {
                  console.error("Failed to mark notification as read:", err);
                }
              }}
              className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Close
            </button>
          </div>
        )}

        {/* 🔔 Session Expired Popup */}
        {expired && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-gray-950 text-white p-6 rounded-xl shadow-lg text-center">
              <h2 className="text-xl font-semibold mb-4">Session Expired</h2>
              <p className="mb-4">
                You have been logged out due to inactivity.
              </p>
              <button
                onClick={() => {
                  setExpired(false);
                  navigate("/login");
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </BlogProvider>
  );
}

export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}
