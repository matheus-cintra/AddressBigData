const mongoose = require("mongoose");

let partner = {
  name: String,
  role: String,
};

const cnpjSchema = new mongoose.Schema(
  {
    cnpj: String,
    foundedIn: Date,
    companyName: String,
    fantasyName: String,
    nature: String,
    email: String,
    phones: [String],
    partners: [partner],
    situation: String,
    situationMotive: String,
    isMei: { type: Boolean, default: false },
    lastSearch: Date,
  },
  { versionKey: false }
);

const Cnpj = mongoose.model("CNPJ_Info", cnpjSchema, "core_cnpj_bigData");

export default Cnpj;
