const jsc8 = require("jsc8");
let url = "https://gdn.paas.macrometa.io";
const apiKey =""
const fabricName = "_system";
const collectionName = "happyKV";// collection name

const sleep = (milliseconds) => {
  console.log(`${milliseconds / 1000} seconds timeout`);
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
//data that we are inserting into the database
const keyValuePairs = {
  _key: Math.floor(Math.random() * 100000000000).toString(),
  value: "test",
  expireAt: -1,
};
//connect to GDN
function connection(url) {
  const client = new jsc8({
    url,
    apiKey,
    fabricName,
  });
  return client;
}
let client = connection(url);
let data = [];

//Inserting KV pairs in the KV collection and waiting for global ACK
const insertKV = async function () {
  const regions = await client.getAllEdgeLocations();
  const result = await client.insertKVPairs(collectionName, keyValuePairs);
  console.log(result);
  let time = 1000; //milliseconds
  while (data.length < regions.length) {
    if (time > 5000) { 
      break;
    }
    await sleep(time);
    time = 500;
    data = (await client.executeRestql("happy", { key: result._key })).result;
    console.log(data);
  }
};
insertKV();
