const createHttpError = require("http-errors");
const { CategoryService } = require("../services");
const { responseDataBuilder } = require("../util/responseBuilder");

class CategoryController {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
    this.categoryService = new CategoryService(supaBaseClient);
  }

  async createCategory(req, res, next) {
    const userId = req.userId;
    const { categoryName } = req.body;

    if (!categoryName) {
      throw createHttpError.BadRequest("Category is required");
    }

    const result = await this.categoryService.createCategory(
      userId,
      categoryName,
    );

    return res.status(200).json({ message: result });
  }

  async getCategoriesByUserId(req, res, next) {
    const userId = req.userId;

    const { categories } =
      await this.categoryService.getCategoriesByUserId(userId);

    return res.status(200).json(responseDataBuilder(categories));
  }

  async getCategoryById(req, res, next) {
    const userId = req.userId;
    const id = req.params.id;

    const { category } = await this.categoryService.getCategoryById({
      userId,
      id,
    });

    return res.status(200).json(responseDataBuilder(category));
  }

  async updateCategory(req, res, next) {
    const userId = req.userId;
    const id = req.params.id;
    const { categoryName } = req.body;

    if (!categoryName) {
      throw createHttpError.BadRequest("Category is required");
    }

    const result = await this.categoryService.updateCategory({
      userId,
      id,
      categoryName,
    });

    return res.status(200).json(responseDataBuilder(result));
  }

  async deleteCategory(req, res, next) {
    const userId = req.userId;
    const id = req.params.id;

    const result = await this.categoryService.deleteCategory({
      userId,
      id,
    });

    return res.status(200).json(responseDataBuilder(result));
  }
}

module.exports = CategoryController;
