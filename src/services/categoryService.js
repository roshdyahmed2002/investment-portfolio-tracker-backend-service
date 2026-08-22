const createHttpError = require("http-errors");
const { CategoryRepository } = require("../repository");

class CategoryService {
  constructor(supaBaseClient) {
    this.categoryRepository = new CategoryRepository(supaBaseClient);
  }

  async createCategory(userId, categoryName) {
    await this.categoryRepository.createCategory({
      userId,
      categoryName,
    });

    return "Category Created Successfully";
  }

  async getCategoriesByUserId(userId) {
    const { data } =
      await this.categoryRepository.getCategoriesByUserId(userId);

    return {
      categories: this.mapCategories(data),
    };
  }

  async getCategoryById({ userId, id }) {
    const { data } = await this.categoryRepository.getCategoryById(id);

    if (!data) {
      throw new createHttpError.NotFound("Category not found");
    }

    // System category
    if (data.user_id === null) {
      return {
        category: data,
      };
    }

    // Category belongs to another user
    if (data.user_id !== userId) {
      throw new createHttpError.NotFound("Category not found");
    }

    return {
      category: this.mapCategory(data),
    };
  }

  mapCategories(categories) {
    return categories.map((category) => {
      return this.mapCategory(category);
    });
  }

  mapCategory(category) {
    return {
      id: category.id,
      name: category.name,
    };
  }

  async updateCategory({ userId, id, categoryName }) {
    const { data } = await this.categoryRepository.getCategoryById(id);

    if (!data) {
      throw new createHttpError.NotFound("Category not found");
    }

    if (data.user_id === null) {
      throw new createHttpError.Forbidden(
        "System categories cannot be modified",
      );
    }

    if (data.user_id !== userId) {
      throw new createHttpError.NotFound("Category not found");
    }

    await this.categoryRepository.updateCategory({
      userId,
      id,
      categoryName,
    });

    return {
      message: "Category Updated Successfully",
    };
  }

  async deleteCategory({ userId, id }) {
    const { data } = await this.categoryRepository.getCategoryById(id);

    if (!data) {
      throw new createHttpError.NotFound("Category not found");
    }

    if (data.user_id === null) {
      throw new createHttpError.Forbidden(
        "System categories cannot be deleted",
      );
    }

    if (data.user_id !== userId) {
      throw new createHttpError.NotFound("Category not found");
    }

    await this.categoryRepository.deleteCategory({
      userId,
      id,
    });

    return {
      message: "Category Deleted Successfully",
    };
  }

  async validateCategoryAccess({ userId, categoryId }) {
    const { data } = await this.categoryRepository.getCategoryById(categoryId);

    if (!data) {
      throw new createHttpError.NotFound("Category not found");
    }

    // System category
    if (data.user_id === null) {
      return;
    }

    // User category
    if (data.user_id !== userId) {
      throw new createHttpError.Forbidden(
        "You do not have access to this category",
      );
    }
  }
}

module.exports = CategoryService;
