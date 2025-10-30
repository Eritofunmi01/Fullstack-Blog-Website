import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://blug-be-api.onrender.com";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const token = localStorage.getItem("token");

  // Fetch dashboard data
  useEffect(() => {
    if (activeTab === "dashboard") fetchDashboard();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "blogs") fetchBlogs();
  }, [activeTab, days, page]);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/dashboard?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users?search=${search}&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBlogs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/blogs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const TabButton = ({ label, value }) => (
    <button
      onClick={() => handleTabChange(value)}
      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300
        ${activeTab === value
          ? "bg-indigo-600 text-white"
          : "text-gray-300 hover:bg-gray-800 border border-gray-700"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-indigo-500">Admin Dashboard</h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <TabButton label="Dashboard" value="dashboard" />
          <TabButton label="User Management" value="users" />
          <TabButton label="Blog Management" value="blogs" />
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="space-y-8">
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <select
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-gray-200 rounded-lg px-3 py-2"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={100}>Last 100 days</option>
                </select>
                <button
                  onClick={fetchDashboard}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* STATS */}
            {dashboardData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-md">
                  <h2 className="text-gray-400">Total Users</h2>
                  <p className="text-3xl font-bold text-indigo-400">
                    {dashboardData.totalUsers}
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-md">
                  <h2 className="text-gray-400">Total Blogs</h2>
                  <p className="text-3xl font-bold text-indigo-400">
                    {dashboardData.totalBlogs}
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-md">
                  <h2 className="text-gray-400">Total Authors</h2>
                  <p className="text-3xl font-bold text-indigo-400">
                    {dashboardData.totalAuthors}
                  </p>
                </div>
              </div>
            ) : (
              <p>Loading...</p>
            )}

            {/* PAYMENTS TABLE */}
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
                  {dashboardData?.subscribers?.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50"
                    >
                      <td className="p-3">{sub.username}</td>
                      <td className="p-3">{sub.plan}</td>
                      <td className="p-3">${sub.amount}</td>
                      <td
                        className={`p-3 font-semibold ${
                          sub.status === "active"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sub.status}
                      </td>
                      <td className="p-3">
                        {new Date(sub.paymentDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
              >
                Search
              </button>
            </div>

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
                  {users?.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50"
                    >
                      <td className="p-3">{user.username}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BLOG MANAGEMENT */}
        {activeTab === "blogs" && (
          <div>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 overflow-x-auto">
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
                  {blogs?.map((blog) => (
                    <tr
                      key={blog.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50"
                    >
                      <td className="p-3">{blog.title}</td>
                      <td className="p-3">{blog.authorName}</td>
                      <td className="p-3">{blog.categoryName}</td>
                      <td className="p-3">{blog.likes}</td>
                      <td className="p-3">{blog.comments}</td>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
