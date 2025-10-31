// server/controllers/adminController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

// helper: valid days (7,30,100)
function parseDays(q) {
  const n = Number(q);
  if ([7, 30, 100].includes(n)) return n;
  return 30; // default
}

// ============================
// TAB 1 - Admin Dashboard
// ============================

/**
 * GET /api/admin/stats?days=7|30|100
 * Returns totals and new counts in timeframe
 */
async function getStats(req, res) {
  try {
    const days = parseDays(req.query.days);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalUsers, totalBlogs, totalAuthors, newUsers, newBlogs] = await Promise.all([
      prisma.User.count(),
      prisma.Blog.count(),
      prisma.User.count({ where: { role: 'AUTHOR' } }),
      prisma.User.count({ where: { createdAt: { gte: since } } }),
      prisma.Blog.count({ where: { createdAt: { gte: since } } }),
    ]);

    return res.json({
      timeframeDays: days,
      totals: { totalUsers, totalBlogs, totalAuthors },
      newInTimeframe: { newUsers, newBlogs },
    });
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

/**
 * GET /api/admin/subscriptions?days=7|30|100
 * Returns payments joined with users. Includes amount, paymentDate, subscriptionExpiresAt and isActive.
 */
async function getSubscriptions(req, res) {
  try {
    const days = parseDays(req.query.days);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const now = new Date();

    // FIXED: use prisma.Payment (capital P)
    const payments = await prisma.Payment.findMany({
      where: { createdAt: { gte: since } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            subscriptionPlan: true,
            subscriptionExpiresAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = payments.map(p => ({
      id: p.id,
      userId: p.userId,
      username: p.user?.username ?? null,
      email: p.user?.email ?? null,
      plan: p.plan,
      amountPaid: p.amount,
      paymentDate: p.paymentDate,
      txRef: p.txRef ?? null,
      subscriptionExpiresAt: p.user?.subscriptionExpiresAt ?? null,
      isActive: p.user?.subscriptionExpiresAt ? (p.user.subscriptionExpiresAt > now) : false,
      createdAt: p.createdAt,
    }));

    return res.json({ timeframeDays: days, count: formatted.length, subscriptions: formatted });
  } catch (err) {
    console.error('getSubscriptions error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

// ============================
// TAB 2 - User Management
// ============================

/**
 * GET /api/admin/users?search=&page=
 * page default 1, pageSize fixed to 7
 * search checks username, email, role (case-insensitive contains)
 */
async function listUsers(req, res) {
  try {
    const search = (req.query.search || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = 7;
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { role: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.User.count({ where }),
      prisma.User.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isSuspended: true,
          suspendedUntil: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return res.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      users,
    });
  } catch (err) {
    console.error('listUsers error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

/**
 * POST /api/admin/users
 * body: { username, email, password, role }
 */
async function createUser(req, res) {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await prisma.User.create({
      data: {
        username,
        email,
        password: hashed,
        role: role || 'USER',
      },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json({ message: 'User created', user });
  } catch (err) {
    console.error('createUser error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Username or email already exists', detail: err.meta });
    }
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

/**
 * PUT /api/admin/users/:id
 */
async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { username, email, password, role } = req.body;

    const data = {};
    if (username !== undefined) data.username = username;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(password, salt);
    }

    const updated = await prisma.User.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, role: true, updatedAt: true },
    });

    return res.json({ message: 'User updated', user: updated });
  } catch (err) {
    console.error('updateUser error:', err);
    if (err.code === 'P2025') return res.status(404).json({ message: 'User not found' });
    if (err.code === 'P2002') return res.status(409).json({ message: 'Username or email already exists', detail: err.meta });
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

/**
 * DELETE /api/admin/users/:id
 */
async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.User.delete({ where: { id } });
    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error:', err);
    if (err.code === 'P2025') return res.status(404).json({ message: 'User not found' });
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

/**
 * PATCH /api/admin/users/:id/suspend
 */
async function suspendUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { suspend, durationHours } = req.body;

    const user = await prisma.User.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (suspend) {
      const hours = Number(durationHours) || 24;
      const suspendedUntil = new Date();
      suspendedUntil.setHours(suspendedUntil.getHours() + hours);

      const updated = await prisma.User.update({
        where: { id },
        data: { isSuspended: true, suspendedUntil },
        select: { id: true, username: true, isSuspended: true, suspendedUntil: true },
      });

      return res.json({ message: `User suspended for ${hours} hours`, user: updated });
    } else {
      const updated = await prisma.User.update({
        where: { id },
        data: { isSuspended: false, suspendedUntil: null },
        select: { id: true, username: true, isSuspended: true, suspendedUntil: true },
      });
      return res.json({ message: 'User unsuspended', user: updated });
    }
  } catch (err) {
    console.error('suspendUser error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

// ============================
// TAB 3 - Blog Management
// ============================

/**
 * GET /api/admin/blogs?search=&page=1&pageSize=20
 */
async function listBlogs(req, res) {
  try {
    const search = (req.query.search || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.pageSize) || 20);
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { username: { contains: search, mode: 'insensitive' } } },
            { Category: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [total, blogs] = await Promise.all([
      prisma.Blog.count({ where }),
      prisma.Blog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, username: true } },
          Category: { select: { id: true, name: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
    ]);

    const formatted = blogs.map(b => ({
      id: b.id,
      title: b.title,
      authorName: b.author ? b.author.username : null,
      categoryName: b.Category ? b.Category.name : null,
      likesCount: b._count?.likes ?? 0,
      commentsCount: b._count?.comments ?? 0,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt || null,
    }));

    return res.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      blogs: formatted,
    });
  } catch (err) {
    console.error('listBlogs error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

/**
 * PATCH /api/admin/blogs/:id
 */
async function updateBlogStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { latest, trending } = req.body;

    const data = {};
    if (latest !== undefined) data.latest = latest;
    if (trending !== undefined) data.trending = trending;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No status provided' });
    }

    const updated = await prisma.Blog.update({
      where: { id },
      data,
      select: { id: true, title: true, latest: true, trending: true, updatedAt: true },
    });

    return res.json({ message: 'Blog status updated', blog: updated });
  } catch (err) {
    console.error('updateBlogStatus error:', err);
    if (err.code === 'P2025') return res.status(404).json({ message: 'Blog not found' });
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

/**
 * DELETE /api/admin/blogs/:id
 */
async function deleteBlog(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.Blog.delete({ where: { id } });
    return res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error('deleteBlog error:', err);
    if (err.code === 'P2025') return res.status(404).json({ message: 'Blog not found' });
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

// ============================
// exports
// ============================
module.exports = {
  // dashboard
  getStats,
  getSubscriptions,

  // users
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  suspendUser,

  // blogs
  listBlogs,
  updateBlogStatus,
  deleteBlog,
};
