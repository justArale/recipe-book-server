const router = require("express").Router();
const { recipesUploader, avatarUploader } = require("../config/cloudinary");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User.model");
const Recipe = require("../models/Recipe.model");

// Route for uploading recipe image
router.post(
  "/upload-recipe-image",
  isAuthenticated,
  recipesUploader.single("file"),
  (req, res, next) => {
    console.log("file is: ", req.file);

    if (!req.file) {
      next(new Error("No file uploaded!"));
      return;
    }

    res.json({ fileUrl: req.file.path });
  }
);

router.post(
  "/upload-avatar",
  isAuthenticated,
  avatarUploader.single("file"),
  (req, res, next) => {
    console.log("file is: ", req.file);

    if (!req.file) {
      next(new Error("No file uploaded!"));
      return;
    }

    res.json({ fileUrl: req.file.path });
  }
);

// Route for deleting a recipe image
router.delete(
  "/delete-recipe-image/:publicId/:recipeId",
  isAuthenticated,
  async (req, res, next) => {
    const { publicId, recipeId } = req.params;

    try {
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(`RecipeBook/recipe-image/${publicId}`);

      // Update the user document in the database to remove the reference to the avatar
      const updatedRecipe = await Recipe.findByIdAndUpdate(
        recipeId,
        { image: "" },
        { new: true }
      );

      if (!updatedRecipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      res.status(200).json({ message: "Recipe image deleted", updatedRecipe });
    } catch (error) {
      console.error("Error deleting recipe image:", error);
      res.status(500).json({ error: "Failed to delete the recipe image" });
    }
  }
);

// Route for deleting an avatar image
router.delete(
  "/delete-avatar/:publicId",
  isAuthenticated,
  async (req, res, next) => {
    const { publicId } = req.params;

    try {
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(`RecipeBook/avatar/${publicId}`);

      // Update the user document in the database to remove the reference to the avatar
      const updatedUser = await User.findByIdAndUpdate(
        req.payload._id,
        { avatar: "" },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({ message: "Avatar image deleted", updatedUser });
    } catch (error) {
      console.error("Error deleting avatar image:", error);
      res.status(500).json({ error: "Failed to delete the avatar image" });
    }
  }
);

module.exports = router;
