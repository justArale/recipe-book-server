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
  async (req, res, next) => {
    console.log("file is: ", req.file);

    if (!req.file) {
      next(new Error("No file uploaded!"));
      return;
    }

    const newImageUrl = req.file.path;
    const newPublicId = req.file.filename;
    try {
      // // Find the recipe and get the old image publicId
      // const recipe = await Recipe.findById(req.body.recipeId);

      // if (!recipe) {
      //   return res.status(404).json({ error: "Recipe not found" });
      // }

      // const oldPublicId = recipe.image;

      // // Update the recipe with the new image
      // recipe.image = newPublicId;
      // await recipe.save();

      // // Delete the old image from Cloudinary
      // if (oldPublicId) {
      //   await cloudinary.uploader.destroy(oldPublicId);
      // }

      res.json({ fileUrl: newImageUrl });
    } catch (error) {
      console.error("Error updating recipe image:", error);
      res.status(500).json({ error: "Failed to update the recipe image" });
    }
  }
);

// Route for uploading avatar image
router.post(
  "/upload-avatar",
  isAuthenticated,
  avatarUploader.single("file"),
  async (req, res, next) => {
    console.log("file is: ", req.file);

    if (!req.file) {
      next(new Error("No file uploaded!"));
      return;
    }

    const newImageUrl = req.file.path;
    const newPublicId = req.file.filename;
    try {
      // Find the user and get the old avatar publicId
      const user = await User.findById(req.payload._id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const oldPublicId = user.avatar;

      // Update the user with the new avatar
      user.avatar = newPublicId;
      await user.save();

      // Delete the old avatar from Cloudinary
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }

      res.json({ fileUrl: newImageUrl });
    } catch (error) {
      console.error("Error updating avatar image:", error);
      res.status(500).json({ error: "Failed to update the avatar image" });
    }
  }
);

// Route for deleting a recipe image
router.delete(
  "/delete-recipe-image/:publicId/:recipeId",
  isAuthenticated,
  async (req, res, next) => {
    const { publicId, recipeId } = req.params;

    try {
      // Löschen des Bildes aus Cloudinary
      const result = await cloudinary.uploader.destroy(
        `RecipeBook/recipe-image/${publicId}`
      );
      if (result.result !== "ok") {
        return res
          .status(500)
          .json({ error: "Failed to delete the image from Cloudinary" });
      }

      // Aktualisieren des Rezeptdokuments in der Datenbank, um die Referenz auf das Bild zu entfernen
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
      await cloudinary.uploader.destroy(`RecipeBook/avatar/${publicId}`);

      // Update the user document in the database to remove the reference to the avatar
      const updatedUser = await User.findByIdAndUpdate(
        req.payload._id,
        { avatar: "" },
        { new: true }
      );

      res.status(200).json({ message: "Avatar image deleted", updatedUser });
    } catch (error) {
      console.error("Error deleting avatar image:", error);
      res.status(500).json({ error: "Failed to delete the avatar image" });
    }
  }
);

module.exports = router;
