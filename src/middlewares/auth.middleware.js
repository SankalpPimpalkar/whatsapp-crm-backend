import jwt from "jsonwebtoken";
import { jwt_secret } from "../constants.js";

export function checkAuth(req, res, next) {
	// Authorization: Bearer <token>
	const token = req.headers["Authorization"]?.split(" ")[1];

	if (!token) {
		return res.status(401).json({
			success: false,
			message: "Access denied, token is missing",
		});
	}

    try {
        const decoded_token = jwt.verify(token, jwt_secret)
        req.user = decoded_token;
        next();
        
    } catch (error) {
        return res.status(401).json({
			success: false,
			message: "Invalid token",
            error: error
		});
    }
}
