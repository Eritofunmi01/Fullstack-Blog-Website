const express = require('express');
const router = express.Router()
const categoryController = require("../controllers/categoryControllers");


router.post("/api/create-category", categoryController.createCategory);
router.get("/api/categories", categoryController.getCategories);
// categoryRoutes.js
router.put("/api/category/:id", categoryController.updateCategory);

router.get("/api/top", categoryController.getTopCategories);



module.exports = router;