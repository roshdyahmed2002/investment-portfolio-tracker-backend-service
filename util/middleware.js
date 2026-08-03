import createHttpError from "http-errors";

export function authenticate(datasource) {
    return async function (req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw createHttpError.Unauthorized('Authorization header missing');
        }
        const token = authHeader.split(" ")[1]
        console.log("Token:", token);
        const getUserResult = await datasource.auth.getUser(token);
        console.log("Get User Result:", getUserResult);

    }



}