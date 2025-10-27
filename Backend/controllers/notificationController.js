// controllers/notificationController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ✅ Get unread notifications for logged-in user
export const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Comes from authenticate middleware

    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId, isRead: false },
      orderBy: { createdAt: "desc" },
    });

    res.json({ notifications });
  } catch (error) {
    console.error("Fetch notification error:", error);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
};

// ✅ Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true },
    });

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Server error marking as read" });
  }
};
