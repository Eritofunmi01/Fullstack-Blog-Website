// AdminDashboard.jsx — Final Fixed (Create User modal cleaned, single modal state, consistent endpoint)
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi";
import { FaLevelUpAlt, FaLevelDownAlt, FaEdit } from "react-icons/fa";
import { useNavigate, Link } from "react-router";

const TABS = ["Dashboard", "User Management", "Blog Management"];
const USERS_PER_PAGE = 7;
const BLOGS_PER_PAGE = 10;

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Active tab & errors
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  // Dashboard
  const [range, setRange] = useState(7);
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Users
  const [usersRaw, setUsersRaw] = useState([]);
  const [usersData, setUsersData] = useState({ items: [], total: 0 });
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userLoading, setUserLoading] = useState(false);

  // Blogs
  const [blogsRaw, setBlogsRaw] = useState([]);
  const [blogsData, setBlogsData] = useState({ items: [], total: 0 });
  const [blogPage, setBlogPage] = useState(1);
  const [blogSearch, setBlogSearch] = useState("");
  const [blogLoading, setBlogLoading] = useState(false);

  // Create user modal state (single consistent state)
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [createMessage, setCreateMessage] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [popup, setPopup] = useState(null);

  // Auth
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  /// ✅ Promote to Admin
  const handlePromote = async (id) => {
    try {
      setActionLoading(true);
      const res = await axios.put(
        `https://blug-be-api.onrender.com/make-admin/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "User promoted to Admin.");
      window.location.reload();
    } catch (error) {
      console.error("Promotion failed:", error);
      alert("Failed to promote user.");
    } finally {
      setActionLoading(false);
      setPopup(null);
    }
  };

  // ✅ Demote to User
  const handleDemote = async (id) => {
    try {
      setActionLoading(true);
      const res = await axios.post(
        `https://blug-be-api.onrender.com/fix-admin-roles`,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "User demoted to User.");
      window.location.reload();
    } catch (error) {
      console.error("Demotion failed:", error);
      alert("Failed to demote user.");
    } finally {
      setActionLoading(false);
      setPopup(null);
    }
  };

  // API base (use paths already used elsewhere in your app)
  const API_BASE = "https://blug-be-api.onrender.com/api";
  const SIGNUP_URL = "https://blug-be-api.onrender.com/signup"; // your router uses POST /signup

  // ----------------- JWT helper -----------------
  const decodeJwt = (token) => {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = parts[1];
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "="
      );
      return JSON.parse(atob(padded));
    } catch (e) {
      console.warn("JWT decode failed", e);
      return null;
    }
  };

  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    const payload = decodeJwt(token);
    if (payload) {
      const role = (payload.role || payload.user?.role || "")
        .toString()
        .toUpperCase();
      const id = payload.id || payload.user?.id || payload.sub || null;
      setCurrentUserRole(role || null);
      setCurrentUserId(id ?? null);
    } else {
      setCurrentUserRole(null);
      setCurrentUserId(null);
    }
  }, []);

  // ----------------- API CALLS -----------------
  const fetchDashboard = async (days = 7) => {
    setLoadingDashboard(true);
    try {
      const [statsRes, subsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/stats?days=${days}`),
        axios.get(`${API_BASE}/admin/subscriptions?days=${days}`),
      ]);
      setStats(statsRes.data || null);
      const subs = subsRes.data?.subscriptions ?? subsRes.data ?? [];
      setSubscriptions(Array.isArray(subs) ? subs : []);
    } catch (err) {
      console.error("fetchDashboard error", err);
      setError("Failed to load dashboard");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const res = await axios.get(`https://blug-be-api.onrender.com/users`);
      let arr = Array.isArray(res.data)
        ? res.data
        : res.data.users || res.data.items || [];
      arr = arr.map((u) => ({
        ...u,
        role: (u.role || "").toString().toUpperCase(),
      }));
      setUsersRaw(arr);
      applyUserFilterAndPaginate(1, userSearch, arr);
    } catch (err) {
      console.error("fetchUsers error", err);
      setError("Failed to fetch users");
    } finally {
      setUserLoading(false);
    }
  };

  const fetchBlogs = async () => {
    setBlogLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/blogs`);
      const arr = Array.isArray(res.data)
        ? res.data
        : res.data.blogs || res.data.items || res.data.data || [];
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
      console.error("fetchBlogs error", err);
      setError("Failed to fetch blogs");
    } finally {
      setBlogLoading(false);
    }
  };

  // ----------------- Filter + Pagination -----------------
  const applyUserFilterAndPaginate = (page = 1, query = "", arr = []) => {
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
    setUsersData({
      items: filtered.slice(start, start + USERS_PER_PAGE),
      total: filtered.length,
    });
  };

  const applyBlogFilterAndPaginate = (page = 1, query = "", arr = []) => {
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
    setBlogsData({
      items: filtered.slice(start, start + BLOGS_PER_PAGE),
      total: filtered.length,
    });
  };

  // ----------------- Create User -----------------
  // NOTE: your backend signup controller in the code you shared forces role: "USER".
  // So even if the UI sends role: "ADMIN", the current endpoint will create a USER.
  // If you add an admin-aware create route you can swap SIGNUP_URL to that endpoint.
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateMessage("");
    setCreatingUser(true);

    try {
      // Use the signup route you provided. It expects { username, email, password }.
      // Sending role as well won't hurt but your controller currently ignores it.
      const payload = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role, // backend may ignore this currently
      };

      await axios.post(SIGNUP_URL, payload);
      setCreateMessage("✅ User created successfully.");
      setShowCreatePopup(false);
      setNewUser({ username: "", email: "", password: "", role: "USER" });
      // refresh users
      fetchUsers();
    } catch (err) {
      console.error("create user failed", err);
      const msg =
        err.response?.data?.message ||
        "Failed to create user. Check server logs.";
      setCreateMessage(`❌ ${msg}`);
    } finally {
      setCreatingUser(false);
    }
  };

  // ----------------- Delete / Suspend -----------------
  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
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
  };

  const handleDeleteBlog = async (id) => {
    if (!confirm("Delete this blog?")) return;
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
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
  };

  // ----------------- Effects -----------------
  useEffect(() => {
    if (activeTab === "Dashboard") fetchDashboard(range);
  }, [activeTab, range]);

  useEffect(() => {
    if (activeTab === "User Management") fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "Blog Management") fetchBlogs();
  }, [activeTab]);

  useEffect(() => {
    applyUserFilterAndPaginate(userPage, userSearch, usersRaw);
  }, [userPage, userSearch, usersRaw]);

  useEffect(() => {
    applyBlogFilterAndPaginate(blogPage, blogSearch, blogsRaw);
  }, [blogPage, blogSearch, blogsRaw]);

  // ----------------- Render -----------------
  const totalUserPages = Math.max(
    1,
    Math.ceil(usersData.total / USERS_PER_PAGE)
  );
  const totalBlogPages = Math.max(
    1,
    Math.ceil(blogsData.total / BLOGS_PER_PAGE)
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Header tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tabs */}
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

        {activeTab === "User Management" && (
          <section className="relative">
            {/* Top row — title + create button (ADMIN only) */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Management</h3>
              {currentUserRole === "ADMIN" ||
                ("CREATOR" && (
                  <button
                    onClick={() => {
                      setCreateMessage("");
                      setShowCreatePopup(true);
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    + Create User
                  </button>
                ))}
            </div>

            {/* existing management table (unchanged) */}
            <ManagementTab
              type="users"
              items={usersData.items}
              search={userSearch}
              setSearch={setUserSearch}
              page={userPage}
              setPage={setUserPage}
              totalPages={totalUserPages}
              loading={userLoading}
              onDelete={handleDeleteUser}
              onSuspend={(id) => navigate(`/suspend/${id}`)}
              onPromote={handlePromote}
              onDemote={handleDemote}
              currentUserRole={currentUserRole}
            />

            {/* Create user modal (single, consistent) */}
            {showCreatePopup && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-gray-900 w-full max-w-md p-6 rounded-lg shadow-lg">
                  <h4 className="text-lg mb-4 font-semibold">
                    Create New User
                  </h4>

                  <form onSubmit={handleCreateUser} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Username"
                      className="w-full px-3 py-2 bg-gray-800 rounded"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      required
                    />

                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-3 py-2 bg-gray-800 rounded"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      required
                    />

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="w-full px-3 py-2 bg-gray-800 rounded pr-10"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                      >
                        {showPassword ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.5 16.018 7.36 19 12 19c1.893 0 3.678-.44 5.247-1.223M9.88 9.88a3 3 0 104.24 4.24M15 15l3.586 3.586M6 6l12 12"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Role selector kept but note: your current signup controller creates USER regardless */}
                    <select
                      className="w-full px-3 py-2 bg-gray-800 rounded"
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>

                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setShowCreatePopup(false)}
                        className="px-3 py-2 bg-gray-700 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingUser}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                      >
                        {creatingUser ? "Creating..." : "Create"}
                      </button>
                    </div>
                  </form>

                  {createMessage && (
                    <p className="mt-3 text-sm text-center text-gray-300">
                      {createMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "Blog Management" && (
          <ManagementTab
            type="blogs"
            items={blogsData.items}
            search={blogSearch}
            setSearch={setBlogSearch}
            page={blogPage}
            setPage={setBlogPage}
            totalPages={totalBlogPages}
            loading={blogLoading}
            onDelete={handleDeleteBlog}
            onEdiit={(id) => navigate(`/edit-blog/${id}`)}
            currentUserRole={currentUserRole}
          />
        )}

        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  );
}

/* ---------- subcomponents (unchanged) ---------- */

function Header({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActiveTab(t)}
          className={`px-4 py-2 rounded ${
            activeTab === t ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function DashboardTab({
  range,
  setRange,
  loading,
  stats,
  subscriptions,
  onRefresh,
}) {
  const totals = stats?.totals ?? stats ?? {};
  const subs = Array.isArray(subscriptions) ? subscriptions : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <span className="mr-2">Filter range:</span>
          {[7, 30, 100].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`mx-1 px-2 py-1 rounded ${
                range === d ? "bg-blue-500" : "bg-gray-700"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
        <button onClick={onRefresh} className="px-3 py-1 bg-green-600 rounded">
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={totals?.totalUsers ?? 0} />
            <StatCard label="Total Blogs" value={totals?.totalBlogs ?? 0} />
            <StatCard label="Total Authors" value={totals?.totalAuthors ?? 0} />
            <StatCard
              label="New Users (range)"
              value={stats?.newInTimeframe?.newUsers ?? "-"}
            />
          </div>

          <div className="mt-4">
            <h4 className="mb-2 text-lg">Recent Subscriptions</h4>
            {subs.length === 0 ? (
              <div className="p-4 bg-gray-850 rounded text-gray-400">
                No subscriptions in this period
              </div>
            ) : (
              <div className="overflow-x-auto bg-gray-950/30 rounded">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-3 py-2">User</th>
                      <th>Amount</th>
                      <th>Plan</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => {
                      const username = s.username ?? s.user?.username ?? "-";
                      const amount = s.amountPaid ?? s.amount ?? s.price ?? "-";
                      const plan = s.plan ?? s.subscriptionPlan ?? "-";
                      const date =
                        s.createdAt ?? s.date ?? s.created_at ?? null;
                      const status =
                        typeof s.isActive === "boolean"
                          ? s.isActive
                            ? "Active"
                            : "Expired"
                          : s.status ?? "-";
                      return (
                        <tr
                          key={s.id ?? `${username}-${date}`}
                          className="border-b border-gray-700"
                        >
                          <td className="px-3 py-2">{username}</td>
                          <td>₦{amount}</td>
                          <td>{plan}</td>
                          <td>
                            {date ? new Date(date).toLocaleDateString() : "-"}
                          </td>
                          <td>{status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800 p-4 rounded text-center">
      <p className="text-gray-400">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ManagementTab({
  type,
  items,
  search,
  setSearch,
  page,
  setPage,
  totalPages,
  loading,
  onDelete,
  onEdiit,
  onSuspend,
  onPromote,
  onDemote,
  currentUserRole,
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder={`Search ${type}`}
          className="px-3 py-2 rounded bg-gray-700 focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-800">
                <tr>
                  {type === "users" && (
                    <>
                      <th className="px-3 py-2">Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </>
                  )}
                  {type === "blogs" && (
                    <>
                      <th className="px-3 py-2">Title</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Likes</th>
                      <th>Comments</th>
                      <th>Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-700">
                    {type === "users" && (
                      <>
                        <td className="px-3 py-2">{item.username}</td>
                        <td>{item.email}</td>
                        <td>{item.role}</td>
                        <td className="flex gap-2 items-center">
                          {/* Suspend */}
                          {(currentUserRole === "ADMIN" ||
                            currentUserRole === "CREATOR") &&
                            item.role !== "CREATOR" &&
                            onSuspend && (
                              <button
                                className="px-2 py-1 bg-yellow-500 rounded"
                                onClick={() => onSuspend(item.id)}
                              >
                                Suspend
                              </button>
                            )}

                          {/* Delete */}
                          {(currentUserRole === "ADMIN" ||
                            currentUserRole === "CREATOR") &&
                          item.role !== "CREATOR" ? (
                            <button
                              className="px-2 py-1 bg-red-600 rounded text-white"
                              onClick={() => onDelete(item.id)}
                            >
                              <FiTrash2 />
                            </button>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}

                          {/* Promote / Demote (CREATOR only) */}
                          {currentUserRole === "CREATOR" && (
                            <>
                              {item.role !== "CREATOR" && (
                                <>
                                  {item.role === "ADMIN" ? (
                                    <button
                                      className="px-2 py-1 bg-red-500 rounded text-white"
                                      onClick={() => onDemote(item.id)}
                                      title="Demote User"
                                    >
                                      <FaLevelDownAlt />
                                    </button>
                                  ) : (
                                    <button
                                      className="px-2 py-1 bg-green-500 rounded text-white"
                                      onClick={() => onPromote(item.id)}
                                      title="Promote User"
                                    >
                                      <FaLevelUpAlt />
                                    </button>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </td>
                      </>
                    )}

                    {type === "blogs" && (
                      <>
                        <td className="px-3 py-2">{item.title}</td>
                        <td>{item.author?.username || "-"}</td>
                        <td>{item.Category?.name || "-"}</td>
                        <td>{item.likeCount ?? 0}</td>
                        <td>{item.commentCount ?? 0}</td>
                        <td className="flex">
                          {(currentUserRole === "ADMIN" ||
                            currentUserRole === "CREATOR") && (
                            <button
                              className="px-2 ml-2 py-1 rounded text-red-600"
                              onClick={() => onDelete(item.id)}
                            >
                              <FiTrash2 size={20} />
                            </button>
                          )}
                          {(currentUserRole === "ADMIN" ||
                            currentUserRole === "CREATOR") && (
                            <button
                              onClick={(e) => onEdiit(item.id)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <FaEdit size={20} />
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-4 gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
