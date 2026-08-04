const express = require("express");
const { wrapper } = require("../util/wrapper");
const { authenticate } = require("../util/middleware");
const { CategoryController } = require("../controllers");
class CategoryRouter {
  constructor(supabaseClient) {
    this.supabaseClient = supabaseClient;
    this.router = express.Router();
    this.categoryController = new CategoryController(supabaseClient);
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      "/",
      authenticate(this.supabaseClient),
      wrapper(
        this.categoryController.createCategory.bind(
          this.categoryController,
        ),
      ),
    );
  }
}
module.exports = CategoryRouter;
