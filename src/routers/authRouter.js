const express = require("express");
const { AuthController } = require("../controllers");
const { wrapper } = require("../util/wrapper");
class AuthRouter {
  constructor(supabaseClient) {
    this.router = express.Router();
    this.authController = new AuthController(supabaseClient);
    this.initRoutes();
  }

  initRoutes() {
    wrapper(
      this.router.post(
        "/login",
        wrapper(this.authController.login.bind(this.authController)),
      ),
    );
  }
}
module.exports = AuthRouter;
