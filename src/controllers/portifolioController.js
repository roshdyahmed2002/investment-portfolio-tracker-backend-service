const createHttpError = require("http-errors");
const { InstrumentService, PortifolioService } = require("../services");
const {
  responseDataBuilder,
  responseMessageBuilder,
} = require("../util/responseBuilder");
const { limitValidator } = require("../util/limitValidator");

class PortifolioController {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
    this.portifolioService = new PortifolioService(supaBaseClient);
  }

  async getPortifolioSummary(req, res, next) {
    const userId = req.userId;
    const result = await this.portifolioService.getPortifolioSummary(userId);
    return res.status(200).json(responseDataBuilder(result));
  }
}
module.exports = PortifolioController;
