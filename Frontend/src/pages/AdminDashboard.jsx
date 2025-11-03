// AdminDashboard.jsx — Full Fixed Version
// Uses React + Tailwind + Axios

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const TABS = ["Dashboard", "User Management", "Blog Management"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [error, setError] = useState(null);

  // Dashboard
  const [range, setRange] = useState(7);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Users
  const USERS_PER_PAGE = 7;
  const [userPage, setUserPage] = useState(1);
  const [usersData, setUsersData] = useState({ items: [], total: 0 });
  const [userLoading, setUserLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchDebounceRef = useRef(null);

  // Blogs
  const BLOGS_PER_PAGE = 10;
  const [blogPage, setBlogPage] = useState(1);
  const [blogsData, setBlogsData] = useState({ items: [], total: 0 });
  const [blogLoading, setBlogLoading] = useState(false);

  // Create user modal
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", role: "USER", password: "" });
  const [creatingUser, setCreatingUser] = useState(false);

  // ----------------- EFFECTS -----------------
  useEffect(() => {
    if (activeTab === "Dashboard") fetchSummary(range);
  }, [activeTab, range]);

  useEffect(() => {
    if (activeTab === "User Management") fetchUsers(userPage);
  }, [activeTab, userPage]);

  useEffect(() => {
    if (activeTab === "Blog Management") fetchBlogs(blogPage);
  }, [activeTab, blogPage]);

  // ----------------- API CALLS -----------------
  async function fetchSummary(days) {
    setLoadingSummary(true);
    try {
      const res = await axios.get(`/api/admin/stats?days=${days}`);
      const subsRes = await axios.get(`/api/admin/subscriptions?days=${days}`);
      setSummary({
        ...res.data,
        recentSubscriptions: Array.isArray(subsRes.data.subscriptions)
          ? subsRes.data.subscriptions.slice(0, 5)
          : [],
      });
    } catch (err) {
      console.error("fetchSummary error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function fetchUsers(page = 1) {
    setUserLoading(true);
    try {
      const res = await axios.get("/users");
      let arr = [];
      if (Array.isArray(res.data)) arr = res.data;
      else if (Array.isArray(res.data.items)) arr = res.data.items;
      else if (Array.isArray(res.data.users)) arr = res.data.users;
      else if (res.data && typeof res.data === "object") arr = Object.values(res.data);
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
      const res = await axios.get("/api/blogs");
      let arr = [];
      if (Array.isArray(res.data)) arr = res.data;
      else if (Array.isArray(res.data.items)) arr = res.data.items;
      else if (Array.isArray(res.data.blogs)) arr = res.data.blogs;
      else if (res.data && typeof res.data === "object") arr = Object.values(res.data);

      const normalized = arr.map(b => ({
        ...b,
        trending: b.trending ?? false,
        latest: b.latest ?? false,
        likesCount: b.likesCount ?? b._count?.likes ?? 0,
        commentsCount: b.commentsCount ?? b._count?.comments ?? 0,
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

  // ----------------- SEARCH -----------------
  function onSearchChange(value) {
    setSearchTerm(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!value.trim()) {
      if (activeTab === "User Management") fetchUsers(1);
      if (activeTab === "Blog Management") fetchBlogs(1);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      if (activeTab === "Blog Management") {
        try {
          const res = await axios.get(`/api/blogs/search?query=${encodeURIComponent(value)}`);
          const arr = Array.isArray(res.data) ? res.data : res.data.data || res.data.items || [];
          setBlogsData({ items: arr, total: arr.length });
        } catch {
          setBlogsData({ items: [], total: 0 });
        }
      } else if (activeTab === "User Management") {
        try {
          const res = await axios.get("/users");
          const arr = Array.isArray(res.data)
            ? res.data
            : res.data.users || res.data.items || [];
          const filtered = arr.filter(u =>
            (u.username || "").toLowerCase().includes(value.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(value.toLowerCase()) ||
            (u.role || "").toLowerCase().includes(value.toLowerCase())
          );
          setUsersData({ items: filtered.slice(0, USERS_PER_PAGE), total: filtered.length });
        } catch {
          setUsersData({ items: [], total: 0 });
        }
      }
    }, 300);
  }

  // ----------------- ACTIONS -----------------
  async function handleSuspendUser(id) {
    window.location.href = `/suspend/${id}`;
  }

  async function handleDeleteUser(id) {
    if (!confirm("Delete this user?")) return;
    await axios.delete(`/users/${id}`);
    fetchUsers(userPage);
  }

  async function handleDeleteBlog(id) {
    if (!confirm("Delete this blog?")) return;
    await axios.delete(`/api/blog/${id}`);
    fetchBlogs(blogPage);
  }

  // ----------------- RENDER -----------------
  const totalUserPages = Math.max(1, Math.ceil(usersData.total / USERS_PER_PAGE));
  const totalBlogPages = Math.max(1, Math.ceil(blogsData.total / BLOGS_PER_PAGE));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <div className="flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(null); setSearchTerm(""); }}
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
          <section>
            <div className="flex justify-between mb-4">
              <div>
                <label>Range:</label>
                <select
                  value={range}
                  onChange={e => setRange(Number(e.target.value))}
                  className="bg-gray-800 ml-2 rounded px-2 py-1"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={100}>Last 100 days</option>
                </select>
              </div>
              <button onClick={() => fetchSummary(range)} className="px-3 py-1 rounded bg-gray-800">
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard title="Total Users" value={summary?.totals?.totalUsers ?? "—"} />
              <SummaryCard title="Total Authors" value={summary?.totals?.totalAuthors ?? "—"} />
              <SummaryCard title="Total Blogs" value={summary?.totals?.totalBlogs ?? "—"} />
              <SummaryCard title="New Users" value={summary?.newInTimeframe?.newUsers ?? "—"} />
            </div>

            <div className="mt-6 bg-gray-950/30 p-4 rounded">
              <h3 className="text-lg mb-3">Recent Subscriptions</h3>
              {Array.isArray(summary?.recentSubscriptions) && summary.recentSubscriptions.length ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-300">
                      <th>User</th><th>Amount</th><th>Date</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentSubscriptions.map(s => (
                      <tr key={s.id} className="border-t border-gray-800">
                        <td>{s.username}</td>
                        <td>{s.amountPaid ?? "-"}</td>
                        <td>{new Date(s.createdAt).toLocaleString()}</td>
                        <td>{s.isActive ? "active" : "expired"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 text-sm">No recent subscriptions</p>
              )}
            </div>
          </section>
        )}

        {/* USER MANAGEMENT */}
        {activeTab === "User Management" && (
          <section>
            <div className="flex justify-between mb-4">
              <input
                placeholder="Search username, email or role"
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className="px-3 py-2 rounded bg-gray-800 text-sm w-64"
              />
            </div>

            <div className="bg-gray-950/20 rounded p-3 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-300">
                    <th>Username</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userLoading ? (
                    <tr><td colSpan={5}>Loading...</td></tr>
                  ) : Array.isArray(usersData.items) && usersData.items.length ? (
                    usersData.items.map(u => (
                      <tr key={u.id} className="border-t border-gray-800">
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="flex gap-2">
                          <button onClick={() => handleSuspendUser(u.id)} className="px-2 py-1 bg-yellow-600 rounded text-xs">Suspend</button>
                          <button onClick={() => handleDeleteUser(u.id)} className="px-2 py-1 bg-red-600 rounded text-xs">Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="text-gray-400">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* BLOG MANAGEMENT */}
        {activeTab === "Blog Management" && (
          <section>
            <div className="flex justify-between mb-4">
              <input
                placeholder="Search blogs by title, author or category"
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className="px-3 py-2 rounded bg-gray-800 text-sm w-64"
              />
            </div>

            <div className="bg-gray-950/20 rounded p-3 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-300">
                    <th>Title</th><th>Author</th><th>Likes</th><th>Comments</th>
                    <th>Category</th><th>Status</th><th>Created</th><th>Updated</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogLoading ? (
                    <tr><td colSpan={9}>Loading...</td></tr>
                  ) : Array.isArray(blogsData.items) && blogsData.items.length ? (
                    blogsData.items.map(b => (
                      <tr key={b.id} className="border-t border-gray-800">
                        <td>{b.title}</td>
                        <td>{b.author?.username ?? "N/A"}</td>
                        <td>{b.likesCount}</td>
                        <td>{b.commentsCount}</td>
                        <td>{b.Category?.name ?? "N/A"}</td>
                        <td>
                          {b.trending ? (
                            <span className="text-green-400">Trending</span>
                          ) : b.latest ? (
                            <span className="text-blue-300">Latest</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td>{b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : "-"}</td>
                        <td><button onClick={() => handleDeleteBlog(b.id)} className="px-2 py-1 bg-red-600 rounded text-xs">Delete</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={9} className="text-gray-400">No blogs found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {error && <div className="mt-4 text-red-400">{error}</div>}
      </div>
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
