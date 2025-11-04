// AdminDashboard.jsx — Godlike Version: Responsive + Live Search + JWT Decode + Creator/Admin Protection + Suspend/Delete + Dashboard Summaries
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router";

const TABS = ["Dashboard", "User Management", "Blog Management"];
const USERS_PER_PAGE = 7;
const BLOGS_PER_PAGE = 10;

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Active tab & errors
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [error, setError] = useState(null);

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

  // Auth
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const API_BASE = "https://blug-be-api.onrender.com/api";

  // ==================== JWT Decode ====================
  const decodeJwt = (token) => {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = parts[1];
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const payload = decodeJwt(token);
    if (payload) {
      const role = (payload.role || payload.user?.role || "").toUpperCase();
      const id = payload.id || payload.user?.id || payload.sub || null;
      setCurrentUserRole(role);
      setCurrentUserId(id);
    }
  }, []);

  // ==================== API Fetches ====================
  const fetchDashboard = async (days = 7) => {
    setLoadingDashboard(true);
    try {
      const [statsRes, subsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/stats?days=${days}`),
        axios.get(`${API_BASE}/admin/subscriptions?days=${days}`),
      ]);
      setStats(statsRes.data);
      setSubscriptions(subsRes.data.subscriptions || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");
    } finally { setLoadingDashboard(false); }
  };

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/users`);
      let arr = Array.isArray(res.data) ? res.data : res.data.users || res.data.items || [];
      arr = arr.map(u => ({ ...u, role: (u.role || "").toUpperCase() }));
      setUsersRaw(arr);
      applyUserFilterAndPaginate(1, userSearch, arr);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users");
    } finally { setUserLoading(false); }
  };

  const fetchBlogs = async () => {
    setBlogLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/blogs`);
      const arr = Array.isArray(res.data) ? res.data : res.data.blogs || res.data.items || [];
      const normalized = arr.map(b => ({
        ...b,
        trending: b.trending ?? false,
        latest: b.latest ?? false,
        likeCount: b.likes?.length ?? 0,
        commentCount: b.comments?.length ?? 0,
        Category: b.Category || b.category || null,
      }));
      setBlogsRaw(normalized);
      applyBlogFilterAndPaginate(1, blogSearch, normalized);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch blogs");
    } finally { setBlogLoading(false); }
  };

  // ==================== Filter & Paginate ====================
  const applyUserFilterAndPaginate = (page = 1, query = "", arr = []) => {
    const q = (query || "").toLowerCase();
    const filtered = q ? arr.filter(u =>
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    ) : arr.slice();
    const start = (page - 1) * USERS_PER_PAGE;
    setUsersData({ items: filtered.slice(start, start + USERS_PER_PAGE), total: filtered.length });
  };

  const applyBlogFilterAndPaginate = (page = 1, query = "", arr = []) => {
    const q = (query || "").toLowerCase();
    const filtered = q ? arr.filter(b =>
      (b.title || "").toLowerCase().includes(q) ||
      (b.Category?.name || "").toLowerCase().includes(q) ||
      (b.author?.username || "").toLowerCase().includes(q)
    ) : arr.slice();
    const start = (page - 1) * BLOGS_PER_PAGE;
    setBlogsData({ items: filtered.slice(start, start + BLOGS_PER_PAGE), total: filtered.length });
  };

  // ==================== User Actions ====================
  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return alert("Unauthorized — please log in again.");
    try {
      await axios.delete(`${API_BASE}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err) { console.error(err); alert("Failed to delete user"); }
  };

  const handleDeleteBlog = async (id) => {
    if (!confirm("Delete this blog?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return alert("Unauthorized — please log in again.");
    try {
      await axios.delete(`${API_BASE}/blog/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchBlogs();
    } catch (err) { console.error(err); alert("Failed to delete blog"); }
  };

  // ==================== Effects ====================
  useEffect(() => { if (activeTab === "Dashboard") fetchDashboard(range); }, [activeTab, range]);
  useEffect(() => { if (activeTab === "User Management") fetchUsers(); }, [activeTab]);
  useEffect(() => { if (activeTab === "Blog Management") fetchBlogs(); }, [activeTab]);
  useEffect(() => { applyUserFilterAndPaginate(userPage, userSearch, usersRaw); }, [userPage, userSearch, usersRaw]);
  useEffect(() => { applyBlogFilterAndPaginate(blogPage, blogSearch, blogsRaw); }, [blogPage, blogSearch, blogsRaw]);

  // ==================== Render ====================
  const totalUserPages = Math.max(1, Math.ceil(usersData.total / USERS_PER_PAGE));
  const totalBlogPages = Math.max(1, Math.ceil(blogsData.total / BLOGS_PER_PAGE));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Header tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Contents */}
        {activeTab === "Dashboard" && (
          <DashboardTab range={range} setRange={setRange} loading={loadingDashboard} stats={stats} subscriptions={subscriptions} onRefresh={() => fetchDashboard(range)} />
        )}

        {activeTab === "User Management" && (
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
            currentUserRole={currentUserRole}
          />
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
          />
        )}

        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  );
}

// ==================== Header Component ====================
function Header({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActiveTab(t)}
          className={`px-4 py-2 rounded ${activeTab === t ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ==================== DashboardTab Component ====================
function DashboardTab({ range, setRange, loading, stats, subscriptions, onRefresh }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <span>Filter range: </span>
          {[7, 30, 100].map(d => (
            <button key={d} onClick={() => setRange(d)} className={`mx-1 px-2 py-1 rounded ${range === d ? "bg-blue-500" : "bg-gray-700"}`}>{d} days</button>
          ))}
        </div>
        <button onClick={onRefresh} className="px-3 py-1 bg-green-600 rounded">Refresh</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={stats?.totalUsers || 0} />
            <StatCard label="Total Blogs" value={stats?.totalBlogs || 0} />
            <StatCard label="Total Authors" value={stats?.totalAuthors || 0} />
            <StatCard label="Subscriptions" value={subscriptions.length} />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Username</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(s => (
                  <tr key={s.id} className="border-b border-gray-700">
                    <td className="px-3 py-2">{s.username}</td>
                    <td>{s.email}</td>
                    <td>{s.amount}</td>
                    <td>{new Date(s.date).toLocaleDateString()}</td>
                    <td>{s.active ? "Active" : "Expired"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

// ==================== ManagementTab Component ====================
function ManagementTab({ type, items, search, setSearch, page, setPage, totalPages, loading, onDelete, onSuspend, currentUserRole }) {
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

      {loading ? <p>Loading...</p> : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-800">
                <tr>
                  {type === "users" && <>
                    <th className="px-3 py-2">Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </>}
                  {type === "blogs" && <>
                    <th className="px-3 py-2">Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>Actions</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-gray-700">
                    {type === "users" && <>
                      <td className="px-3 py-2">{item.username}</td>
                      <td>{item.email}</td>
                      <td>{item.role}</td>
                      <td className="flex gap-2">
                        {currentUserRole === "ADMIN" && item.role !== "CREATOR" && onSuspend && (
                          <button className="px-2 py-1 bg-yellow-500 rounded" onClick={() => onSuspend(item.id)}>Suspend</button>
                        )}
                        <button className="px-2 py-1 bg-red-600 rounded" onClick={() => onDelete(item.id)}>
                          <FiTrash2 />
                        </button>
                      </td>
                    </>}
                    {type === "blogs" && <>
                      <td className="px-3 py-2">{item.title}</td>
                      <td>{item.author?.username || "-"}</td>
                      <td>{item.Category?.name || "-"}</td>
                      <td>{item.likeCount}</td>
                      <td>{item.commentCount}</td>
                      <td>
                        <button className="px-2 py-1 bg-red-600 rounded" onClick={() => onDelete(item.id)}>
                          <FiTrash2 />
                        </button>
                      </td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded ${p === page ? "bg-blue-500" : "bg-gray-700"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
