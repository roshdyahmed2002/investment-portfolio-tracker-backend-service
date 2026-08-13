const { InstrumentRepository } = require("../repository");

class InstrumentService {
  constructor(supaBaseClient) {
    this.instrumentRepository = new InstrumentRepository(supaBaseClient);
  }

  async createInstrument(userId, categoryId, instrumentName) {
    await this.instrumentRepository.createInstrument({
      userId,
      categoryId,
      instrumentName,
    });

    return "Instrument Created Successfully";
  }
}

module.exports = InstrumentService;
