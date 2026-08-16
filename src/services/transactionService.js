const createHttpError = require("http-errors");
const TransactionAction = require("../constansts/transactionActions");
const {
  TransactionRepository,
  InstrumentRepository,
} = require("../repository");
const { responseBuilder } = require("../util/responseBuilder");

class TransactionService {
  constructor(supaBaseClient) {
    this.transactionRepository = new TransactionRepository(supaBaseClient);
    this.instrumentRepository = new InstrumentRepository(supaBaseClient);
  }

  async createTransaction({
    userId,
    instrumentId,
    action,
    transactionDate,
    units,
    price,
    dividendCash,
    dividendSharesRatio,
  }) {
    const transactionBaseData = {
      userId,
      instrumentId,
      action,
      transactionDate,
    };

    if (action === TransactionAction.BUY) {
      await this.createBuyTransaction(transactionBaseData, {
        units,
        price,
        dividendCash,
        dividendSharesRatio,
      });
    } else if (action === TransactionAction.SELL) {
      await this.createSellTransaction(transactionBaseData, {
        units,
        price,
        dividendCash,
        dividendSharesRatio,
      });
    } else if (action === TransactionAction.DIVIDEND_CASH) {
      await this.createDividendCashTransaction(transactionBaseData, {
        units,
        price,
        dividendCash,
        dividendSharesRatio,
      });
    } else if (action === TransactionAction.DIVIDEND_SHARES) {
      await this.createDividendSharesTransaction(transactionBaseData, {
        units,
        price,
        dividendCash,
        dividendSharesRatio,
      });
    } else {
      throw createHttpError.BadRequest("Invalid transaction action");
    }

    return "Transaction Created Successfully";
  }

  async createBuyTransaction(
    { userId, instrumentId, transactionDate },
    { units, price, dividendCash, dividendSharesRatio },
  ) {
    this.validateTransactionInput(
      { units, price },
      { dividendCash, dividendSharesRatio },
    );

    await this.transactionRepository.createBuyTransaction({
      userId,
      instrumentId,
      units,
      price,
      transactionDate,
    });
  }

  async createSellTransaction(
    { userId, instrumentId, transactionDate },
    { units, price, dividendCash, dividendSharesRatio },
  ) {
    this.validateTransactionInput(
      { units, price },
      { dividendCash, dividendSharesRatio },
    );

    const unitsHeld = await this.instrumentRepository.getInstrumentUnits(
      instrumentId,
      userId,
    );

    if (units > unitsHeld) {
      throw createHttpError.BadRequest(
        `Insufficient units. You currently hold ${unitsHeld} units.`,
      );
    }

    await this.transactionRepository.createSellTransaction({
      userId,
      instrumentId,
      units,
      price,
      transactionDate,
    });
  }

  async createDividendCashTransaction(
    { userId, instrumentId, transactionDate },
    { units, price, dividendCash, dividendSharesRatio },
  ) {
    this.validateTransactionInput(
      { dividendCash },
      { units, price, dividendSharesRatio },
    );

    await this.transactionRepository.createDividendCashTransaction({
      userId,
      instrumentId,
      dividendCash,
      transactionDate,
    });
  }

  async createDividendSharesTransaction(
    { userId, instrumentId, transactionDate },
    { units, price, dividendCash, dividendSharesRatio },
  ) {
    this.validateTransactionInput(
      { dividendSharesRatio },
      { units, price, dividendCash },
    );

    const unitsHeld = await this.instrumentRepository.getInstrumentUnits(
      instrumentId,
      userId,
    );

    if (unitsHeld <= 0) {
      throw createHttpError.BadRequest(
        "Cannot add dividend shares because you do not hold any units of this instrument",
      );
    }

    await this.transactionRepository.createDividendSharesTransaction({
      userId,
      instrumentId,
      dividendSharesRatio,
      transactionDate,
    });
  }

  validateTransactionInput(required, disallowed) {
    for (const [key, value] of Object.entries(required)) {
      if (value === undefined || value === null) {
        throw createHttpError.BadRequest(`${key} is required`);
      }

      if (value <= 0) {
        throw createHttpError.BadRequest(`${key} must be greater than zero`);
      }
    }

    for (const [key, value] of Object.entries(disallowed)) {
      if (value) {
        throw createHttpError.BadRequest(`${key} must be null`);
      }
    }
  }

  async getTransactionsByUserId({
    userId,
    action,
    instrumentId,
    date,
    fromDate,
    toDate,
    page = 1,
    limit = 10,
  }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count } =
      await this.transactionRepository.getTransactionsByUserId({
        userId,
        from,
        to,
        action,
        instrumentId,
        date,
        fromDate,
        toDate,
      });
    const transactions = this.mapTransaction(data);
    const totalPages = count === null ? null : Math.ceil(count / limit);

    return {
      transactions,
      metaData: {
        page,
        limit,
        totalItems: count,
        totalPages,
      },
    };
  }

  mapTransaction(transactions) {
    return transactions.map((transaction) => {
      return {
        id: transaction.id,
        txnDate: transaction.txn_date,
        action: transaction.action,
        units: transaction.units,
        price: transaction.price,
        dividendCash: transaction.dividend_cash,
        dividendSharesRatio: transaction.dividend_shares_ratio,
        realizedPl: transaction.realized_pl,
        realizedPlPercentage: this.calculateRealizedPlPercentage(
          transaction.units,
          transaction.price,
          transaction.dividend_cash,
          transaction.dividend_shares_ratio,
          transaction.realized_pl,
        ),
        instrument: transaction.instruments.name,
        category: transaction.instruments.categories.name,
      };
    });
  }

  calculateRealizedPlPercentage(
    units,
    price,
    dividendCash,
    dividendSharesRatio,
    realizedPl,
  ) {
    if (dividendCash || dividendSharesRatio) {
      return 0;
    } else {
      return (realizedPl / (units * price)) * 100;
    }
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
    if (action === TransactionAction.BUY || action === TransactionAction.SELL) {
      this.validateTransactionInput(
        { units, price },
        { dividendCash, dividendSharesRatio },
      );
    } else if (action === TransactionAction.DIVIDEND_CASH) {
      this.validateTransactionInput(
        { dividendCash },
        { units, price, dividendSharesRatio },
      );
    } else if (action === TransactionAction.DIVIDEND_SHARES) {
      this.validateTransactionInput(
        { dividendSharesRatio },
        { units, price, dividendCash },
      );
    } else {
      throw createHttpError.BadRequest("Invalid transaction action");
    }

    await this.transactionRepository.updateTransaction({
      userId,
      transactionId,
      instrumentId,
      action,
      transactionDate,
      units,
      price,
      dividendCash,
      dividendSharesRatio,
    });

    return { message: "Transaction Updated Successfully" };
  }
}

module.exports = TransactionService;
