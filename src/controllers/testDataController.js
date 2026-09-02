const createHttpError = require("http-errors");
const {
  InstrumentService,
  PortifolioService,
  TestDataService,
} = require("../services");
const {
  responseDataBuilder,
  responseMessageBuilder,
} = require("../util/responseBuilder");
const { limitValidator } = require("../util/limitValidator");

class TestDataController {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
    this.testDataService = new TestDataService(supaBaseClient);
  }

  async clearTestData(req, res, next) {
    const userId = req.userId;
    const result = await this.testDataService.clearTestData(userId);
    return res.status(200).json(responseMessageBuilder(result));
  }
}
module.exports = TestDataController;
