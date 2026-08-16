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

  async getTransactionsByUserId({
    userId,
    from,
    to,
    action,
    instrumentId,
    date,
    fromDate,
    toDate,
  }) {
    let query = this.supaBaseClient
      .from("transactions")
      .select(
        `
        id,
        txn_date,
        action,
        units,
        price,
        dividend_cash,
        dividend_shares_ratio,
        realized_pl,
        instrument_id,
        instruments (
            id,
            name,
            category_id,
            categories (
                id,
                name
            )
        )
    `,
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order("txn_date", { ascending: false })
      .range(from, to);

    if (action) {
      query = query.eq("action", action);
    }
    if (instrumentId) {
      query = query.eq("instrument_id", instrumentId);
    }
    if (date) {
      query = query.eq("txn_date", date);
    }
    if (fromDate) {
      query = query.gte("txn_date", fromDate);
    }
    if (toDate) {
      query = query.lte("txn_date", toDate);
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

  async updateTransaction({
    userId,
    transactionId,
    instrumentId,
    action,
    transactionDate,
    units,
    price,
    dividendCash,
    dividendSharesRatio,
  }) {
    const { data, error } = await this.supaBaseClient.rpc(
      "update_transaction",
      {
        p_user_id: userId,
        p_transaction_id: transactionId,
        p_instrument_id: instrumentId,
        p_action: action,
        p_units: units,
        p_price: price,
        p_dividend_cash: dividendCash,
        p_dividend_shares_ratio: dividendSharesRatio,
        p_txn_date: transactionDate,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }
}

module.exports = TransactionRepository;
