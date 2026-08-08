class TransactionRepository {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async createBuyTransaction({
    userId,
    instrumentId,
    units,
    price,
    transactionDate,
  }) {
    const { data, error } = await this.supaBaseClient.rpc(
      "create_buy_transaction",
      {
        p_user_id: userId,
        p_instrument_id: instrumentId,
        p_units: units,
        p_price: price,
        p_txn_date: transactionDate,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }

  async createSellTransaction({
    userId,
    instrumentId,
    units,
    price,
    transactionDate,
  }) {
    const { data, error } = await this.supaBaseClient.rpc(
      "create_sell_transaction",
      {
        p_user_id: userId,
        p_instrument_id: instrumentId,
        p_units: units,
        p_price: price,
        p_txn_date: transactionDate,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }

  async createDividendCashTransaction({
    userId,
    instrumentId,
    dividendCash,
    transactionDate,
  }) {
    const { data, error } = await this.supaBaseClient.rpc(
      "create_dividend_cash_transaction",
      {
        p_user_id: userId,
        p_instrument_id: instrumentId,
        p_dividend_cash: dividendCash,
        p_txn_date: transactionDate,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }

  async createDividendSharesTransaction({
    userId,
    instrumentId,
    dividendSharesRatio,
    transactionDate,
  }) {
    const { data, error } = await this.supaBaseClient.rpc(
      "create_dividend_shares_transaction",
      {
        p_user_id: userId,
        p_instrument_id: instrumentId,
        p_dividend_shares_ratio: dividendSharesRatio,
        p_txn_date: transactionDate,
      },
    );

    if (error) {
      throw error;
    }

    return data;
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
}

module.exports = TransactionRepository;
