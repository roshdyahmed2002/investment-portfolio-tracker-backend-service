const express = require("express");
const { wrapper } = require("../util/wrapper");
const { CategoryController } = require("../controllers");
const { authenticate } = require("../util/middleware");

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
        this.categoryController.createCategory.bind(this.categoryController),
      ),
    );

    this.router.get(
      "/",
      authenticate(this.supabaseClient),
      wrapper(
        this.categoryController.getCategoriesByUserId.bind(
          this.categoryController,
        ),
      ),
    );

    this.router.get(
      "/:id",
      authenticate(this.supabaseClient),
      wrapper(
        this.categoryController.getCategoryById.bind(this.categoryController),
      ),
    );

    this.router.put(
      "/:id",
      authenticate(this.supabaseClient),
      wrapper(
        this.categoryController.updateCategory.bind(this.categoryController),
      ),
    );

    this.router.delete(
      "/:id",
      authenticate(this.supabaseClient),
      wrapper(
        this.categoryController.deleteCategory.bind(this.categoryController),
      ),
    );
  }
}

module.exports = CategoryRouter;
