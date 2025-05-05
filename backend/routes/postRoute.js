const express = require("express");
const router = express.Router();
const Post = require("../models/postModel");

// Gauti visus postus
router.get("/", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// Sukurti naują postą
router.post("/", async (req, res) => {
  const { text, username, userImage } = req.body;

  const post = new Post({
    text,
    username,
    userImage,
    likes: [],
    createdAt: new Date(),
  });

  await post.save();
  res.json(post);
});

// Ištrinti postą
router.delete("/:id", async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted", post });
});

// Like / Unlike
router.post("/like/:id", async (req, res) => {
  const { userId } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) return res.json({ error: true, message: "Post not found" });

  const index = post.likes.indexOf(userId);
  if (index > -1) {
    post.likes.splice(index, 1); // unlike
  } else {
    post.likes.push(userId); // like
  }

  await post.save();
  res.json(post);
});

module.exports = router;
