const express = require("express");
const { wrapper } = require("../util/wrapper");
const {
  InstrumentController,
  PortifolioController,
  TestDataController,
} = require("../controllers");
const { authenticate } = require("../util/middleware");
class TestDataRouter {
  constructor(supabaseClient) {
    this.supabaseClient = supabaseClient;
    this.router = express.Router();
    this.testDataController = new TestDataController(supabaseClient);
    this.initRoutes();
  }

  initRoutes() {
    this.router.delete(
      "/",
      authenticate(this.supabaseClient),
      wrapper(
        this.testDataController.clearTestData.bind(this.testDataController),
      ),
    );
  }
}
module.exports = TestDataRouter;
