function wrapper(fn) {
  return async function (req, res, next) {
    try {
      await fn(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
}
module.exports = { wrapper };
