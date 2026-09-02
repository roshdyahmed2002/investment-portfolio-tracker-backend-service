const createHttpError = require("http-errors");

class PortifolioRepository {
  constructor(supaBaseClient) {
    this.supaBaseClient = supaBaseClient;
  }

  async getPortfolioSummary(userId) {
    const { data, error } = this.supaBaseClient.rpc("get_portfolio_summary", {
      p_user_id: userId,
    });
    if (error) {
      throw error;
    }
    console.log("DATA1: ", data);
    return { data };
  }
}

module.exports = PortifolioRepository;
