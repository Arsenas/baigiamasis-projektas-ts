const mongoose = require("mongoose");

module.exports = function (modelName) {
  return async (req, res, next) => {
    try {
      const Model = mongoose.model(modelName);
      const item = await Model.findById(req.params.id);

      if (!item) return res.status(404).json({ error: true, message: "Item not found" });

      const isOwner = item.userID?.toString() === req.user.id;
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
