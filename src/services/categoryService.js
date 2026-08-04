const createHttpError = require("http-errors");

class CategoryService {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async createCategory(categoryName) {
    const { data, error } = await this.supaBaseClient
      .from("categories")
      .insert({
        name: categoryName,
      });

    if (error) {
      console.error("Create Category Error:", error);
      throw createHttpError.InternalServerError("Failed to create category");
    }
    return "category created successfully";
  }
}
module.exports = CategoryService;
