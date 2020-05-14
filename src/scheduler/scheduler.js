import cron from "node-cron";
import getCnpjInfo from "../modules/cnpjInfo/api";

module.exports = (() => {
  cron.schedule("* * 22 * *", getCnpjInfo());
})();
