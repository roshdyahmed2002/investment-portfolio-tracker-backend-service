const createHttpError = require("http-errors");

class TransactionController {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async createTransaction(req, res, next) {
    return res.status(200).json({ message: "Transaction created" });
  }
}
module.exports = TransactionController;

