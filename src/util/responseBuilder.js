function responseBuilder(data,metadata) {
  const response = {
    data: data,
  }
  if(metadata){
    response.metadata=metadata
  }
  return response
}
module.exports = { responseBuilder };
