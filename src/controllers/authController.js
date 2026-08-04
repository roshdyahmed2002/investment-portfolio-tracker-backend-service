const createHttpError = require("http-errors");

class AuthController {
    constructor(supaBaseClient) {
        this.supaBaseClient = supaBaseClient;
    }

    async login(req, res, next) {
        const { email, password } = req.body;
        if (!email) {
            throw createHttpError.BadRequest("Email is required");
        }
        if (!password) {
            throw createHttpError.BadRequest("Password is required");
        }
        const { data, error } = await this.supaBaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            throw createHttpError.Unauthorized(error.message);
        }
        return res.status(200).json({ message: "Login successful", data });
    }
}
module.exports = AuthController