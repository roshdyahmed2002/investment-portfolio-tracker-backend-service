const createHttpError = require("http-errors");
const { TransactionService } = require("../services");
const TransactionAction = require("../constansts/transactionActions");
const { responseBuilder } = require("../util/responseBuilder");
const { limitValidator } = require("../util/limitValidator");

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

  validateTransactionBaseInput(
    { instrumentId, action, transactionDate, transactionId },
    isTransactionIdRequired = false,
  ) {
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
    if (isTransactionIdRequired && !transactionId) {
      throw createHttpError.BadRequest("Transaction ID is required");
    }
  }

  async getTransactionsByUserId(req, res, next) {
    const userId = req.userId;
    const { action, instrumentId, date, fromDate, toDate } = req.query;
    const page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    limit = limitValidator(limit);
    const { transactions, metaData } =
      await this.transactionService.getTransactionsByUserId({
        userId,
        action,
        instrumentId,
        date,
        fromDate,
        toDate,
        page,
        limit,
      });
    return res.status(200).json(responseBuilder(transactions, metaData));
  }

  async updateTransaction(req, res, next) {
    if (!req.body) {
      throw createHttpError.BadRequest("Request body is required");
    }
    const transactionId = req.params.id;
    const {
      instrumentId,
      action,
      transactionDate,
      units,
      price,
      dividendCash,
      dividendSharesRatio,
    } = req.body;
    this.validateTransactionBaseInput(
      {
        instrumentId,
        action,
        transactionDate,
        transactionId,
      },
      true,
    );
    const userId = req.userId;
    const result = await this.transactionService.updateTransaction({
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
    return res.status(200).json(responseBuilder(result));
  }

  async deleteTransaction(req, res, next) {
    const transactionId = req.params.id;
    if (!transactionId) {
      throw new createHttpError.BadRequest("Transaction ID is required");
    }
    const userId = req.userId;
    const result = await this.transactionService.deleteTransaction({
      userId,
      transactionId,
    });
    return res.status(200).json(responseBuilder(result));
  }
}
module.exports = TransactionController;
