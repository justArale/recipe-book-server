const { Schema, model } = require("mongoose");

const recipeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
    },
    image: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: [true, "Description is required."],
    },
    ingredients: [
      {
        amount: {
          type: String,
        },
        name: {
          type: String,
          required: [true, "Ingredient name is required."],
        },
      },
    ],
    instruction: [
      {
        type: String,
        required: [true, "Instruction is required."],
      },
    ],
    author: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

const Recipe = model("Recipe", recipeSchema);

module.exports = Recipe;
