const express = require("express");
const { wrapper } = require("../util/wrapper");
const { InstrumentController } = require("../controllers");
const { authenticate } = require("../util/middleware");
class InstrumentRouter {
  constructor(supabaseClient) {
    this.supabaseClient = supabaseClient;
    this.router = express.Router();
    this.instrumentController = new InstrumentController(supabaseClient);
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      "/",
      authenticate(this.supabaseClient),
      wrapper(
        this.instrumentController.createInstrument.bind(
          this.instrumentController,
        ),
      ),
    );
  }
}
module.exports = InstrumentRouter;
