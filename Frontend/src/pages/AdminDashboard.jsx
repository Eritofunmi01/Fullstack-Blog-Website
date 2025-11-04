// AdminDashboard.jsx — Responsive + Live Search + JWT Decode + Creator-protection
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
  const [usersRaw, setUsersRaw] = useState([]); // full list from server
  const [usersData, setUsersData] = useState({ items: [], total: 0 }); // paginated view (after filtering)
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
      // base64url -> base64
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
      const json = atob(padded);
      return JSON.parse(json);
    } catch (e) {
      console.warn("JWT decode failed", e);
      return null;
    }
  }

  // initialize current user role from token
  useEffect(() => {
    const rawToken = localStorage.getItem("token") || localStorage.getItem("authToken") || null;
    const payload = decodeJwt(rawToken);
    if (payload) {
      // handle different claim names; common: role, user?.role, sub, id
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
  useEffect(() => {
    if (activeTab === "Dashboard") fetchDashboard(range);
  }, [activeTab, range]);

  useEffect(() => {
    if (activeTab === "User Management") {
      fetchUsers(); // fetch full list then view is derived from usersRaw + filter/pagination
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "Blog Management") {
      fetchBlogs();
    }
  }, [activeTab]);

  // live filtering effects
  useEffect(() => {
    applyUserFilterAndPaginate(1, userSearch, usersRaw);
    setUserPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch, usersRaw]);

  useEffect(() => {
    applyBlogFilterAndPaginate(1, blogSearch, blogsRaw);
    setBlogPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogSearch, blogsRaw]);

  useEffect(() => {
    applyUserFilterAndPaginate(userPage, userSearch, usersRaw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage]);

  useEffect(() => {
    applyBlogFilterAndPaginate(blogPage, blogSearch, blogsRaw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogPage]);

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
      // backend returns { users: [...] } OR array directly — normalize.
      let arr = [];
      if (Array.isArray(res.data)) arr = res.data;
      else if (Array.isArray(res.data.users)) arr = res.data.users;
      else if (Array.isArray(res.data.items)) arr = res.data.items;
      else if (res.data && typeof res.data === "object") arr = Object.values(res.data);

      // ensure role keys are uppercase for consistency
      arr = arr.map((u) => ({ ...u, role: (u.role || "").toString().toUpperCase() }));

      setUsersRaw(arr);
      applyUserFilterAndPaginate(1, userSearch, arr);
    } catch (err) {
      console.error("fetchUsers error:", err);
      setError("Failed to load users");
    } finally {
      setUserLoading(false);
    }
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
    } finally {
      setBlogLoading(false);
    }
  }

  // ----------------- FILTER + PAGINATION HELPERS -----------------
  function applyUserFilterAndPaginate(page = 1, query = "", arr = []) {
    const q = (query || "").trim().toLowerCase();
    const filtered = q
      ? arr.filter(
          (u) =>
            (u.username || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q) ||
            (u.role || "").toLowerCase().includes(q)
        )
      : arr.slice();

    const start = (page - 1) * USERS_PER_PAGE;
    setUsersData({ items: filtered.slice(start, start + USERS_PER_PAGE), total: filtered.length });
  }

  function applyBlogFilterAndPaginate(page = 1, query = "", arr = []) {
    const q = (query || "").trim().toLowerCase();
    const filtered = q
      ? arr.filter(
          (b) =>
            (b.title || "").toLowerCase().includes(q) ||
            (b.Category?.name || "").toLowerCase().includes(q) ||
            (b.author?.username || "").toLowerCase().includes(q)
        )
      : arr.slice();

    const start = (page - 1) * BLOGS_PER_PAGE;
    setBlogsData({ items: filtered.slice(start, start + BLOGS_PER_PAGE), total: filtered.length });
  }

  // ----------------- CREATE USER -----------------
  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      // simple payload; adjust to backend shape if needed
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
    try {
      await axios.delete(`${API_BASE}/users/${id}`);
      // refresh local list
      fetchUsers();
    } catch (err) {
      console.error("delete user failed", err);
      alert("Failed to delete user.");
    }
  }

  async function handleDeleteBlog(id) {
    if (!confirm("Delete this blog?")) return;
    try {
      await axios.delete(`${API_BASE}/blog/${id}`);
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
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setError(null);
                  setUserSearch("");
                  setBlogSearch("");
                }}
                className={`px-3 py-1 rounded-2xl text-sm ${activeTab === tab ? "bg-gray-800" : "bg-gray-950/50"}`}
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

        {/* USER MANAGEMENT */}
        {activeTab === "User Management" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-lg">All Users</h3>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="search"
                  placeholder="Live search users (username / email / role)"
                  className="w-full sm:w-80 p-2 rounded bg-gray-800 text-sm"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <button
                  onClick={() => setShowCreatePopup(true)}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                >
                  + Create User
                </button>
              </div>
            </div>

            {userLoading ? (
              <p className="text-gray-400">Loading users...</p>
            ) : usersData.items.length === 0 ? (
              <p className="text-gray-400">No users found</p>
            ) : (
              <>
                {/* table for md+ */}
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
                      {usersData.items.map((u) => (
                        <tr key={u.id} className="border-t border-gray-800">
                          <td className="p-2">{u.username}</td>
                          <td>{u.email}</td>
                          <td>{u.role}</td>
                          <td>
                            {/* Hide delete entirely for creators */}
                            {u.role !== "CREATOR" && currentUserRole === "ADMIN" ? (
                              <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600">
                                Delete
                              </button>
                            ) : (
                              // keep spacing consistent; invisible placeholder for non-admin or creators
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* mobile cards */}
                <div className="md:hidden space-y-3">
                  {usersData.items.map((u) => (
                    <div key={u.id} className="bg-gray-850 p-3 rounded border border-gray-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{u.username}</div>
                          <div className="text-sm text-gray-400">{u.email}</div>
                          <div className="text-xs text-gray-500 mt-1">Role: {u.role}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {u.role !== "CREATOR" && currentUserRole === "ADMIN" ? (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-400 hover:text-red-600 text-sm"
                            >
                              Delete
                            </button>
                          ) : (
                            <div className="text-xs text-gray-500">Protected</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination page={userPage} totalPages={totalUserPages} onPageChange={setUserPage} />
              </>
            )}

            {/* CREATE USER POPUP */}
            {showCreatePopup && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <form onSubmit={handleCreateUser} className="bg-gray-800 p-6 rounded-xl w-full max-w-md space-y-3">
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
                    <option value="CREATOR">CREATOR</option>
                  </select>

                  <div className="flex justify-end gap-2 mt-3">
                    <button type="button" onClick={() => setShowCreatePopup(false)} className="px-3 py-1 rounded bg-gray-700">
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

        {/* BLOG MANAGEMENT */}
        {activeTab === "Blog Management" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-lg">All Blogs</h3>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="search"
                  placeholder="Live search blogs (title / category / author)"
                  className="w-full sm:w-96 p-2 rounded bg-gray-800 text-sm"
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                />
              </div>
            </div>

            {blogLoading ? (
              <p className="text-gray-400">Loading blogs...</p>
            ) : blogsData.items.length === 0 ? (
              <p className="text-gray-400">No blogs found</p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto bg-gray-950/30 rounded">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-300">
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
                            {currentUserRole === "ADMIN" ? (
                              <button onClick={() => handleDeleteBlog(b.id)} className="text-red-400 hover:text-red-600">
                                Delete
                              </button>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {blogsData.items.map((b) => (
                    <div key={b.id} className="bg-gray-850 p-3 rounded border border-gray-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{b.title}</div>
                          <div className="text-sm text-gray-400">{b.Category?.name} • {b.author?.username}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {b.likeCount} likes • {b.commentCount} comments
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(b.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {currentUserRole === "ADMIN" ? (
                            <button onClick={() => handleDeleteBlog(b.id)} className="text-red-400 hover:text-red-600 text-sm">
                              Delete
                            </button>
                          ) : (
                            <div className="text-xs text-gray-500">No actions</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination page={blogPage} totalPages={totalBlogPages} onPageChange={setBlogPage} />
              </>
            )}
          </section>
        )}

        {error && <div className="mt-4 text-red-400">{error}</div>}
      </div>
    </div>
  );
}

/* --- Small reusable components --- */

function DashboardTab({ range, setRange, loading, stats, subscriptions, onRefresh }) {
  return (
    <section>
      <div className="flex justify-between mb-4">
        <div>
          <label>Range:</label>
          <select value={range} onChange={(e) => setRange(Number(e.target.value))} className="bg-gray-800 ml-2 rounded px-2 py-1">
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
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">
        Prev
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">
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
