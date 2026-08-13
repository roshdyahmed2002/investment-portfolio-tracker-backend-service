const createHttpError = require("http-errors");
const { TransactionService } = require("../services");
const TransactionAction = require("../constansts/transactionActions");

class TransactionController {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
    this.transactionService = new TransactionService(supaBaseClient);
  }

  async createTransaction(req, res, next) {
    if (!req.body) {
      throw createHttpError.BadRequest("Request body is required");
    }
    const {
      instrumentId,
      action,
      transactionDate,
      units,
      price,
      dividendCash,
      dividendSharesRatio,
    } = req.body;
    this.validateTransactionBaseInput({
      instrumentId,
      action,
      transactionDate,
    });
    const userId = req.userId;
    const result = await this.transactionService.createTransaction({
      userId,
      instrumentId,
      action,
      transactionDate,
      units,
      price,
      dividendCash,
      dividendSharesRatio,
    });
    return res.status(200).json({ message: result });
  }

  validateTransactionBaseInput({ instrumentId, action, transactionDate }) {
    if (!instrumentId) {
      throw createHttpError.BadRequest("Instrument ID is required");
    }
    if (!action) {
      throw createHttpError.BadRequest("Transaction action is required");
    }
    const validActions = Object.values(TransactionAction);
    if (!validActions.includes(action)) {
      throw createHttpError.BadRequest("Invalid transaction action");
    }
    if (!transactionDate) {
      throw createHttpError.BadRequest("Transaction date is required");
    }
  }

  async getTransactionsByUserId(req, res, next) {
    const userId = req.userId;
    const { page, limit, action, instrumentId, date, fromDate, toDate } =
      req.query;
    const transactions = await this.transactionService.getTransactionsByUserId({
      userId,
      action,
      instrumentId,
      date,
      fromDate,
      toDate,
      page,
      limit,
    });
    return res.status(200).json({ transactions });
  }
}
module.exports = TransactionController;
