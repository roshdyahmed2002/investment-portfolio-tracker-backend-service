const express = require("express");
const { wrapper } = require("../util/wrapper");
const { TransactionController } = require("../controllers");
const { authenticate } = require("../util/middleware");
class TransactionRouter {
  constructor(supabaseClient) {
    this.supabaseClient = supabaseClient;
    this.router = express.Router();
    this.transactionController = new TransactionController(supabaseClient);
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      "/",
      authenticate(this.supabaseClient),
      wrapper(
        this.transactionController.createTransaction.bind(
          this.transactionController,
        ),
      ),
    );

    this.router.get(
      "/",
      authenticate(this.supabaseClient),
      wrapper(
        this.transactionController.getTransactionsByUserId.bind(
          this.transactionController,
        ),
      ),
    );

    this.router.put(
      "/:id",
      authenticate(this.supabaseClient),
      wrapper(
        this.transactionController.updateTransaction.bind(
          this.transactionController,
        ),
      ),
    );

    this.router.delete(
      "/:id",
      authenticate(this.supabaseClient),
      wrapper(
        this.transactionController.deleteTransaction.bind(
          this.transactionController,
        ),
      ),
    );
  }
}
module.exports = TransactionRouter;
