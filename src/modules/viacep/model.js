import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    cep: String,
    address: String,
    additional: String,
    neighborhood: String,
    state: String,
    unity: String,
    ibge: String,
    gia: String,
    createdAt: { type: Date, default: Date.now() },
    lastSearchAt: { type: Date, default: Date.now() }
  },
  { versionKey: false }
);

const Address = mongoose.model(
  'Address',
  addressSchema,
  'core_address_bigData'
);

export default Address;
