function responseDataBuilder(data, metadata) {
  const response = {
    data: data,
  };
  if (metadata) {
    response.metadata = metadata;
  }
  return response;
}
function responseMessageBuilder(message) {
  const response = {
    message: message,
  };
  return response;
}
module.exports = { responseDataBuilder, responseMessageBuilder };
