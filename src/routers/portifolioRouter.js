const express = require("express");
const { wrapper } = require("../util/wrapper");
const {
  InstrumentController,
  PortifolioController,
} = require("../controllers");
const { authenticate } = require("../util/middleware");
class PortifolioRouter {
  constructor(supabaseClient) {
    this.supabaseClient = supabaseClient;
    this.router = express.Router();
    this.portifolioController = new PortifolioController(supabaseClient);
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      "/",
      authenticate(this.supabaseClient),
      wrapper(
        this.portifolioController.getPortifolioSummary.bind(
          this.portifolioController,
        ),
      ),
    );
  }
}
module.exports = PortifolioRouter;
