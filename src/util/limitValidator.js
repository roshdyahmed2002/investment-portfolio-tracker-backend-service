function limitValidator(limit) {
  if (limit > 10) {
    limit = 10
  }
  return limit
}
module.exports = { limitValidator };
