const createHttpError = require("http-errors");
const { InstrumentService } = require("../services");

class InstrumentController {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
    this.instrumentService = new InstrumentService(supaBaseClient);
  }

  async createInstrument(req, res, next) {
    const { category, name } = req.body;
    if (!category) {
      throw createHttpError.BadRequest("Category is required");
    }
    if (!name) {
      throw createHttpError.BadRequest("Name is required");
    }
    const result = await this.instrumentService.createInstrument(
      category,
      name,
    );
    return res.status(200).json({ message: result });
  }
}
module.exports = InstrumentController;
