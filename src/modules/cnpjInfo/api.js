import Cnpj from "./model";
import axios from "axios";
import express from "express";
import moment from "moment";
import { cnpj as _cnpjCheck } from "cpf-cnpj-validator";
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
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

  console.warn("vai rodar os testes...");

  const test = await axios.get("https://randomuser.me/api/");

  console.warn("TESTE DE API > ", test);

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

    if (!result.data) {
      return res
        .status(500)
        .json({ success: false, data: { message: "Error fetchind data" } });
    }

    let iconv = new Iconv("latin1", "utf-8");
    let converted = iconv
      .convert(new Buffer.from(result.data), "iso-8859-1")
      .toString();

    let fields = {
      partners: [],
    };
    const dom = new JSDOM(converted);
    const html = dom.window.document.querySelectorAll("#content > li");

    const table = tabletojson.convert(converted);

    if (!table || table.length <= 0) {
      return res
        .status(200)
        .json({ success: true, data: { message: "Company Not Found" } });
    }

    table[0].forEach((item) => {
      switch (item["0"]) {
        case "Nome da empresa":
          fields.companyName = item["1"];
          break;

        case "Fantasia nome":
          fields.fantasyName = item["1"];
          break;

        case "Inicio atividade data":
          fields.foundedIn = moment(item["1"], "YYYY-MM-DD").format(
            "YYYY/MM/DD"
          );
          break;

        case "Natureza jurídica":
          fields.nature = item["1"];
          break;

        case "Situação cadastral":
          fields.situation = item["1"];
          break;

        case "Motivo situação cadastral":
          fields.situationMotive = item["1"];
          break;

        case "Opção pelo MEI":
          fields.isMei =
            item["1"].trim().toUpperCase() === "SIM" ? true : false;
          break;

        default:
          break;
      }
    });

    table[1] &&
      table[1].forEach((item) => {
        fields.partners.push({
          name: item.Nome,
          role: item["Qualificação"],
        });
      });

    [...html].forEach((item) => {
      if (item.textContent.includes("Telefone")) {
        let _phone = item.textContent.slice(13).replace(/\s/g, "");
        if (_phone.includes("e")) {
          _phone = _phone.split("e");
          _phone = _phone.map((x) => x.replace(/[^0-9]/g, ""));
          fields.phones = _phone;
        } else {
          fields.phones = [_phone.replace(/[^0-9]/g, "")];
        }
      }

      if (item.textContent.includes("Correio")) {
        let _email = item.textContent
          .split("\n")[0]
          .slice(20)
          .replace(/\s/g, "");
        fields.email = _email;
      }
    });

    fields.cnpj = cnpj;
    fields.lastSearch = Date.now();

    const resultSave = force
      ? await Cnpj.findOneAndUpdate(
          { _id: cnpjInfo._id },
          { $set: { ...fields } },
          { new: true }
        )
      : await Cnpj.create({ ...fields });
    res.status(200).json({
      success: true,
      data: { message: `${force ? "Updated" : "Created"}`, data: resultSave },
    });
  }
});

module.exports = (app) => app.use(router);
