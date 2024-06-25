const router = require("express").Router();

const mongoose = require("mongoose");

const User = require("../models/User.model");
const Recipe = require("../models/Recipe.model");

const { isAuthenticated } = require("../middleware/jwt.middleware");

// POST /user/:userId/recipes - Creates a new recipe for a specific user
router.post("/user/:userId/recipes", isAuthenticated, async (req, res) => {
  const userId = req.params.userId;

  // Check if the authenticated user is the same as the userId
  if (req.payload._id !== userId) {
    return res.status(403).json({
      error: "You are not authorized to create a recipe for this user",
    });
  }

  try {
    const { name, image, description, ingredients, instruction } = req.body;

    // Creates a new recipe
    const newRecipe = await Recipe.create({
      name,
      image,
      description,
      ingredients,
      instruction,
      author: userId,
    });

    console.log("Created new recipe ->", newRecipe);

    // Add the new recipe to the user's recipes array
    await User.findByIdAndUpdate(
      userId,
      { $push: { recipes: newRecipe._id } },
      { new: true }
    );

    res.status(201).json(newRecipe);
  } catch (error) {
    console.error("Error while creating the recipe ->", error);
    res.status(500).json({ error: "Failed to create the recipe" });
  }
});

// GET /recipes - Retrieves all recipes of all user
router.get("/recipes", (req, res) => {
  Recipe.find({})
    .populate("author")
    .then((recipes) => {
      console.log(`Retrieved recipes for user ->`, recipes);
      res.json(recipes);
    })
    .catch((error) => {
      console.error("Error while retrieving recipes ->", error);
      res.status(500).json({ error: "Failed to retrieve recipes" });
    });
});

// GET /user/:userId/recipes - Retrieves all recipes for a specific user
router.get("/user/:userId/recipes", (req, res) => {
  const userId = req.params.userId;

  Recipe.find({ user: userId })
    .then((recipes) => {
      console.log(`Retrieved recipes for user ${userId} ->`, recipes);
      res.json(recipes);
    })
    .catch((error) => {
      console.error("Error while retrieving recipes ->", error);
      res.status(500).json({ error: "Failed to retrieve recipes" });
    });
});

// GET /user/:userId/recipes/:recipeID - Retrieves a specific recipes for a specific user
router.get("/user/:userId/recipes/:recipeId", (req, res) => {
  const { userId, recipeId } = req.params;

  Recipe.findOne({ _id: recipeId, author: userId })
    .populate("author")
    .then((recipe) => {
      if (!recipe) {
        return res.status(404).json({
          message: "Recipe not found or does not belong to this user",
        });
      }

      console.log(`Retrieved recipe ${recipeId} for user ${userId} ->`, recipe);
      res.status(200).json(recipe);
    })
    .catch((error) => {
      console.log("Error while retrieving recipe ->", error);
      res.status(500).json({ error: "Failed to retrieve recipe" });
    });
});

// PUT /user/:userId/recipes/:recipeId - Updates a specific recipe by id
router.put(
  "/user/:userId/recipes/:recipeId",
  isAuthenticated,
  async (req, res) => {
    const { userId, recipeId } = req.params;

    // Check if the authenticated user is the same as the userId
    if (req.payload._id !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this recipe" });
    }

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res
        .status(400)
        .json({ message: "Specified recipe id is not valid" });
    }

    try {
      // Check if the recipe belongs to the user
      const recipe = await Recipe.findOne({
        _id: recipeId,
        author: userId,
      });
      if (!recipe) {
        return res.status(404).json({
          message: "Recipe not found or does not belong to the user",
        });
      }

      // Update the recipe
      const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, req.body, {
        new: true,
      });

      console.log("Updated recipe ->", updatedRecipe);
      res.status(200).json(updatedRecipe);
    } catch (error) {
      console.error("Error while updating the recipe ->", error);
      res.status(500).json({ error: "Failed to update the recipe" });
    }
  }
);

// DELETE /user/:userId/recipes/:recipeId
router.delete(
  "/user/:userId/recipes/:recipeId",
  isAuthenticated,

  async (req, res) => {
    const { userId, recipeId } = req.params;

    // Check if the authenticated user is the same as the userId
    if (req.payload._id !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this recipe" });
    }

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res
        .status(400)
        .json({ message: "Specified recipe id is not valid" });
    }

    try {
      // Check if the recipe exists and belongs to the current user
      const recipe = await Recipe.findOne({
        _id: recipeId,
        author: userId,
      });
      if (!recipe) {
        return res
          .status(404)
          .json({ message: "Recipe not found or unauthorized" });
      }

      // Delete recipe
      await Recipe.findByIdAndDelete(recipeId);

      // Remove the reference from the user document
      await User.findByIdAndUpdate(userId, {
        $pull: { recipes: recipeId },
      });

      console.log("Recipe deleted!");
      res.status(204).send();
    } catch (error) {
      console.error("Error while deleting the recipe ->", error);
      res.status(500).json({ error: "Deleting recipe failed" });
      console.log(error);
    }
  }
);

module.exports = router;
