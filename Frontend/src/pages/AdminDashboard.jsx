import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://blug-be-api.onrender.com/api/admin";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("30");

  // Fetch Dashboard Stats
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/dashboard?days=${period}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/users`, {
        params: { search, page },
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/blogs`);
      setBlogs(res.data.blogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Suspend user
  const suspendUser = async (id) => {
    const confirmSuspend = confirm("Suspend this user?");
    if (!confirmSuspend) return;

    try {
      await axios.put(`${API_BASE}/suspend/${id}`);
      alert("User suspended successfully");
      fetchUsers();
    } catch (err) {
      alert("Error suspending user");
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") fetchDashboard();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "blogs") fetchBlogs();
  }, [activeTab, period, page]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {["dashboard", "users", "blogs"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 border-b-2 font-semibold ${
              activeTab === tab
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "dashboard"
              ? "Dashboard"
              : tab === "users"
              ? "User Management"
              : "Blog Management"}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 mb-4">Loading...</p>}

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="100">Last 100 days</option>
            </select>
            <button
              onClick={fetchDashboard}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white shadow rounded p-4">
              <h3 className="text-gray-500">Total Users</h3>
              <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
            </div>
            <div className="bg-white shadow rounded p-4">
              <h3 className="text-gray-500">Total Blogs</h3>
              <p className="text-2xl font-bold">{stats.totalBlogs || 0}</p>
            </div>
            <div className="bg-white shadow rounded p-4">
              <h3 className="text-gray-500">Total Authors</h3>
              <p className="text-2xl font-bold">{stats.totalAuthors || 0}</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-3">Recent Subscriptions</h2>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">Username</th>
                  <th className="p-2">Plan</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.subscriptions?.length > 0 ? (
                  stats.subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-t">
                      <td className="p-2">{sub.username}</td>
                      <td className="p-2">{sub.plan}</td>
                      <td className="p-2">${sub.amount}</td>
                      <td className="p-2">
                        {new Date(sub.paymentDate).toLocaleDateString()}
                      </td>
                      <td
                        className={`p-2 font-semibold ${
                          sub.status === "active"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {sub.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-center text-gray-500" colSpan="5">
                      No subscriptions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === "users" && (
        <div>
          <div className="flex items-center mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded w-64 mr-3"
            />
            <button
              onClick={fetchUsers}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          <div className="overflow-x-auto bg-white shadow rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">Username</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Suspended</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="p-2">{user.username}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.role}</td>
                      <td className="p-2">
                        {user.isSuspended ? "Yes" : "No"}
                      </td>
                      <td className="p-2">
                        {!user.isSuspended && (
                          <button
                            onClick={() => suspendUser(user.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-center text-gray-500" colSpan="5">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-4 gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Prev
            </button>
            <span>Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Blog Management Tab */}
      {activeTab === "blogs" && (
        <div>
          <div className="overflow-x-auto bg-white shadow rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">Title</th>
                  <th className="p-2">Author</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Likes</th>
                  <th className="p-2">Comments</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {blogs.length > 0 ? (
                  blogs.map((blog) => (
                    <tr key={blog.id} className="border-t">
                      <td className="p-2">{blog.title}</td>
                      <td className="p-2">{blog.author?.username}</td>
                      <td className="p-2">{blog.Category?.name}</td>
                      <td className="p-2">{blog._count?.likes || 0}</td>
                      <td className="p-2">{blog._count?.comments || 0}</td>
                      <td className="p-2">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        {new Date(blog.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-center text-gray-500" colSpan="7">
                      No blogs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
