// AdminDashboard.jsx — Responsive + Live Search + JWT Decode + Creator-protection + Suspend
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router";

const TABS = ["Dashboard", "User Management", "Blog Management"];

export default function AdminDashboard() {
  const navigate = useNavigate();
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
  const [usersRaw, setUsersRaw] = useState([]);
  const [usersData, setUsersData] = useState({ items: [], total: 0 });
  const [userLoading, setUserLoading] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "USER" });
  const [userSearch, setUserSearch] = useState("");

  // Blogs
  const BLOGS_PER_PAGE = 10;
  const [blogPage, setBlogPage] = useState(1);
  const [blogsRaw, setBlogsRaw] = useState([]);
  const [blogsData, setBlogsData] = useState({ items: [], total: 0 });
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogSearch, setBlogSearch] = useState("");

  // Auth info (from JWT)
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const API_BASE = "https://blug-be-api.onrender.com/api";

  // ----------------- JWT helper -----------------
  function decodeJwt(token) {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = parts[1];
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
      const json = atob(padded);
      return JSON.parse(json);
    } catch (e) {
      console.warn("JWT decode failed", e);
      return null;
    }
  }

  useEffect(() => {
    const rawToken = localStorage.getItem("token") || localStorage.getItem("authToken") || null;
    const payload = decodeJwt(rawToken);
    if (payload) {
      const role = (payload.role || payload.user?.role || payload.roles || "").toString().toUpperCase();
      const id = payload.id || payload.userId || payload.sub || payload.user?.id || null;
      setCurrentUserRole(role || null);
      setCurrentUserId(id ?? null);
    } else {
      setCurrentUserRole(null);
      setCurrentUserId(null);
    }
  }, []);

  // ----------------- EFFECTS -----------------
  useEffect(() => { if (activeTab === "Dashboard") fetchDashboard(range); }, [activeTab, range]);
  useEffect(() => { if (activeTab === "User Management") fetchUsers(); }, [activeTab]);
  useEffect(() => { if (activeTab === "Blog Management") fetchBlogs(); }, [activeTab]);

  useEffect(() => { applyUserFilterAndPaginate(1, userSearch, usersRaw); setUserPage(1); }, [userSearch, usersRaw]);
  useEffect(() => { applyBlogFilterAndPaginate(1, blogSearch, blogsRaw); setBlogPage(1); }, [blogSearch, blogsRaw]);
  useEffect(() => { applyUserFilterAndPaginate(userPage, userSearch, usersRaw); }, [userPage]);
  useEffect(() => { applyBlogFilterAndPaginate(blogPage, blogSearch, blogsRaw); }, [blogPage]);

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

  async function fetchUsers() {
    setUserLoading(true);
    try {
      const res = await axios.get(`https://blug-be-api.onrender.com/users`);
      let arr = [];
      if (Array.isArray(res.data)) arr = res.data;
      else if (Array.isArray(res.data.users)) arr = res.data.users;
      else if (Array.isArray(res.data.items)) arr = res.data.items;
      else if (res.data && typeof res.data === "object") arr = Object.values(res.data);

      arr = arr.map((u) => ({ ...u, role: (u.role || "").toString().toUpperCase() }));
      setUsersRaw(arr);
      applyUserFilterAndPaginate(1, userSearch, arr);
    } catch (err) {
      console.error("fetchUsers error:", err);
      setError("Failed to load users");
    } finally { setUserLoading(false); }
  }

  async function fetchBlogs() {
    setBlogLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/blogs`);
      const arr = Array.isArray(res.data) ? res.data : res.data.blogs || res.data.items || res.data.data || [];

      const normalized = arr.map((b) => ({
        ...b,
        trending: b.trending ?? false,
        latest: b.latest ?? false,
        likeCount: b.likes?.length ?? b.likeCount ?? 0,
        commentCount: b.comments?.length ?? b.commentCount ?? 0,
        Category: b.Category || b.category || null,
      }));

      setBlogsRaw(normalized);
      applyBlogFilterAndPaginate(1, blogSearch, normalized);
    } catch (err) {
      console.error("fetchBlogs error:", err);
      setError("Failed to load blogs");
    } finally { setBlogLoading(false); }
  }

  // ----------------- FILTER + PAGINATION -----------------
  function applyUserFilterAndPaginate(page = 1, query = "", arr = []) {
    const q = (query || "").trim().toLowerCase();
    const filtered = q ? arr.filter(u =>
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    ) : arr.slice();

    const start = (page - 1) * USERS_PER_PAGE;
    setUsersData({ items: filtered.slice(start, start + USERS_PER_PAGE), total: filtered.length });
  }

  function applyBlogFilterAndPaginate(page = 1, query = "", arr = []) {
    const q = (query || "").trim().toLowerCase();
    const filtered = q ? arr.filter(b =>
      (b.title || "").toLowerCase().includes(q) ||
      (b.Category?.name || "").toLowerCase().includes(q) ||
      (b.author?.username || "").toLowerCase().includes(q)
    ) : arr.slice();

    const start = (page - 1) * BLOGS_PER_PAGE;
    setBlogsData({ items: filtered.slice(start, start + BLOGS_PER_PAGE), total: filtered.length });
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
      console.error("create user failed", err);
      alert("Failed to create user. Check input or server logs.");
    }
  }

  // ----------------- DELETE -----------------
  async function handleDeleteUser(id) {
    if (!confirm("Delete this user?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return alert("Unauthorized — please log in again.");

    try {
      await axios.delete(`https://blug-be-api.onrender.com/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("delete user failed", err);
      alert("Failed to delete user.");
    }
  }

  async function handleDeleteBlog(id) {
    if (!confirm("Delete this blog?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return alert("Unauthorized — please log in again.");

    try {
      await axios.delete(`${API_BASE}/blog/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBlogs();
    } catch (err) {
      console.error("delete blog failed", err);
      alert("Failed to delete blog.");
    }
  }

  // ----------------- RENDER -----------------
  const totalUserPages = Math.max(1, Math.ceil(usersData.total / USERS_PER_PAGE));
  const totalBlogPages = Math.max(1, Math.ceil(blogsData.total / BLOGS_PER_PAGE));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <div className="flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(null); setUserSearch(""); setBlogSearch(""); }}
                className={`px-3 py-1 rounded-2xl text-sm ${activeTab === tab ? "bg-gray-800" : "bg-gray-950/50"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === "Dashboard" && (
          <DashboardTab range={range} setRange={setRange} loading={loadingDashboard} stats={stats} subscriptions={subscriptions} onRefresh={() => fetchDashboard(range)} />
        )}

        {/* USER MANAGEMENT */}
        {activeTab === "User Management" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-lg">All Users</h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input type="search" placeholder="Live search users (username / email / role)"
                  className="w-full sm:w-80 p-2 rounded bg-gray-800 text-sm"
                  value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                <button onClick={() => setShowCreatePopup(true)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">
                  + Create User
                </button>
              </div>
            </div>

            {userLoading ? <p className="text-gray-400">Loading users...</p> :
              usersData.items.length === 0 ? <p className="text-gray-400">No users found</p> : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto bg-gray-950/30 rounded">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-gray-300">
                          <th className="p-2">Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersData.items.map(u => (
                          <tr key={u.id} className="border-t border-gray-800">
                            <td className="p-2">{u.username}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>
                              {u.role !== "CREATOR" && currentUserRole === "ADMIN" ? (
                                <div className="flex items-center gap-3">
                                  <button onClick={() => navigate(`/suspend/${u.id}`)} className="text-yellow-400 hover:text-yellow-500 text-sm" title="Suspend user">Suspend</button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600 text-sm" title="Delete user">
                                    <FiTrash2 />
                                  </button>
                                </div>
                              ) : <span className="text-gray-500">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {usersData.items.map(u => (
                      <div key={u.id} className="bg-gray-850 p-3 rounded border border-gray-800">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{u.username}</div>
                            <div className="text-sm text-gray-400">{u.email}</div>
                            <div className="text-xs text-gray-500 mt-1">Role: {u.role}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {u.role !== "CREATOR" && currentUserRole === "ADMIN" ? (
                              <>
                                <button onClick={() => navigate(`/suspend/${u.id}`)} className="text-yellow-400 hover:text-yellow-500 text-xs">Suspend</button>
                                <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600 text-sm"><FiTrash2 /></button>
                              </>
                            ) : <div className="text-xs text-gray-500">Protected</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-center mt-3 gap-2">
                    {Array.from({ length: totalUserPages }, (_, i) => (
                      <button key={i} onClick={() => setUserPage(i + 1)} className={`px-2 py-1 rounded ${userPage === i + 1 ? "bg-gray-800" : "bg-gray-950/50"}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              )}
          </section>
        )}

        {/* BLOG MANAGEMENT */}
        {activeTab === "Blog Management" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-lg">All Blogs</h3>
              <input type="search" placeholder="Live search blogs (title / category / author)"
                className="w-full sm:w-80 p-2 rounded bg-gray-800 text-sm"
                value={blogSearch} onChange={(e) => setBlogSearch(e.target.value)} />
            </div>

            {blogLoading ? <p className="text-gray-400">Loading blogs...</p> :
              blogsData.items.length === 0 ? <p className="text-gray-400">No blogs found</p> : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto bg-gray-950/30 rounded">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-gray-300">
                          <th className="p-2">Title</th>
                          <th>Author</th>
                          <th>Likes</th>
                          <th>Comments</th>
                          <th>Category</th>
                          <th>Created</th>
                          <th>Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogsData.items.map(b => (
                          <tr key={b.id} className="border-t border-gray-800">
                            <td className="p-2">{b.title}</td>
                            <td>{b.author?.username || "-"}</td>
                            <td>{b.likeCount || 0}</td>
                            <td>{b.commentCount || 0}</td>
                            <td>{b.Category?.name || "-"}</td>
                            <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}</td>
                            <td>{b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : "-"}</td>
                            <td className="flex items-center gap-2">
                              <button onClick={() => handleDeleteBlog(b.id)} className="text-red-400 hover:text-red-600 text-sm"><FiTrash2 /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {blogsData.items.map(b => (
                      <div key={b.id} className="bg-gray-850 p-3 rounded border border-gray-800">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{b.title}</div>
                            <div className="text-xs text-gray-500">Author: {b.author?.username || "-"}</div>
                            <div className="text-xs text-gray-500">Category: {b.Category?.name || "-"}</div>
                            <div className="text-xs text-gray-400">Likes: {b.likeCount || 0} | Comments: {b.commentCount || 0}</div>
                          </div>
                          <button onClick={() => handleDeleteBlog(b.id)} className="text-red-400 hover:text-red-600 text-sm"><FiTrash2 /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-center mt-3 gap-2">
                    {Array.from({ length: totalBlogPages }, (_, i) => (
                      <button key={i} onClick={() => setBlogPage(i + 1)} className={`px-2 py-1 rounded ${blogPage === i + 1 ? "bg-gray-800" : "bg-gray-950/50"}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              )}
          </section>
        )}

        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>

      {/* CREATE USER POPUP */}
      {showCreatePopup && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <form onSubmit={handleCreateUser} className="bg-gray-950 p-6 rounded w-80 flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Create New User</h2>
            <input placeholder="Username" className="p-2 rounded bg-gray-800" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
            <input type="email" placeholder="Email" className="p-2 rounded bg-gray-800" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
            <input type="password" placeholder="Password" className="p-2 rounded bg-gray-800" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
            <select className="p-2 rounded bg-gray-800" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded" onClick={() => setShowCreatePopup(false)}>Cancel</button>
              <button type="submit" className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------- DashboardTab subcomponent -----------------
function DashboardTab({ range, setRange, loading, stats, subscriptions, onRefresh }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <label>Time range:</label>
        <select className="bg-gray-800 p-1 rounded" value={range} onChange={e => setRange(parseInt(e.target.value, 10))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={100}>Last 100 days</option>
        </select>
        <button onClick={onRefresh} className="ml-auto bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">Refresh</button>
      </div>

      {loading ? <p className="text-gray-400">Loading dashboard...</p> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-850 p-4 rounded text-center">
              <div className="text-sm text-gray-400">Total Users</div>
              <div className="text-xl font-semibold">{stats?.totalUsers ?? 0}</div>
            </div>
            <div className="bg-gray-850 p-4 rounded text-center">
              <div className="text-sm text-gray-400">Total Blogs</div>
              <div className="text-xl font-semibold">{stats?.totalBlogs ?? 0}</div>
            </div>
            <div className="bg-gray-850 p-4 rounded text-center">
              <div className="text-sm text-gray-400">Total Authors</div>
              <div className="text-xl font-semibold">{stats?.totalAuthors ?? 0}</div>
            </div>
          </div>

          <div>
            <h4 className="text-lg mb-2">Subscriptions</h4>
            <div className="overflow-x-auto bg-gray-950/30 rounded">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-300">
                    <th className="p-2">Username</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length === 0 ? (
                    <tr><td colSpan={4} className="text-gray-500 text-center p-2">No subscriptions</td></tr>
                  ) : subscriptions.map(sub => (
                    <tr key={sub.id} className="border-t border-gray-800">
                      <td className="p-2">{sub.username}</td>
                      <td>{sub.amount}</td>
                      <td>{new Date(sub.date).toLocaleDateString()}</td>
                      <td>{sub.status ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
