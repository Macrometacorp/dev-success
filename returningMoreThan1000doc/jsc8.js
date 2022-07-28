const jsc8 = require("jsc8");
const apiKey ="<Enter APIkey>";
const fabricName = "_system";
const url = "https://gdn.paas.macrometa.io";

function connection() {
  const client = new jsc8({
    url,
    apiKey,
    fabricName,
  });
  return client;
}

async function handleRequest() {
  const client = connection();
  try {
    const cursor = await client.query(
      "FOR x IN testCollection return x",
      {},
      { batchSize: 1000, stream: true }
    );
    const result = await cursor.all();
    console.log(result);
  } catch (e) {
    console.log(e.message);
  }
}
handleRequest();
