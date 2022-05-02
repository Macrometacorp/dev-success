const jsc8 = require("jsc8");
let url = "https://gdn.paas.macrometa.io";
const apiKey ="";
const fabricName = "_system";
const collectionName = "kvHappy";

//data that we are inserting into the database
const keyValuePairs = [
  {
    _key: Math.floor(Math.random() * 1000000000).toString(),
    value: "string",
    expireAt: -1,
  },
];
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

//Create createStreamReader
const readStream = async function (place) {
  const consumer = await client.createStreamReader(
    collectionName,
    "sub",
    true,
    true
  );
  consumer.on("message", async (msg) => {
    const { payload, messageId } = JSON.parse(msg);
    let m = atob(payload).split(".");
    await console.log((m[0]), place);
    consumer.send(JSON.stringify({ messageId }));
    if (JSON.parse(m[0])._key == keyValuePairs[0]._key) {
      consumer.close();
    }
  });
};
//
const run = async function () {
  const data = await client.getAllEdgeLocations();
  const loc = await client.getLocalEdgeLocation();
  url = `https://${loc.tags.url}`;
  let place = loc.locationInfo.city;
  for (let i of data) {
    url = `https://${i.tags.url}`;
    place = i.locationInfo.city;
    client = connection(url);
    readStream(place);
  }
};

const insertKV = async function () {
  await run();
  const result = await client.insertKVPairs(collectionName, keyValuePairs);
  console.log(result);
};
insertKV();
