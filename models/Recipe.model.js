const { Schema, model } = require("mongoose");

const recipeSchema = new Schema(
  {
    Name: {
      type: String,
      required: [true, "Name is required."],
    },
    img: {
      type: String,
      required: false,
    },
    Description: {
      type: String,
      required: [true, "Description is required."],
    },
    Ingredients: [
      {
        amount: {
          type: String,
          required: [true, "Ingredient amount is required."],
        },
        name: {
          type: String,
          required: [true, "Ingredient name is required."],
        },
      },
    ],
    Instruction: [
      {
        type: String,
        required: [true, "Instruction is required."],
      },
    ],
    author: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

const Recipe = model("Recipe", recipeSchema);

module.exports = Recipe;

module.exports = Recipe;
