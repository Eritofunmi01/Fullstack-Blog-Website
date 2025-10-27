import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { FaUser, FaBookOpen, FaTrashAlt, FaBan } from "react-icons/fa";
import Loader from "../components/shared/Loader";
import Error from "../components/shared/Error";

export default function ViewProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const API_BASE = "https://blug-be-api.onrender.com";
  const token = localStorage.getItem("token");

  // ✅ Decode JWT to get current user info
  useEffect(() => {
    if (!token) return;
    try {
      const user = jwtDecode(token);
      setCurrentUser(user);
    } catch (err) {
      console.error("JWT decode error:", err);
    }
  }, [token]);

  // ✅ Fetch selected user's profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(`${API_BASE}/api/users/${id}/profile`);
        const userData = res.data.user || res.data;

        // Normalize profile picture
        if (userData?.profilePic && !userData.profilePic.startsWith("http")) {
          userData.profilePic = `${API_BASE}/${userData.profilePic}`;
        }

        setProfile(userData);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(
          err.response?.data?.message || "Failed to load profile data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // ✅ Loading & Error handling
  if (loading) return <Loader message="Loading profile..." />;
  if (error || !profile)
    return (
      <Error
        message={error || "Profile not found."}
        onRetry={() => window.location.reload()}
      />
    );

  // ✅ Extract profile data
  const { username, bio, profilePic, blogs = [], role } = profile;

  // ✅ Check if logged-in user is Admin or Creator
  const isAdmin =
    currentUser?.role?.toLowerCase() === "admin" ||
    currentUser?.role?.toLowerCase() === "creator";

  const isCreator = currentUser?.role?.toLowerCase() === "creator";

  // ✅ Delete blog
  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    try {
      await axios.delete(`${API_BASE}/api/blog/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Blog deleted successfully.");
      setProfile((prev) => ({
        ...prev,
        blogs: prev.blogs.filter((b) => b.id !== blogId),
      }));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete blog.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex justify-center p-6 font-serif">
      <div className="w-full max-w-4xl space-y-6">
        {/* 🔹 Profile Header */}
        <div className="bg-gray-900 rounded-2xl shadow-md p-6 text-center text-white flex flex-col items-center relative">
          <img
            src={
              profilePic ||
              "https://cdn-icons-png.flaticon.com/512/847/847969.png"
            }
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover shadow-md"
          />
          <h2 className="text-2xl font-bold mt-4">{username}</h2>
          <p className="text-gray-300 max-w-lg">{bio || "No bio yet..."}</p>

          {/* 🔹 Show current role badge */}
          <span
            className={`mt-3 px-3 py-1 text-sm font-semibold rounded-full ${
              role?.toLowerCase() === "admin"
                ? "bg-red-700 text-white"
                : "bg-gray-700 text-gray-200"
            }`}
          >
          </span>

          {/* 🔹 ADMIN / CREATOR ACTIONS */}
          {isAdmin && (
            <div className="absolute top-4 right-4 flex flex-col gap-3">
              <button
                onClick={() => navigate(`/suspend/${id}`)}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                <FaBan /> Suspend User
              </button>

              {/* 🔹 Promote or Demote */}
              {role?.toLowerCase() === "admin" ? (
                <button
                  onClick={() => navigate(`/demote/${id}`)}
                  className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  Demote to User
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/promote/${id}`)}
                  className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  Promote to Admin
                </button>
              )}
            </div>
          )}
        </div>

        {/* 🔹 Blogs Section */}
        <div className="bg-gray-900 rounded-2xl shadow-md p-6 text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaBookOpen /> Blogs by {username}
          </h3>

          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <div
                key={blog.id}
                className="border-b border-gray-800 pb-4 mb-4 last:border-none last:mb-0 relative"
              >
                {blog.img && (
                  <img
                    src={
                      blog.img.startsWith("http")
                        ? blog.img
                        : `${API_BASE}/${blog.img}`
                    }
                    alt={blog.title}
                    className="w-full h-48 object-cover rounded-xl mb-3"
                  />
                )}

                <h4 className="text-xl font-semibold mb-1">{blog.title}</h4>
                <p className="text-gray-400 text-sm mb-2">
                  {blog.contentSnippet || ""}
                </p>

                <div className="flex justify-between items-center">
                  <Link
                    to={`/blog/${blog.id}`}
                    className="text-blue-400 hover:underline text-sm"
                  >
                    Read more →
                  </Link>

                  {/* 🔹 ADMIN DELETE BUTTON */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm transition"
                    >
                      <FaTrashAlt /> Delete
                    </button>
                  )}
                </div>

                <p className="text-gray-500 text-xs mt-1">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic">No blogs published yet.</p>
          )}
        </div>

        {/* 🔹 About Section */}
        <div className="bg-gray-900 rounded-2xl shadow-md p-6 text-white">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <FaUser /> About
          </h3>
          <p>{bio || "This user hasn’t written anything about themselves yet."}</p>
        </div>
      </div>
    </div>
  );
}
