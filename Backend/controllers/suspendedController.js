const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.suspendOrBanUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { reason = "Policy Violation", duration = 1, manualBan = false } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // If user is already banned
    if (user.isBanned) {
      return res.status(400).json({ message: "User is already banned." });
    }

    let updatedData = {};
    let message = "";

    if (manualBan || user.strikeCount >= 5) {
      // Manual ban or auto-ban at 5 strikes
      updatedData = {
        isBanned: true,
        isSuspended: false,
        suspendedUntil: null,
      };
      message = "User has been banned.";
    } else {
      // Calculate new strike count
      const newStrikeCount = user.strikeCount + 1;

      // Suspend user
      const suspensionTime = new Date(Date.now() + duration * 60 * 60 * 1000);

      updatedData = {
        strikeCount: newStrikeCount,
        isSuspended: true,
        suspendedUntil: suspensionTime,
      };

      message = `User suspended for ${duration} hour(s).`;

      // Auto-ban if strikes reach 5
      if (newStrikeCount >= 5) {
        updatedData.isBanned = true;
        updatedData.isSuspended = false;
        updatedData.suspendedUntil = null;
        message = "User has been automatically banned after reaching 5 strikes.";
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
      select: {
        id: true,
        username: true,
        strikeCount: true,
        isSuspended: true,
        isBanned: true,
        suspendedUntil: true,
      },
    });

    res.status(200).json({ message, user: updatedUser });
  } catch (error) {
    console.error("Suspend/Ban User Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
