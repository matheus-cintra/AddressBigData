import express from "express";
import Address from "./model";
import axios from "axios";

const router = express.Router();
const viaCepUri = "https://viacep.com.br/ws/";

router.get("/api/v1/addressBigData/:cep/:force?", async (req, res) => {
  try {
    let { cep, force } = req.params;

    if (!cep)
      return res
        .status(404)
        .json({ sucess: false, data: { message: "CEP not provided" } });

    cep = cep.replace(/[^0-9]/g, "");

    if (cep.length !== 8)
      return res.status(404).json({
        sucess: false,
        data: { message: "CEP must contain 8 digits" },
      });

    const cepExists = await Address.findOne({ cep: cep });

    if (cepExists && !force) return res.status(200).json(cepExists);

    let newCep = await axios.get(`${viaCepUri}${cep}/json/`);

    if (newCep.data.erro) {
      return res.status(404).json({
        sucess: false,
        data: {
          message: "Error in get cep",
        },
      });
    }

    newCep = newCep.data;

    const address = {
      cep: newCep.cep.replace(/[^0-9]/g, ""),
      address: newCep.logradouro,
      additional: newCep.complemento,
      neighborhood: newCep.bairro,
      city: newCep.localidade,
      state: newCep.uf,
      unity: newCep.unidade,
      ibge: newCep.ibge,
      gia: newCep.gia,
    };

    const result = cepExists
      ? await Address.create({ ...address })
      : await Address.updateOne(
          { _id: cepExists._id },
          { $set: { ...address } }
        );

    if (!result)
      return res
        .status(500)
        .json({ sucess: false, data: { message: "Error in bigData" } });

    return res.status(200).json(address);
  } catch (error) {
    console.warn("Erro bigdata > ", error);
  }
});

module.exports = (app) => app.use(router);
