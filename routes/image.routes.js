const router = require("express").Router();
const { recipesUploader,
    avatarUploader } = require("../config/cloudinary");

// Route for uploading recipe image
router.post(
  "/api/upload-recipe-image",
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

// Route for uploading avatar image
router.post(
  "/api/upload-avatar",
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

module.exports = router;
