const router = require("express").Router();
const mongoose = require("mongoose");

const User = require("../models/User.model");
const Recipe = require("../models/Recipe.model");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const { isAuthenticated } = require("../middleware/jwt.middleware");

// GET /user - Retrieves all of the user in the database collection
router.get("/user", (req, res) => {
  User.find({})
    .then((user) => {
      console.log("Retrieved user ->", user);
      res.json(user);
    })
    .catch((error) => {
      console.error("Error while retrieving user ->", user);
      res.status(500).json({ error: "Failed to retrieve user" });
    });
});

// GET /user/:id - Retrieves a specific user by id
router.get("/user/:id", (req, res) => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }
  User.findById(userId)
    .populate("recipes")
    .then((user) => {
      console.log("Retrieved user ->", user);
      res.status(200).json(user);
    })
    .catch((error) => {
      console.error("Error while retrieving user ->", error);
      res.status(500).json({ error: "Failed to retrieve user" });
    });
});

// PUT /user/:id - Updates a specific user by id
router.put("/user/:id", isAuthenticated, (req, res) => {
  const userId = req.params.id;

  // Check if the authenticated user is the same as the userId
  if (req.payload._id !== userId) {
    return res
      .status(403)
      .json({ error: "You are not authorized to update the user" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  User.findByIdAndUpdate(userId, req.body, { new: true })
    .then((updatedUser) => {
      console.log("Updated user ->", updatedUser);
      res.status(200).json(updatedUser);
    })
    .catch((error) => {
      console.error("Error while updating the user ->", error);
      res.status(500).json({ error: "Failed to update the user" });
    });
});

// PUT /user/:id/change-password - Updates a specific user password by id
router.put(
  "/user/:userId/change-password",
  isAuthenticated,
  async (req, res) => {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    try {
      // Find the user by ID
      const user = await User.findById(userId);
      console.log("User found:", user);

      // Check if the user exists
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the old password matches the current password
      const passwordCorrect = bcrypt.compareSync(oldPassword, user.password);
      console.log("Password correct:", passwordCorrect);

      if (!passwordCorrect) {
        return res.status(401).json({ message: "Old password is incorrect" });
      }

      // Encrypt the new password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedNewPassword = bcrypt.hashSync(newPassword, salt);
      console.log("New hashed password:", hashedNewPassword);

      // Set the new password
      user.password = hashedNewPassword;

      // Save the user
      await user.save();
      console.log("User saved successfully");

      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error while updating password ->", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  }
);

// DELETE /user/:id - Deletes a specific user by id
router.delete("/user/:id", isAuthenticated, async (req, res) => {
  const userId = req.params.id;

  // Check if the authenticated user is the same as the userId
  if (req.payload._id !== userId) {
    return res
      .status(403)
      .json({ error: "You are not authorized to delete the user" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Specified user id is not valid" });
  }

  try {
    // Collect all recipes of the user
    const recipes = await Recipe.find({ user: userId });

    if (recipes.length > 0) {
      // Delete all recipes of the user
      await Recipe.deleteMany({ user: userId });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    console.log("User and associated recipes deleted!");
    res.status(204).send();
  } catch (error) {
    console.error(
      "Error while deleting the user and associated data ->",
      error
    );
    res.status(500).json({ error: "Deleting user and associated data failed" });
  }
});

module.exports = router;
