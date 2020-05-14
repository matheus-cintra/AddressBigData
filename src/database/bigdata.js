import mongoose from "mongoose";

const URI = process.env.BIGDATA_URI;

(() => {
  mongoose
    .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.warn(`BigData running on ${URI}`))
    .catch((err) => console.warn(`Error connecting to ${URI}`));
})();
