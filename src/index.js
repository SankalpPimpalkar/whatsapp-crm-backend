import mongodbConnection from "./db/mongoose.js";
import cors from "cors";
import express from "express";
import { mongo_url, PORT } from "./constants.js";
import { checkAuth } from "./middlewares/auth.middleware.js";

const app = express();
const port = PORT

// Database connection
mongodbConnection(mongo_url);

// Middlwares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(checkAuth)

// Routes
app.get('/', (req,res) => {
    res.send('Hello World')
})

// Listening
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`)
})