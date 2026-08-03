const createHttpError = require("http-errors");

class InstrumentService {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async createInstrument(category, name) {
    const { data, error } = await this.supaBaseClient
      .from("instruments")
      .insert({
        user_id: req.user.id, // assuming your auth middleware sets this
        category,
        name,
      });

    console.log("createInstrument data:", data);
    if (error) {
      console.log("H2: ");
      console.error("Create Instrument Error:", error);
      throw createHttpError.InternalServerError("Failed to create instrument");
    }
    return "instrument created successfully";
  }
}
module.exports = InstrumentService;
