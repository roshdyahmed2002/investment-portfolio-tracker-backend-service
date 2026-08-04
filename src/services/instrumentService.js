const createHttpError = require("http-errors");

class InstrumentService {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async createInstrument(userId, categoryId, instrumentName) {
    const { data, error } = await this.supaBaseClient
      .from("instruments")
      .insert({
        user_id: userId, // assuming your auth middleware sets this
        category_id: categoryId,
        name: instrumentName,
      });

    if (error) {
      console.error("Create Instrument Error:", error);
      throw createHttpError.InternalServerError("Failed to create instrument");
    }
    return "Instrument Created Successfully";
  }
}
module.exports = InstrumentService;
