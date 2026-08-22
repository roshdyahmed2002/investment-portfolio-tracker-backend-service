const createHttpError = require("http-errors");

class CategoryRepository {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async createCategory({ userId, categoryName }) {
    const { data, error } = await this.supaBaseClient
      .from("categories")
      .insert({
        user_id: userId,
        name: categoryName,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  async getCategoriesByUserId(userId) {
    const { data, error } = await this.supaBaseClient
      .from("categories")
      .select(
        `
        id,
        name,
        user_id,
        created_at
      `,
      )
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return { data };
  }

  async getCategoryById(id) {
    const { data, error } = await this.supaBaseClient
      .from("categories")
      .select(
        `
        id,
        name,
        user_id,
        created_at
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data };
  }

  async updateCategory({ userId, id, categoryName }) {
    const { data, error } = await this.supaBaseClient
      .from("categories")
      .update({
        name: categoryName,
      })
      .eq("id", id)
      .eq("user_id", userId).select(`
        id,
        name,
        user_id,
        created_at
      `);

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      throw new createHttpError.NotFound("Category not found");
    }

    return { data };
  }

  async deleteCategory({ userId, id }) {
    const { data, error } = await this.supaBaseClient
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      throw new createHttpError.NotFound("Category not found");
    }

    return { data };
  }
}

module.exports = CategoryRepository;
