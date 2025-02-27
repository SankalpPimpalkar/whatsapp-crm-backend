import dotenv from "dotenv";
dotenv.config();

export const access_token = process.env.ACCESS_TOKEN
export const client_id = process.env.CLIENT_ID
export const client_secret = process.env.CLIENT_SECRET
export const base_url = process.env.BASE_URL
export const mongo_url = process.env.MONGO_URL
export const jwt_secret = process.env.JWT_SECRET
export const redirect_url = process.env.REDIRECT_URI
export const PORT = process.env.PORT