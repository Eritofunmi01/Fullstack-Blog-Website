import React, { useState, useEffect } from "react";
import { FaTrash, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router";
import axios from "axios";

const API_BASE = "https://blug-be-api.onrender.com/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);

  const [searchUser, setSearchUser] = useState("");
  const [searchBlog, setSearchBlog] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);

  const [userPage, setUserPage] = useState(1);
  const [blogPage, setBlogPage] = useState(1);
  const navigate = useNavigate();

  const USERS_PER_PAGE = 7;
  const BLOGS_PER_PAGE = 7;

  // Fetch Data
  useEffect(() => {
    if (activeTab === "dashboard") fetchSubscriptions();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "blogs") fetchBlogs();
  }, [activeTab]);

// State + Fetch Logic
const [subscriptions, setSubscriptions] = useState([]);
const [selectedDays, setSelectedDays] = useState(30); // default filter is 30 days

const fetchSubscriptions = async (days = 30) => {
  try {
    const res = await axios.get(`${API_BASE}/admin/subscriptions?days=${days}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // make sure token is included
      },
    });
    setSubscriptions(res.data.data || []);
  } catch (error) {
    console.error("getSubscriptions error:", error);
  }
};

// auto fetch on load or when filter changes
useEffect(() => {
  fetchSubscriptions(selectedDays);
}, [selectedDays]);


  const fetchUsers = async () => {
    try {
      const res = await axios.get(`https://blug-be-api.onrender.com/users`);
      setUsers(res.data.data || res.data || []);
      setFilteredUsers(res.data.data || res.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchBlogs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/blogs`);
      setBlogs(res.data.data || res.data || []);
      setFilteredBlogs(res.data.data || res.data || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  // USER MANAGEMENT
  const handleUserSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchUser(value);
    if (value.trim() === "") {
      setFilteredUsers(users);
    } else {
      const results = users.filter(
        (u) =>
          u.username?.toLowerCase().includes(value) ||
          u.email?.toLowerCase().includes(value) ||
          u.role?.toLowerCase().includes(value)
      );
      setFilteredUsers(results.length ? results : []);
    }
  };

  const handleSuspend = (id) => {
    navigate(`/suspend/${id}`);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`https://blug-be-api.onrender.com/users/${id}`, {
        withCredentials: true,
      });
      fetchUsers();
    } catch (error) {
      console.error("Delete user error:", error);
    }
  };

  const paginateUsers = (page) => setUserPage(page);
const paginatedUsers = Array.isArray(filteredUsers)
  ? filteredUsers.slice(
      (userPage - 1) * USERS_PER_PAGE,
      userPage * USERS_PER_PAGE
    )
  : [];


  // BLOG MANAGEMENT
  const handleBlogSearch = async (e) => {
    const value = e.target.value.toLowerCase();
    setSearchBlog(value);
    if (value.trim() === "") {
      fetchBlogs();
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/blogs/search?query=${value}`);
      setFilteredBlogs(res.data.data || []);
    } catch (error) {
      console.error("Error searching blogs:", error);
    }
  };

  const handleDeleteBlog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await axios.delete(`${API_BASE}/blog/${id}`, {
        withCredentials: true,
      });
      fetchBlogs();
    } catch (error) {
      console.error("Delete blog error:", error);
    }
  };

  const paginateBlogs = (page) => setBlogPage(page);
  const paginatedBlogs = filteredBlogs.slice(
    (blogPage - 1) * BLOGS_PER_PAGE,
    blogPage * BLOGS_PER_PAGE
  );

  return (
    <div className="p-6 bg-gray-950 min-h-screen">
      {/* Tabs */}
      <div className="flex justify-center mb-6">
        {["dashboard", "users", "blogs"].map((tab) => (
          <button
            key={tab}
            className={`px-6 py-2 rounded-full mx-2 ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-500 text-white"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "dashboard" ? "Admin Dashboard" : tab === "users" ? "User Management" : "Blog Management"}
          </button>
        ))}
      </div>

{/* DASHBOARD */}
{activeTab === "dashboard" && (
  <div className="bg-gray-800 p-6 rounded-xl shadow">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl text-green-600 font-semibold">
        Recent Subscriptions ({selectedDays} days)
      </h2>
      <div className="space-x-2">
        <button
          onClick={() => setSelectedDays(7)}
          className={`px-3 py-1 rounded ${
            selectedDays === 7 ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setSelectedDays(30)}
          className={`px-3 py-1 rounded ${
            selectedDays === 30 ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setSelectedDays(90)}
          className={`px-3 py-1 rounded ${
            selectedDays === 90 ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          Last 90 Days
        </button>
      </div>
    </div>

    {subscriptions.length === 0 ? (
      <p className="text-white">No subscription records found.</p>
    ) : (
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Username</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Date</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id}>
              <td className="p-2 text-center">{sub.user?.username}</td>
              <td className="p-2 text-center">{sub.amount}</td>
              <td className="p-2 text-center">
                {new Date(sub.createdAt).toLocaleDateString()}
              </td>
              <td className="p-2 text-center">
                {sub.status === "ACTIVE" ? "Active" : "Expired"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}


      {/* USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="bg-gray-800 p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-green-600 font-semibold">All Users</h2>
            <input
              type="text"
              placeholder="Search users..."
              value={searchUser}
              onChange={handleUserSearch}
              className="border p-2 rounded w-1/3"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-center text-white">No users found.</p>
          ) : (
            <>
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-500">
                    <th className="p-2">Username</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="p-2 text-center">{user.username}</td>
                      <td className="p-2 text-center">{user.email}</td>
                      <td className="p-2 text-center">{user.role}</td>
                      <td className="p-2 flex justify-center gap-3">
                        <button
                          onClick={() => handleSuspend(user.id)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded"
                        >
                          Suspend
                        </button>
                        <FaTrash
                          className="text-red-600 cursor-pointer"
                          onClick={() => handleDeleteUser(user.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex justify-center items-center mt-4 gap-3">
                <FaArrowLeft
                  className={`cursor-pointer ${userPage === 1 && "opacity-30"}`}
                  onClick={() => userPage > 1 && paginateUsers(userPage - 1)}
                />
                <span>Page {userPage}</span>
                <FaArrowRight
                  className={`cursor-pointer ${
                    userPage * USERS_PER_PAGE >= filteredUsers.length && "opacity-30"
                  }`}
                  onClick={() =>
                    userPage * USERS_PER_PAGE < filteredUsers.length &&
                    paginateUsers(userPage + 1)
                  }
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* BLOG MANAGEMENT */}
      {activeTab === "blogs" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Blogs</h2>
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchBlog}
              onChange={handleBlogSearch}
              className="border p-2 rounded w-1/3"
            />
          </div>

          {filteredBlogs.length === 0 ? (
            <p className="text-center text-gray-500">No blogs found.</p>
          ) : (
            <>
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Title</th>
                    <th className="p-2">Author</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Likes</th>
                    <th className="p-2">Comments</th>
                    <th className="p-2">Created</th>
                    <th className="p-2">Updated</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBlogs.map((blog) => (
                    <tr key={blog.id}>
                      <td className="p-2 text-center">{blog.title}</td>
                      <td className="p-2 text-center">{blog.author?.username}</td>
                      <td className="p-2 text-center">{blog.Category?.name}</td>
                      <td className="p-2 text-center">{blog.likes?.length || 0}</td>
                      <td className="p-2 text-center">{blog.comments?.length || 0}</td>
                      <td className="p-2 text-center">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-center">
                        {new Date(blog.updatedAt).toLocaleDateString() ===
                        new Date(blog.createdAt).toLocaleDateString()
                          ? "-"
                          : new Date(blog.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-center">
                        {blog.trending ? "Trending" : blog.latest ? "Latest" : "-"}
                      </td>
                      <td className="p-2 text-center">
                        <FaTrash
                          className="text-red-600 cursor-pointer"
                          onClick={() => handleDeleteBlog(blog.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex justify-center items-center mt-4 gap-3">
                <FaArrowLeft
                  className={`cursor-pointer ${blogPage === 1 && "opacity-30"}`}
                  onClick={() => blogPage > 1 && paginateBlogs(blogPage - 1)}
                />
                <span>Page {blogPage}</span>
                <FaArrowRight
                  className={`cursor-pointer ${
                    blogPage * BLOGS_PER_PAGE >= filteredBlogs.length && "opacity-30"
                  }`}
                  onClick={() =>
                    blogPage * BLOGS_PER_PAGE < filteredBlogs.length &&
                    paginateBlogs(blogPage + 1)
                  }
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
