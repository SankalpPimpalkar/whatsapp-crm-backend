import mongodbConnection from "./db/mongoose.js";
import cors from "cors";
import express from "express";
import { mongo_url, PORT } from "./constants.js";
import AuthRouter from "./routes/auth.routes.js";
import ContactRouter from "./routes/contact.routes.js";
import NoteRouter from "./routes/note.routes.js";
import DealRouter from "./routes/deal.routes.js";
import TicketRouter from "./routes/ticket.routes.js";
import TaskRouter from "./routes/task.routes.js";
import EmailRouter from "./routes/email.routes.js";

const app = express();
const port = PORT;

// Database connection
mongodbConnection(mongo_url);

// Middlwares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
	res.send("Hello World");
});

app.use(AuthRouter);
app.use(ContactRouter);
app.use(NoteRouter);
app.use(DealRouter);
app.use(TicketRouter);
app.use(TaskRouter);
app.use(EmailRouter);

// Listening
app.listen(port, () => {
	console.log(`Server is listening on http://localhost:${port}`);
});
