import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { FaUser, FaPen, FaHeart, FaTrash, FaBan, FaEdit } from "react-icons/fa";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../components/shared/Loader";
import Error from "../components/shared/Error";

export default function ProfilePage() {
  const { id: profileId } = useParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("blogs");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);

  const [currentUserRole, setCurrentUserRole] = useState(null);

  const API_BASE = "https://blug-be-api.onrender.com";

  // ✅ Fetch Profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in.");

      const meRes = await axios.get(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meUser = meRes.data.user;
      setLoggedInUser({
        id: meUser.id,
        role: meUser.role,
        username: meUser.username,
      });

      const url = profileId
        ? `${API_BASE}/api/profile/${profileId}`
        : `${API_BASE}/api/auth/profile`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = res.data.user || res.data;
      setUser(profileData);
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      setError(err.response?.data?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch All Users (Admin)
  const fetchAllUsers = async () => {
    if (loggedInUser?.role !== "ADMIN") return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers(Array.isArray(res.data.users) ? res.data.users : []);
    } catch (err) {
      console.error("Error fetching all users:", err);
    }
  };

  // ✅ Fetch Favorites
  const fetchFavorites = async () => {
    if (activeTab !== "favorites") return;
    try {
      setLoadingFavorites(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/favorites/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data.blogs || []);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setFavorites([]);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // ✅ Fetch Author Total Likes
  const fetchAuthorTotalLikes = async (authorId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/blogs`);
      if (Array.isArray(res.data)) {
        const authorBlogs = res.data.filter(
          (blog) => blog.author?.id === authorId
        );
        const total = authorBlogs.reduce(
          (sum, blog) => sum + (blog.likeCount || blog.likes?.length || 0),
          0
        );
        setTotalLikes(total);
      }
    } catch (err) {
      console.error("Error fetching author likes:", err);
      setTotalLikes(0);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

  useEffect(() => {
    fetchAllUsers();
  }, [loggedInUser]);

  useEffect(() => {
    fetchFavorites();
  }, [activeTab]);

  useEffect(() => {
    if (user?.id) fetchAuthorTotalLikes(user.id);
  }, [user]);

  const isOwner =
    loggedInUser && user && String(loggedInUser.id) === String(user.id);
  const isAdmin = String(loggedInUser?.role ?? "").toLowerCase() === "admin";

  // ✅ Delete Blog
  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_BASE}/api/blog/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setUser((prev) => ({
          ...prev,
          blogs: prev.blogs.filter((b) => b.id !== blogId),
        }));
      }
    } catch (err) {
      console.error("Failed to delete blog:", err);
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // ✅ Suspend User (Admin)
  const handleSuspendUser = async () => {
    if (!window.confirm("Suspend this user?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/api/users/suspend/${user.id}`,
        { reason: "Violation of policies", duration: "24h" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("User suspended successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to suspend user");
    }
  };

  // ✅ Delete Account
  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Account deleted successfully");
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Failed to delete account");
    }
  };

  if (loading) return <Loader message="Loading profile..." />;
  if (error) return <Error message={error} onRetry={fetchProfile} />;
  if (!user)
    return <Error message="No profile found." onRetry={fetchProfile} />;

  const roleDisplay =
    String(loggedInUser?.role ?? "").toLowerCase() === "admin"
      ? { label: "Administrator", style: "bg-yellow-500 text-black" }
      : user.role === "AUTHOR"
      ? { label: "Author", style: "bg-green-600 text-white" }
      : user.role === "CREATOR"
      ? { label: "Creator", style: "bg-yellow-800 text-yellow-200" }
      : { label: "Reader", style: "bg-gray-700 text-white" };

  const renderBadgeMessage = () => {
    if (user.role === "USER" || user.role === "READER") {
      return (
        <div className="text-center space-y-2">
          <p>
            👋 You’re currently a <b>Reader</b>. Don’t forget to like and
            favorite your favorite authors’ posts — and you can join them by
            becoming an author!
          </p>
          <Link
            to="/subscribe"
            className="text-blue-600 underline font-semibold"
          >
            Subscribe to become an Author
          </Link>
        </div>
      );
    }

    if (user.role === "AUTHOR") {
      return (
        <p className="text-center">
          ✍️ Keep writing and inspiring others! Your blogs make the platform
          better every day.
        </p>
      );
    }

    if (user.role === "ADMIN") {
      return (
        <div className="text-center">
          <p className="font-semibold mb-2">👑 Administrator Overview</p>
          <p>
            Total Users: <b>{allUsers.length}</b>
          </p>
          <ul className="text-sm mt-2 max-h-32 overflow-y-auto">
            {allUsers.length > 0 ? (
              allUsers.map((u) => (
                <li key={u.id}>
                  {u.username} — <span className="text-gray-500">{u.role}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-400">No users found</li>
            )}
          </ul>
          <p className="mt-3 text-xs text-gray-400 italic">
            You have full management privileges.
          </p>
        </div>
      );
    }

    return <p className="text-center">No badge info available.</p>;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex justify-center p-6 font-serif">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-900 shadow-md rounded-2xl p-6 relative text-white">
          <button
            onClick={() => setShowBadgePopup(true)}
            className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold shadow-md ${roleDisplay.style}`}
          >
            {roleDisplay.label}
          </button>

          <div className="flex flex-col items-center text-center">
            <img
              src={user.profilePic || "/default-avatar.png"}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover shadow-md"
            />

            <h2 className="text-2xl font-bold mt-4">{user.username}</h2>
            <p className="text-gray-300">{user.bio || "No bio yet..."}</p>

            {user.role === "AUTHOR" && user.subscriptionExpiresAt && (
              <p className="text-sm text-gray-400 mt-2">
                <strong>Plan Expires:</strong>{" "}
                {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {isOwner && (
                <>
                  <Link
                    to="/editprofile"
                    className="px-4 py-2 bg-blue-600 rounded-xl hover:bg-blue-700"
                  >
                    Edit Profile
                  </Link>

                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 rounded-xl hover:bg-red-700"
                  >
                    Delete Account
                  </button>
                </>
              )}

              {/* 👑 Visible ONLY to Admins & Creators */}
              {(loggedInUser?.role === "ADMIN" ||
                loggedInUser?.role === "CREATOR") && (
                <button
                  onClick={() => navigate("/Dashboard")}
                  className="px-4 py-2 bg-green-600 rounded-xl text-white hover:bg-green-800 flex items-center gap-2"
                >
                  Go to Dashboard
                </button>
              )}
              {isAdmin && !isOwner && (
                <button
                  onClick={handleSuspendUser}
                  className="px-4 py-2 bg-yellow-600 rounded-xl hover:bg-yellow-700 flex items-center gap-2"
                >
                  <FaBan /> Suspend
                </button>
              )}
            </div>

            <div className="flex gap-10 mt-6 text-white">
              <div className="text-center">
                <p className="text-xl font-bold">{user.blogs?.length || 0}</p>
                <p className="text-gray-400 text-sm">Blogs</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{totalLikes}</p>
                <p className="text-gray-400 text-sm">Likes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="grid grid-cols-3 text-center border-b border-gray-700">
            {["blogs", "favorites", "about"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 font-semibold flex justify-center items-center gap-2 ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {tab === "blogs" && <FaPen />}
                {tab === "favorites" && <FaHeart />}
                {tab === "about" && <FaUser />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="mt-4">
            {activeTab === "blogs" && (
              <div className="space-y-4">
                {user.blogs?.length > 0 ? (
                  user.blogs.map((blog) => (
                    <div
                      onClick={() => navigate(`/blog/${blog.id}`)}
                      key={blog.id}
                      className=" bg-gray-800 p-4 rounded-xl flex justify-between items-center hover:bg-gray-700 transition"
                    >
                      <div className="flex gap-4 items-center">
                        {blog.img && (
                          <img
                            src={blog.img}
                            alt={blog.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{blog.title}</h3>
                          <p className="text-gray-400 text-sm">
                            {new Date(blog.createdAt).toDateString()} •{" "}
                            {blog.likeCount || blog.likes?.length || 0} Likes
                          </p>
                        </div>
                      </div>

                      {(isOwner || isAdmin) && (
                        <div className="flex items-center gap-3">
                          {/* ✏️ Edit Blog */}
                          {isOwner && (
                            <Link
                              to={`/edit-blog/${blog.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <FaEdit />
                            </Link>
                          )}

                          {/* 🗑️ Delete Blog */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteBlog(blog.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center">No blogs yet.</p>
                )}
              </div>
            )}

            {activeTab === "favorites" && (
              <div>
                {loadingFavorites ? (
                  <Loader message="Loading favorites..." />
                ) : favorites.length > 0 ? (
                  favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="bg-gray-800 p-4 rounded-xl mb-3 flex flex-col sm:flex-row gap-4"
                    >
                      {fav.img && (
                        <img
                          src={fav.img}
                          alt={fav.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">
                          {fav.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          By{" "}
                          <span className="text-blue-400">
                            {fav.author?.username || "Unknown"}
                          </span>{" "}
                          • {new Date(fav.createdAt).toDateString()}
                        </p>
                        <p className="text-gray-300 text-sm line-clamp-2">
                          {fav.content?.slice(0, 100)}...
                        </p>
                        <Link
                          to={`/blog/${fav.id}`}
                          className="text-blue-500 hover:underline mt-2 inline-block"
                        >
                          Read full post →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center">No favorites yet.</p>
                )}
              </div>
            )}

            {activeTab === "about" && (
              <div className="text-gray-300 space-y-2 p-4">
                <p>
                  <b>Email:</b> {user.email}
                </p>
                <p>
                  <b>Role:</b> {user.role}
                </p>
                <p>
                  <b>Member since:</b> {new Date(user.createdAt).toDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup */}
      <AnimatePresence>
        {showBadgePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-gray-900 p-6 rounded-2xl max-w-md w-full text-white"
            >
              {renderBadgeMessage()}
              <button
                onClick={() => setShowBadgePopup(false)}
                className="mt-6 px-4 py-2 bg-blue-600 rounded-xl w-full hover:bg-blue-700"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
