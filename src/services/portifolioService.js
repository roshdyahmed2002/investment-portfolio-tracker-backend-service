const createHttpError = require("http-errors");
const { InstrumentRepository, PortifolioRepository } = require("../repository");

class PortifolioService {
  constructor(supaBaseClient) {
    this.portifolioRepository = new PortifolioRepository(supaBaseClient);
  }

  async getPortifolioSummary(userId) {
    const { data } =
      await this.portifolioRepository.getPortfolioSummary(userId);
    return data;
  }
}

module.exports = PortifolioService;
