const createHttpError = require("http-errors");
const { InstrumentService } = require("../services");

class InstrumentController {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
    this.instrumentService = new InstrumentService(supaBaseClient);
  }

  async createInstrument(req, res, next) {
    const { categoryId, instrumentName } = req.body;
    if (!categoryId) {
      throw createHttpError.BadRequest("Category ID is required");
    }
    if (!instrumentName) {
      throw createHttpError.BadRequest("Instrument name is required");
    }
    const userId = req.userId;
    const result = await this.instrumentService.createInstrument(
      userId,
      categoryId,
      instrumentName,
    );
    return res.status(200).json({ message: result });
  }
}
module.exports = InstrumentController;
