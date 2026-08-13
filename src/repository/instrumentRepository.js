class InstrumentRepository {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async getInstrumentUnits(instrumentId, userId) {
    const { data, error } = await this.supaBaseClient
      .from("instruments")
      .select("units_held")
      .eq("id", instrumentId)
      .eq("user_id", userId)
      .single();

    console.log("getInstrumentUnits data:", data);

    if (error) {
      throw error;
    }
    return data.units_held;
  }

  async createInstrument({ userId, categoryId, instrumentName }) {
    const { data, error } = await this.supaBaseClient
      .from("instruments")
      .insert({
        user_id: userId,
        category_id: categoryId,
        name: instrumentName,
      });

    if (error) {
      throw error;
    }

    return data;
  }
}

module.exports = InstrumentRepository;
