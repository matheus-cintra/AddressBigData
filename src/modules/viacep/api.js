import express from 'express';
import Address from './model';
import axios from 'axios';

const router = express.Router();
const viaCepUri = 'https://viacep.com.br/ws/';

router.get('/api/v1/addressBigData/:cep', async (req, res) => {
  try {
    let { cep } = req.params;

    if (!cep)
      return res
        .status(404)
        .json({ sucess: false, data: { message: 'CEP not provided' } });

    cep = cep.replace(/[^0-9]/g, '');

    if (cep.length !== 8)
      return res.status(404).json({
        sucess: false,
        data: { message: 'CEP must contain 8 digits' }
      });

    const cepExists = await Address.findOne({ cep });

    if (cepExists && cepExists.length > 0)
      return res.status(200).json(cepExists);

    let newCep = await axios.get(`${viaCepUri}${cep}/json/`);
    newCep = newCep.data;

    const address = {
      cep: newCep.cep,
      address: newCep.logradouro,
      additional: newCep.complemento,
      neighborhood: newCep.bairro,
      state: newCep.uf,
      unity: newCep.unidade,
      ibge: newCep.ibge,
      gia: newCep.gia
    };

    const result = await Address.create({ ...address });

    if (!result)
      return res
        .status(500)
        .json({ sucess: false, data: { message: 'Error in bigData' } });

    return res.status(200).json(address);
  } catch (error) {
    console.warn('Erro bigdata > ', error);
  }
});

module.exports = app => app.use(router);