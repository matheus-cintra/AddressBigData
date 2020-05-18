"use strict";

import "dotenv/config";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import "./database/bigdata";

const app = express();

app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(helmet());
app.disable("x-powered-by");

setTimeout(() => require("./modules/index")(app), 3000);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to SiSMEI - SaaS BigData" });
});

app.use((req, res, next) => {
  res.status(404);
  res.json({ message: `Route not found ${req.url}` });
});

app.listen(process.env.PORT || 3001, () => {
  console.warn(`Listening on port: ${process.env.PORT}`);
});
