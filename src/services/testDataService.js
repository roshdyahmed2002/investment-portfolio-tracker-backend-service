const createHttpError = require("http-errors");
const {
  InstrumentRepository,
  PortifolioRepository,
  TestDataRepository,
} = require("../repository");

class TestDataService {
  constructor(supaBaseClient) {
    this.testDataRepository = new TestDataRepository(supaBaseClient);
  }

  async clearTestData(userId) {
    await this.testDataRepository.clearTestData(userId);
    return "Data Deleted Successfully";
  }
}

module.exports = TestDataService;
