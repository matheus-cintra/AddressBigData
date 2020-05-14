import Cnpj from "./model";
import axios from "axios";
import express from "express";
import moment from "moment";
import { cnpj as _cnpjCheck } from "cpf-cnpj-validator";

const tabletojson = require("tabletojson").Tabletojson;
const Iconv = require("iconv").Iconv;
const cnpjInfoUri = "http://cnpj.info/";

const router = express.Router();

router.get("/api/v1/getCnpjInfo/:cnpj/:force?", async (req, res) => {
  const { cnpj, force } = req.params;

  if (!cnpj) {
    return res
      .status(401)
      .json({ success: false, data: { message: "CNPJ Not Proided" } });
  }

  if (!_cnpjCheck.isValid(cnpj)) {
    return res
      .status(401)
      .json({ success: false, data: { message: "CNPJ MalFormated" } });
  }

  const cnpjInfo = await Cnpj.findOne({ cnpj: cnpj });

  if (cnpjInfo && !force) {
    return res
      .status(200)
      .json({ success: true, data: { message: "Success", company: cnpjInfo } });
  }

  if (!cnpjInfo || (cnpjInfo && force)) {
    const result = await axios
      .get(`${cnpjInfoUri}${cnpj}`, {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7,es;q=0.6",
          "cache-control": "max-age=0",
          "upgrade-insecure-requests": "1",
          cookie: "z=3",
        },
        referrerPolicy: "no-referrer-when-downgrade",
        body: null,
        method: "GET",
        mode: "cors",
        responseType: "arraybuffer",
      })
      .catch((err) => {
        return res.status(500).json(err);
      });

    let iconv = new Iconv("latin1", "utf-8");
    let converted = iconv
      .convert(new Buffer.from(result.data), "iso-8859-1")
      .toString();
    const table = tabletojson.convert(converted);

    let ds = {
      cnpj: cnpj,
      companyName: table[0][1]["1"],
      fantasyName: table[0][2]["1"],
      foundedIn: moment(table[0][3]["1"], "YYYY-MM-DD").format("YYYY/MM/DD"),
      nature: table[0][4]["1"],
      situation: table[0][5]["1"],
      isMei: table[0][10]["1"].trim().toUpperCase() === "SIM" ? true : false,
      lastSearch: Date.now(),
    };

    const resultSave = force
      ? await Cnpj.findOneAndUpdate(
          { _id: cnpjInfo._id },
          { $set: { ...ds } },
          { new: true }
        )
      : await Cnpj.create({ ...ds });
    res.status(200).json({
      success: true,
      data: { message: `${force ? "Updated" : "Created"}`, data: resultSave },
    });
  }
});

module.exports = (app) => app.use(router);
