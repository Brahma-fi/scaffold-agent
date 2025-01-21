import express, { Express } from "express";
import cors from "cors";
import { router } from "./routes";

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.options("*", cors());

app.use("/v1", router);

app.listen(port, () => {
  console.log(`[server]: running on: ${port}`);
});
