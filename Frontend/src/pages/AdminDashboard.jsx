import React, { useEffect, useState } from "react";
import axios from "axios";
import Loader from "../components/shared/Loader";
import Error from "../components/shared/Error";
import { motion } from "framer-motion";

const API_BASE = "https://blug-be-api.onrender.com";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboard();
      fetchSubscriptions();
    } else if (activeTab === "users") fetchUsers();
    else if (activeTab === "blogs") fetchBlogs();
  }, [activeTab, days, page]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/admin/stats?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(res.data.totals);
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/admin/subscriptions?days=${days}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSubscriptions(res.data.subscriptions || []);
    } catch {
      setError("Failed to load subscriptions.");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `${API_BASE}/api/admin/users?search=${search}&page=${page}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.users || []);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/admin/blogs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs(res.data.blogs || []);
    } catch {
      setError("Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ label, value }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
        activeTab === value
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-700/30"
          : "text-gray-300 border border-gray-700 hover:bg-gray-800"
      }`}
    >
      {label}
    </button>
  );

  if (error)
    return (
      <Error
        message={error}
        onRetry={() => {
          if (activeTab === "dashboard") {
            fetchDashboard();
            fetchSubscriptions();
          } else if (activeTab === "users") fetchUsers();
          else if (activeTab === "blogs") fetchBlogs();
        }}
      />
    );

  if (loading) return <Loader message="Fetching admin data..." />;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4"
      >
        <h1 className="text-3xl font-bold text-indigo-500 drop-shadow-sm">
          Admin Dashboard
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <TabButton label="Dashboard" value="dashboard" />
          <TabButton label="User Management" value="users" />
          <TabButton label="Blog Management" value="blogs" />
        </div>
      </motion.div>

      {/* CONTENT */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div>
            {/* Controls */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="bg-gray-900 border border-gray-700 text-gray-200 rounded-lg px-3 py-2"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={100}>Last 100 days</option>
                </select>
                <button
                  onClick={() => {
                    fetchDashboard();
                    fetchSubscriptions();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Stats */}
            {dashboardData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[
                  { title: "Total Users", value: dashboardData.totalUsers },
                  { title: "Total Blogs", value: dashboardData.totalBlogs },
                  { title: "Total Authors", value: dashboardData.totalAuthors },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.03 }}
                    className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-lg shadow-black/30"
                  >
                    <h2 className="text-gray-400">{stat.title}</h2>
                    <p className="text-3xl font-bold text-indigo-400">
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Loader message="Loading dashboard stats..." />
            )}

            {/* Subscriptions */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 overflow-x-auto">
              <h2 className="text-lg font-semibold mb-3 text-indigo-400">
                Subscribed Users
              </h2>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="p-3">Username</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length > 0 ? (
                    subscriptions.map((sub) => (
                      <tr
                        key={sub.id}
                        className="border-b border-gray-800 hover:bg-gray-800/40"
                      >
                        <td className="p-3">{sub.username}</td>
                        <td className="p-3">{sub.plan}</td>
                        <td className="p-3">${sub.amountPaid}</td>
                        <td
                          className={`p-3 font-semibold ${
                            sub.isActive ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {sub.isActive ? "Active" : "Expired"}
                        </td>
                        <td className="p-3">
                          {sub.paymentDate
                            ? new Date(sub.paymentDate).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center text-gray-400 py-4 italic"
                      >
                        No subscriptions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USER MANAGEMENT */}
        {activeTab === "users" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 w-full sm:w-1/3"
              />
              <button
                onClick={fetchUsers}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
              >
                Search
              </button>
            </div>

            {users.length === 0 ? (
              <Loader message="Fetching users..." />
            ) : (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="p-3">Username</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-800 hover:bg-gray-800/40"
                      >
                        <td className="p-3">{user.username}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BLOG MANAGEMENT */}
        {activeTab === "blogs" && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 overflow-x-auto">
            {blogs.length === 0 ? (
              <Loader message="Loading blogs..." />
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="p-3">Title</th>
                    <th className="p-3">Author</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Likes</th>
                    <th className="p-3">Comments</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((blog) => (
                    <tr
                      key={blog.id}
                      className="border-b border-gray-800 hover:bg-gray-800/40"
                    >
                      <td className="p-3">{blog.title}</td>
                      <td className="p-3">{blog.authorName}</td>
                      <td className="p-3">{blog.categoryName}</td>
                      <td className="p-3">{blog.likesCount}</td>
                      <td className="p-3">{blog.commentsCount}</td>
                      <td className="p-3">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {blog.updatedAt
                          ? new Date(blog.updatedAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
