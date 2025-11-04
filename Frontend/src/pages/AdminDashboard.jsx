// AdminDashboard.jsx — Fully Functional Version (Users + Blogs + Create Popup)

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const TABS = ["Dashboard", "User Management", "Blog Management"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [error, setError] = useState(null);

  // Dashboard
  const [range, setRange] = useState(7);
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Users
  const USERS_PER_PAGE = 7;
  const [userPage, setUserPage] = useState(1);
  const [usersData, setUsersData] = useState({ items: [], total: 0 });
  const [userLoading, setUserLoading] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "USER" });

  // Blogs
  const BLOGS_PER_PAGE = 10;
  const [blogPage, setBlogPage] = useState(1);
  const [blogsData, setBlogsData] = useState({ items: [], total: 0 });
  const [blogLoading, setBlogLoading] = useState(false);

  const API_BASE = "https://blug-be-api.onrender.com/api";

  // ----------------- EFFECTS -----------------
  useEffect(() => {
    if (activeTab === "Dashboard") fetchDashboard(range);
  }, [activeTab, range]);

  useEffect(() => {
    if (activeTab === "User Management") fetchUsers(userPage);
  }, [activeTab, userPage]);

  useEffect(() => {
    if (activeTab === "Blog Management") fetchBlogs(blogPage);
  }, [activeTab, blogPage]);

  // ----------------- API CALLS -----------------
  async function fetchDashboard(days) {
    setLoadingDashboard(true);
    try {
      const [statsRes, subsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/stats?days=${days}`),
        axios.get(`${API_BASE}/admin/subscriptions?days=${days}`),
      ]);
      setStats(statsRes.data);
      setSubscriptions(subsRes.data.subscriptions || []);
    } catch (err) {
      console.error("fetchDashboard error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function fetchUsers(page = 1) {
    setUserLoading(true);
    try {
      const res = await axios.get(`https://blug-be-api.onrender.com/users`);
      const arr = Array.isArray(res.data.users) ? res.data.users : [];
      const start = (page - 1) * USERS_PER_PAGE;
      const paged = arr.slice(start, start + USERS_PER_PAGE);
      setUsersData({ items: paged, total: arr.length });
    } catch (err) {
      console.error("fetchUsers error:", err);
      setError("Failed to load users");
    } finally {
      setUserLoading(false);
    }
  }

  async function fetchBlogs(page = 1) {
    setBlogLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/blogs`);
      const arr = Array.isArray(res.data) ? res.data : [];
      const normalized = arr.map((b) => ({
        ...b,
        likeCount: b.likes?.length ?? 0,
        commentCount: b.comments?.length ?? 0,
      }));
      const start = (page - 1) * BLOGS_PER_PAGE;
      const paged = normalized.slice(start, start + BLOGS_PER_PAGE);
      setBlogsData({ items: paged, total: normalized.length });
    } catch (err) {
      console.error("fetchBlogs error:", err);
      setError("Failed to load blogs");
    } finally {
      setBlogLoading(false);
    }
  }

  // ----------------- CREATE USER -----------------
  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      await axios.post("https://blug-be-api.onrender.com/signup", newUser);
      alert("User created successfully!");
      setShowCreatePopup(false);
      setNewUser({ username: "", email: "", password: "", role: "USER" });
      fetchUsers();
    } catch (err) {
      alert("Failed to create user. Check input or server logs.");
    }
  }

  // ----------------- DELETE -----------------
  async function handleDeleteUser(id) {
    if (!confirm("Delete this user?")) return;
    await axios.delete(`https://blug-be-api.onrender.com/users/${id}`);
    fetchUsers(userPage);
  }

  async function handleDeleteBlog(id) {
    if (!confirm("Delete this blog?")) return;
    await axios.delete(`${API_BASE}/blog/${id}`);
    fetchBlogs(blogPage);
  }

  const totalUserPages = Math.max(1, Math.ceil(usersData.total / USERS_PER_PAGE));
  const totalBlogPages = Math.max(1, Math.ceil(blogsData.total / BLOGS_PER_PAGE));

  // ----------------- RENDER -----------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setError(null);
                }}
                className={`px-3 py-1 rounded-2xl text-sm ${
                  activeTab === tab ? "bg-gray-800" : "bg-gray-950/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === "Dashboard" && (
          <DashboardTab
            range={range}
            setRange={setRange}
            loading={loadingDashboard}
            stats={stats}
            subscriptions={subscriptions}
            onRefresh={() => fetchDashboard(range)}
          />
        )}

        {/* USER MANAGEMENT TAB */}
        {activeTab === "User Management" && (
          <section>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg">All Users</h3>
              <button
                onClick={() => setShowCreatePopup(true)}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
              >
                + Create User
              </button>
            </div>

            {userLoading ? (
              <p>Loading users...</p>
            ) : (
              <table className="w-full text-left text-sm bg-gray-950/40 rounded">
                <thead>
                  <tr className="text-gray-300 border-b border-gray-800">
                    <th className="p-2">Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.items.map((u) => (
                    <tr key={u.id} className="border-t border-gray-800">
                      <td className="p-2">{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* PAGINATION */}
            <Pagination
              page={userPage}
              totalPages={totalUserPages}
              onPageChange={setUserPage}
            />

            {/* CREATE USER POPUP */}
            {showCreatePopup && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <form
                  onSubmit={handleCreateUser}
                  className="bg-gray-800 p-6 rounded-xl w-96 space-y-3"
                >
                  <h3 className="text-lg font-semibold mb-2">Create New User</h3>

                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full p-2 rounded bg-gray-900"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 rounded bg-gray-900"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 rounded bg-gray-900"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />

                  <select
                    className="w-full p-2 rounded bg-gray-900"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowCreatePopup(false)}
                      className="px-3 py-1 rounded bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-3 py-1 rounded bg-green-600">
                      Create
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        )}

        {/* BLOG MANAGEMENT TAB */}
        {activeTab === "Blog Management" && (
          <section>
            <h3 className="text-lg mb-3">All Blogs</h3>
            {blogLoading ? (
              <p>Loading blogs...</p>
            ) : (
              <table className="w-full text-left text-sm bg-gray-950/40 rounded">
                <thead>
                  <tr className="text-gray-300 border-b border-gray-800">
                    <th className="p-2">Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogsData.items.map((b) => (
                    <tr key={b.id} className="border-t border-gray-800">
                      <td className="p-2">{b.title}</td>
                      <td>{b.author?.username}</td>
                      <td>{b.Category?.name}</td>
                      <td>{b.likeCount}</td>
                      <td>{b.commentCount}</td>
                      <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteBlog(b.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <Pagination
              page={blogPage}
              totalPages={totalBlogPages}
              onPageChange={setBlogPage}
            />
          </section>
        )}

        {error && <div className="mt-4 text-red-400">{error}</div>}
      </div>
    </div>
  );
}

function DashboardTab({ range, setRange, loading, stats, subscriptions, onRefresh }) {
  return (
    <section>
      <div className="flex justify-between mb-4">
        <div>
          <label>Range:</label>
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="bg-gray-800 ml-2 rounded px-2 py-1"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={100}>Last 100 days</option>
          </select>
        </div>
        <button onClick={onRefresh} className="px-3 py-1 rounded bg-gray-800">
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard title="Total Users" value={stats?.totals?.totalUsers ?? "—"} />
            <SummaryCard title="Total Authors" value={stats?.totals?.totalAuthors ?? "—"} />
            <SummaryCard title="Total Blogs" value={stats?.totals?.totalBlogs ?? "—"} />
            <SummaryCard title="New Users" value={stats?.newInTimeframe?.newUsers ?? "—"} />
          </div>

          <div className="mt-6 bg-gray-950/30 p-4 rounded">
            <h3 className="text-lg mb-3">Recent Subscriptions</h3>
            {subscriptions.length ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-300">
                    <th>User</th>
                    <th>Amount</th>
                    <th>Plan</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="border-t border-gray-800">
                      <td>{s.username || "N/A"}</td>
                      <td>₦{s.amountPaid}</td>
                      <td>{s.plan}</td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td>{s.isActive ? "Active" : "Expired"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-sm">No recent subscriptions</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40"
      >
        Prev
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-gray-800/50 rounded p-4 text-center">
      <h4 className="text-gray-400 text-sm">{title}</h4>
      <p className="text-xl font-semibold mt-2">{value}</p>
    </div>
  );
}
