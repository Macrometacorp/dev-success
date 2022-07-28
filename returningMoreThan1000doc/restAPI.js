const axios = require("axios");

const apiKey ="<Enter APIkey>";
const cursorEndPoint ="https://api-gdn.paas.macrometa.io/_fabric/_system/_api/cursor/";
let data = {
  batchSize: 1000,
  stream: true,
  query: "FOR i IN testCollection RETURN i",
};
let headers = {
  headers: {
    Authorization: "apikey "+ apiKey
  }
};
let errMsg = "";
let result = [];
const handleRequest = async function () {
  let response = await axios.post(cursorEndPoint, data, headers);
  result = [].concat(result, response.data.result);
  while (response.data.hasMore) {
    try {
      response = await axios.put(
        cursorEndPoint + response.data.id,
        "",
        headers
      );
      result = [].concat(result, response.data.result);
    } catch (e) {
      errMsg = e.response.data;
      break;
    }
  }
  console.log(result);
  console.log(errMsg);
};
handleRequest();
