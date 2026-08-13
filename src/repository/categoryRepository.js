class CategoryRepository {
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
      throw error;
    }

    return data;
  }
}

module.exports = CategoryRepository;
