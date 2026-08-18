const createHttpError = require("http-errors");
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

  async getInstrumentsByUserId({
    userId,
    categoryId,
    instrumentName,
    page = 1,
    limit = 10,
  }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count } =
      await this.instrumentRepository.getInstrumentsByUserId({
        userId,
        categoryId,
        instrumentName,
        from,
        to,
      });

    const instruments = this.mapInstruments(data);
    const totalPages = count === null ? null : Math.ceil(count / limit);

    return {
      instruments: instruments,
      metaData: {
        page,
        limit,
        totalItems: count,
        totalPages,
      },
    };
  }

  mapInstruments(instruments) {
    console.log("I0: ", instruments);
    return instruments.map((instrument) => {
      return this.mapInstrument(instrument);
    });
  }

  mapInstrument(instrument) {
    console.log("I1: ", instrument);
    return {
      id: instrument.id,
      name: instrument.name,
      unitsHeld: instrument.units_held,
      realizedPl: instrument.realized_pl,
      avgBuyCost: instrument.avg_buy_cost,
      category: {
        id: instrument.categories.id,
        name: instrument.categories.name,
      },
    };
  }

  async getInstrumentsGroupedByCategoryId({
    userId,
    categoryId,
    instrumentName,
    page = 1,
    limit = 10,
  }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count } =
      await this.instrumentRepository.getInstrumentsByUserId({
        userId,
        categoryId,
        instrumentName,
        from,
        to,
      });

    const instruments = data.length === 0 ? [] : this.groupInstruments(data);
    const totalPages = count === null ? null : Math.ceil(count / limit);

    return {
      instruments: instruments,
      metaData: {
        page,
        limit,
        totalItems: count,
        totalPages,
      },
    };
  }

  groupInstruments(instruments) {
    const categoryMap = new Map();
    instruments.forEach((instrument) => {
      if (!categoryMap.has(instrument.categories.id)) {
        categoryMap.set(instrument.categories.id, []);
      }
      categoryMap.get(instrument.categories.id).push(instrument);
    });

    const groupedInstruments = [];
    for (const [key, value] of categoryMap) {
      console.log("V1: ", value);
      const categoryName = value[0]?.categories?.name || null;
      const instruments = value.map((instrument) => {
        return {
          id: instrument.id,
          name: instrument.name,
          unitsHeld: instrument.units_held,
          realizedPl: instrument.realized_pl,
          avgBuyCost: instrument.avg_buy_cost,
        };
      });
      groupedInstruments.push({
        category: { id: key, name: categoryName },
        instruments: instruments,
      });
    }
    return groupedInstruments;
  }

  async getInstrumentById({ userId, id }) {
    const { data } = await this.instrumentRepository.getInstrumentById({
      userId,
      id,
    });
    if (!data) {
      throw new createHttpError.NotFound("Instrument not found");
    }
    const instrument = this.mapInstrument(data);
    return {
      instrument: instrument,
    };
  }

  async updateInstrument({ id, userId, categoryId, instrumentName }) {
    const { data } = await this.instrumentRepository.updateInstrument({
      id,
      userId,
      categoryId,
      instrumentName,
    });
    return {
      message: "Instrument Updated Successfully",
    };
  }

  async deleteInstrument({ id, userId }) {
    const { data } = await this.instrumentRepository.deleteInstrument({
      id,
      userId,
    });
    return {
      message: "Instrument Deleted Successfully",
    };
  }
}

module.exports = InstrumentService;
