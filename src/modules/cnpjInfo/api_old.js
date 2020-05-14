import Cnpj from "./model";
import axios from "axios";
const tabletojson = require("tabletojson").Tabletojson;
const Iconv = require("iconv").Iconv;
import moment from "moment";
let cnpjList;
let skip = 0;

async function fetchDataDB(skip) {
  console.warn("skip > ", skip);

  cnpjList = await Cnpj.find({ companyName: { $exists: false } }, null, {
    limit: 1000,
  });
}

async function getCnpjInfo() {
  console.warn("Iniciou");

  await fetchDataDB(skip);
  if (cnpjList.length < 1) {
    console.warn("Lista de CNPJ vazio");
    process.exit();
  }

  skip += 1000;

  // let cnpjList = await Cnpj.find({ companyName: { $exists: false } }, );
  // console.warn("List Antes > ", cnpjList.length);

  // cnpjList = cnpjList.filter((cnpj) => !cnpj.companyName);
  console.warn("List Depois > ", cnpjList.length);

  for (const cnpj of cnpjList) {
    const result = await axios
      .get(
        `http://servicos.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Vstatus.asp?origem=comprovante&cnpj=${cnpj.cnpj}`,
        {
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7,es;q=0.6",
            "cache-control": "max-age=0",
            "upgrade-insecure-requests": "1",
            cookie: "ASPSESSIONIDASRBDSSA=OKMLCEOBMOBEAIAECKNAPAID",
          },
          referrer:
            "http://servicos.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp",
          referrerPolicy: "no-referrer-when-downgrade",
          body: null,
          method: "GET",
          mode: "cors",
          responseType: "arraybuffer",
        }
      )
      .catch((err) => {
        console.warn("Erro > ", err);
      });

    let iconv = new Iconv("latin1", "utf-8");
    let converted = iconv
      .convert(new Buffer.from(result.data), "iso-8859-1")
      .toString();
    const table = tabletojson.convert(converted);

    if (table.length <= 0 || !table || !table[0]) {
      console.warn("CNPJ não encontrado > ", cnpj);
      continue;
    }

    if (
      table[0][4]["2"]
        .slice(5, table[0][4]["2"].length)
        .trim()
        .toUpperCase() !== "ME"
    ) {
      console.warn("Empresa não é MEI");
      continue;
    }

    if (
      table[0][12]["0"]
        .slice(18, table[0][12]["0"].length)
        .trim()
        .toUpperCase() !== "ATIVA"
    ) {
      console.warn("Empresa Inativa");
      continue;
    }

    let ds = {
      foundedIn: table[0][2]["2"].replace(/\s/g, "").slice(14),
      companyName: table[0][3]["0"].slice(16, table[0][3]["0"].length).trim(),
      fantasyName: table[0][4]["0"].slice(44, table[0][4]["0"].length).trim(),
      fiscalType: table[0][4]["2"].slice(5, table[0][4]["2"].length).trim(),
      email: table[0][10]["0"].slice(19, table[0][10]["0"].length).trim(),
      phone: table[0][10]["2"].slice(8, table[0][10]["2"].length).trim(),
      situation: table[0][12]["0"].slice(18, table[0][12]["0"].length).trim(),
      situationDate: table[0][12]["2"]
        .slice(26, table[0][12]["2"].length)
        .trim(),
      situationMotive: table[0][13]["0"]
        .slice(28, table[0][13]["0"].length)
        .trim(),
    };
    ds.foundedIn = moment(ds.foundedIn, "DD/MM/YYYY").format("YYYY/MM/DD");
    ds.situationDate = moment(ds.situationDate, "DD/MM/YYYY").format(
      "YYYY/MM/DD"
    );

    let cnpjUpdated = await Cnpj.findOneAndUpdate(
      { _id: cnpj._id },
      { $set: { ...ds } },
      { new: true }
    );
    console.warn("CNPJ > ", cnpjUpdated);
  }
  await getCnpjInfo(skip);
}

export default getCnpjInfo;
