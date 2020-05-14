const mongoose = require("mongoose");

const cnpjSchema = new mongoose.Schema(
  {
    cnpj: String,
    foundedIn: Date,
    companyName: String,
    fantasyName: String,
    nature: String,
    email: String,
    phone: String,
    situation: String,
    isMei: { type: Boolean, default: false },
    lastSearch: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const Cnpj = mongoose.model("CNPJ_Info", cnpjSchema, "core_cnpj_bigData");

export default Cnpj;
