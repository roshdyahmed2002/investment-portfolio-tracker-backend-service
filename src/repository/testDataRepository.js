class TestDataRepository {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async clearTestData(userId) {
    const { error: transactionsError } = await this.supaBaseClient
      .from("transactions")
      .delete()
      .eq("user_id", userId);

    if (transactionsError) {
      throw transactionsError;
    }

    const { error: instrumentsError } = await this.supaBaseClient
      .from("instruments")
      .delete()
      .eq("user_id", userId);

    if (instrumentsError) {
      throw instrumentsError;
    }

    const { error: categoriesError } = await this.supaBaseClient
      .from("categories")
      .delete()
      .eq("user_id", userId);

    if (categoriesError) {
      throw categoriesError;
    }
  }
}

module.exports = TestDataRepository;
