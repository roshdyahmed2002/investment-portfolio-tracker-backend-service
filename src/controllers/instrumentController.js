const createHttpError = require("http-errors");
const { InstrumentService } = require("../services");
const {
  responseDataBuilder,
  responseMessageBuilder,
} = require("../util/responseBuilder");
const { limitValidator } = require("../util/limitValidator");

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

  async getInstrumentsByUserId(req, res, next) {
    const userId = req.userId;
    const { categoryId, instrumentName } = req.query;
    const page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    limit = limitValidator(limit);

    if (page < 1) {
      throw new createHttpError.BadRequest("Page must be greater than 0");
    }
    if (limit < 1) {
      throw new createHttpError.BadRequest("Limit must be greater than 0");
    }
    const { instruments, metaData } =
      await this.instrumentService.getInstrumentsByUserId({
        userId,
        categoryId,
        instrumentName,
        page,
        limit,
      });
    return res.status(200).json(responseDataBuilder(instruments, metaData));
  }

  async getInstrumentsGroupedByCategory(req, res, next) {
    const userId = req.userId;
    const { categoryId, instrumentName } = req.query;
    const page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    limit = limitValidator(limit);

    if (page < 1) {
      throw new createHttpError.BadRequest("Page must be greater than 0");
    }
    if (limit < 1) {
      throw new createHttpError.BadRequest("Limit must be greater than 0");
    }
    const { instruments, metaData } =
      await this.instrumentService.getInstrumentsGroupedByCategoryId({
        userId,
        categoryId,
        instrumentName,
        page,
        limit,
      });
    return res.status(200).json(responseDataBuilder(instruments, metaData));
  }

  async getInstrumentById(req, res, next) {
    const userId = req.userId;
    const id = req.params.id;

    const { instrument } = await this.instrumentService.getInstrumentById({
      userId,
      id,
    });
    return res.status(200).json(responseDataBuilder(instrument));
  }

  async updateInstrument(req, res, next) {
    const userId = req.userId;
    const id = req.params.id;
    const { categoryId, instrumentName } = req.body;
    if (!categoryId) {
      throw createHttpError.BadRequest("Category ID is required");
    }
    if (!instrumentName) {
      throw createHttpError.BadRequest("Instrument name is required");
    }
    const result = await this.instrumentService.updateInstrument({
      userId,
      id,
      categoryId,
      instrumentName,
    });
    return res.status(200).json(responseDataBuilder(result));
  }

  async deleteInstrument(req, res, next) {
    const userId = req.userId;
    const id = req.params.id;
    const result = await this.instrumentService.deleteInstrument({
      userId,
      id,
    });
    return res.status(200).json(responseDataBuilder(result));
  }

  async updateCurrentPrices(req, res, next) {
    const userId = req.userId;
    const { currentPrices } = req.body;
    if (!currentPrices) {
      throw new createHttpError.BadRequest("currentPrices is required");
    }
    const result = await this.instrumentService.updateCurrentPrices({
      userId,
      currentPrices,
    });
    return res.status(200).json(responseMessageBuilder(result));
  }
}
module.exports = InstrumentController;
