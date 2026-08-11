const createHttpError = require("http-errors");
const TransactionAction = require("../constansts/transactionActions");
const { TransactionRepository } = require("../repository");

class TransactionService {
  constructor(supaBaseClient) {
    this.transactionRepository = new TransactionRepository(supaBaseClient);
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

    try {
      await this.transactionRepository.createBuyTransaction({
        userId,
        instrumentId,
        units,
        price,
        transactionDate,
      });
    } catch (error) {
      console.error("Create Buy Transaction Error:", error);
      throw createHttpError.InternalServerError(
        "Failed to create buy transaction",
      );
    }
  }

  async createSellTransaction(
    { userId, instrumentId, transactionDate },
    { units, price, dividendCash, dividendSharesRatio },
  ) {
    this.validateTransactionInput(
      { units, price },
      { dividendCash, dividendSharesRatio },
    );

    try {
      await this.transactionRepository.createSellTransaction({
        userId,
        instrumentId,
        units,
        price,
        transactionDate,
      });
    } catch (error) {
      console.error("Create Sell Transaction Error:", error);
      throw createHttpError.InternalServerError(
        "Failed to create sell transaction",
      );
    }
  }

  async createDividendCashTransaction(
    { userId, instrumentId, transactionDate },
    { units, price, dividendCash, dividendSharesRatio },
  ) {
    this.validateTransactionInput(
      { dividendCash },
      { units, price, dividendSharesRatio },
    );

    try {
      await this.transactionRepository.createDividendCashTransaction({
        userId,
        instrumentId,
        dividendCash,
        transactionDate,
      });
    } catch (error) {
      console.error("Create Dividend Cash Transaction Error:", error);
      throw createHttpError.InternalServerError(
        "Failed to create dividend cash transaction",
      );
    }
  }

  async createDividendSharesTransaction(
    { userId, instrumentId, transactionDate },
    { units, price, dividendCash, dividendSharesRatio },
  ) {
    this.validateTransactionInput(
      { dividendSharesRatio },
      { units, price, dividendCash },
    );

    try {
      const unitsHeld = await this.transactionRepository.getInstrumentUnits(
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
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }
      console.error("Create Dividend Shares Transaction Error:", error);

      throw createHttpError.InternalServerError(
        "Failed to create dividend shares transaction",
      );
    }
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
}

module.exports = TransactionService;
