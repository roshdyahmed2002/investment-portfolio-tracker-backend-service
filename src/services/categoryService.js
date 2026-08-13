const { CategoryRepository } = require("../repository");

class CategoryService {
  constructor(supaBaseClient) {
    this.categoryRepository = new CategoryRepository(supaBaseClient);
  }

  async createCategory(categoryName) {
    await this.categoryRepository.createCategory(categoryName);

    return "Category Created Successfully";
  }
}

module.exports = CategoryService;
