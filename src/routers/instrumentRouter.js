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

    this.router.get(
      "/",
      authenticate(this.supabaseClient),
      wrapper(
        this.instrumentController.getInstrumentsByUserId.bind(
          this.instrumentController,
        ),
      ),
    );

    this.router.get(
      "/grouped",
      authenticate(this.supabaseClient),
      wrapper(
        this.instrumentController.getInstrumentsGroupedByCategory.bind(
          this.instrumentController,
        ),
      ),
    );

    this.router.get(
      "/:id",
      authenticate(this.supabaseClient),
      wrapper(
        this.instrumentController.getInstrumentById.bind(
          this.instrumentController,
        ),
      ),
    );

    this.router.put(
      "/:id",
      authenticate(this.supabaseClient),
      wrapper(
        this.instrumentController.updateInstrument.bind(
          this.instrumentController,
        ),
      ),
    );

    this.router.delete(
      "/:id",
      authenticate(this.supabaseClient),
      wrapper(
        this.instrumentController.deleteInstrument.bind(
          this.instrumentController,
        ),
      ),
    );

    this.router.patch(
      "/current-prices",
      authenticate(this.supabaseClient),
      wrapper(
        this.instrumentController.updateCurrentPrices.bind(
          this.instrumentController,
        ),
      ),
    );
  }
}
module.exports = InstrumentRouter;
