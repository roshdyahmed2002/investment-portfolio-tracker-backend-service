const createHttpError = require("http-errors");

class InstrumentRepository {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async getInstrumentUnits(instrumentId, userId) {
    const { data, error } = await this.supaBaseClient
      .from("instruments")
      .select("units_held")
      .eq("id", instrumentId)
      .eq("user_id", userId)
      .single();

    if (error) {
      throw error;
    }
    return data.units_held;
  }

  async createInstrument({ userId, categoryId, instrumentName }) {
    const { data, error } = await this.supaBaseClient
      .from("instruments")
      .insert({
        user_id: userId,
        category_id: categoryId,
        name: instrumentName,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  async getInstrumentsByUserId({
    userId,
    from = 0,
    to = 10,
    categoryId,
    instrumentName,
  }) {
    let query = this.supaBaseClient
      .from("instruments")
      .select(
        `
        id,
        name,
        units_held,
        realized_pl,
        avg_buy_cost,
        category_id,
        categories (
            id,
            name
        )
    `,
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order("category_id", { ascending: true })
      .range(from, to);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (instrumentName) {
      query = query.ilike("name", `%${instrumentName}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      if (error.code === "PGRST103") {
        return {
          data: [],
          count: null,
        };
      }
      throw error;
    }
    return { data, count };
  }

  async getInstrumentById({ userId, id }) {
    let query = this.supaBaseClient
      .from("instruments")
      .select(
        `
        id,
        name,
        units_held,
        realized_pl,
        avg_buy_cost,
        category_id,
        categories (
            id,
            name
        )
    `,
      )
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    const { data, error } = await query;

    if (error) {
      throw error;
    }
    return { data };
  }

  async updateInstrument({ id, userId, categoryId, instrumentName }) {
    const { data, error } = await this.supaBaseClient
      .from("instruments")
      .update({
        category_id: categoryId,
        name: instrumentName,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select(
        `
    id,
    name,
    units_held,
    realized_pl,
    avg_buy_cost,
    category_id,
    categories (
      id,
      name
    )
  `,
      );
    if (data.length === 0) {
      throw new createHttpError.NotFound("Instrument not found");
    }

    if (error) {
      throw error;
    }
    return { data };
  }

  async deleteInstrument({ userId, id }) {
    const { data, error } = await this.supaBaseClient
      .from("instruments")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");
    if (data.length === 0) {
      throw new createHttpError.NotFound("Instrument not found");
    }
    if (error) {
      throw error;
    }

    return { data };
  }

  async updateCurrentPrices({ userId, currentPrices }) {
    currentPrices = currentPrices.map((price) => ({
      id: price.id,
      current_price: price.currentPrice,
    }));
    const { data, error } = await this.supaBaseClient.rpc(
      "update_current_prices",
      {
        p_user_id: userId,
        p_prices: currentPrices,
      },
    );

    if (error) {
      throw error;
    }

    return { data };
  }

  async getPortifolioSummary(userId) {
    const { data, error } = await this.supaBaseClient.rpc(
      "get_portfolio_summary",
      {
        p_user_id: userId,
      },
    );
    console.log("D1: ", data);
    console.log("E1: ", error);
    return data;
  }
}

module.exports = InstrumentRepository;
