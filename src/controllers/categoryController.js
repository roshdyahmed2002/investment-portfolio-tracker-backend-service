const createHttpError = require("http-errors");
const { CategoryService } = require("../services");

class CategoryController {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
    this.categoryService = new CategoryService(supaBaseClient);
  }

  async createCategory(req, res, next) {
    const { categoryName } = req.body;
    if (!categoryName) {
      throw createHttpError.BadRequest("Category is required");
    }
    const result = await this.categoryService.createCategory(categoryName);
    return res.status(200).json({ message: result });
  }
}
module.exports = CategoryController;