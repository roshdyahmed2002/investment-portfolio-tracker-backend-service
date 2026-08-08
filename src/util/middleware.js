const createHttpError = require("http-errors");

function authenticate(supaBaseClient) {
  return async function (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw createHttpError.Unauthorized("Authorization header missing");
    }
    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supaBaseClient.auth.getUser(token);

    if (error) {
      console.error("Get User Auth Error:", error);
      throw createHttpError.Unauthorized("Invalid token");
    }
    req.userId = user?.id;
    if (!req.userId) {
      throw createHttpError.Unauthorized("User ID not found in token");
    }
    return next();
  };
}

module.exports = {
  authenticate,
};
