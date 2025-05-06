module.exports = function ({ model, idParam, authorField }) {
  return async (req, res, next) => {
    try {
      const itemId = req.params[idParam];
      const item = await model.findById(itemId);

      if (!item) {
        return res.status(404).json({ error: true, message: "Item not found" });
      }

      const userId = req.user.id;

      const isOwner = Array.isArray(item[authorField])
        ? item[authorField].some((id) => id.toString() === userId)
        : item[authorField]?.toString() === userId;

      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: true, message: "Unauthorized" });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: true, message: "Server error" });
    }
  };
};
