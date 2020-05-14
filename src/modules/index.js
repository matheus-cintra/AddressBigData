"use strict";
module.exports = (app) => {
  require("./viacep/api")(app);
  require('./cnpjInfo/api')(app)
};
