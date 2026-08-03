const express = require("express");
const createHttpError = require("http-errors");
const {
  TransactionRouter,
  AuthRouter,
  InstrumentRouter,
} = require("./src/routers");
class App {
  constructor(supaBaseClient) {
    this.expressApp = express();
    this.supaBaseClient = supaBaseClient;
    this.initRoutes();
  }

  initRoutes() {
    this.expressApp.use(express.json());

    const authRouter = new AuthRouter(this.supaBaseClient);
    this.expressApp.use("/api/auth", authRouter.router);

    const transactionRouter = new TransactionRouter(this.supaBaseClient);
    this.expressApp.use("/api/transactions", transactionRouter.router);

    const instrumentRouter = new InstrumentRouter(this.supaBaseClient);
    this.expressApp.use("/api/instruments", instrumentRouter.router);

    this.expressApp.use((req, res, next) => {
      return res.status(404).json({ status: 404, message: "Not Found" });
    });

    this.expressApp.use(this.errorHandler);
  }

  errorHandler(err, req, res, next) {
    console.error("Error Handler:", err);
    console.log("error message:", err.message);
    if (createHttpError.isHttpError(err)) {
      console.log("isHttpError:", err.status, err.message);
      return res
        .status(err.status)
        .json({ status: err.status, message: err.message });
    }
    return res
      .status(500)
      .json({ status: 500, message: "Internal Server Error" });
  }
}
module.exports = App;
