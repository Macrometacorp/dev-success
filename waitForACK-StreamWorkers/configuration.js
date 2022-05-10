const jsc8 = require("jsc8");
let url = "https://gdn.paas.macrometa.io";
const apiKey =""
const fabricName = "_system";
const kvCollName = "happyKV"; //collection name
const ackCollName = "ack"; //collection for global ack messages

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

// Create global KV collection with collection stream
const createKVColl = async function () {
  const kvCollection = await client.createKVCollection(kvCollName, {
    expiration: true,
    stream: true,
  });
  console.log("KV Collection created");
};
//Create global document collection for ack messages
const createACKColl = async function () {
  const ackCollection = await client.createCollection(ackCollName);
  console.log("ACK collection created");
};

//Create TTL index on ACK collection
const createTTL = async function () {
  const ttlIndex = await client.addTtlIndex(ackCollName, "eventTimestamp", 60);
  console.log("TTL index created");
};

//Create Stream Workers in every region
const createSW = async function () {
  const regions = await client.getAllEdgeLocations();
  for (i of regions) {
    let swName = `happy-${i._key}`;
    let def = `@App:name('${swName}')
    @App:qlVersion('2')
    CREATE SOURCE happyKV WITH (type = 'database', collection = "happyKV", map.type='json') (_key string);
    CREATE TABLE ack (key string,region string,eventTimestamp long,a int);
    INSERT INTO ack
    SELECT _key as key, "${i._key}" as region, currentTimeMillis()/1000 as eventTimestamp, 1 as a
    FROM happyKV;`;
    
    const streamApp = await client.createStreamApp([i._key], def);
    await client.activateStreamApp(swName, true);
  }
  console.log("StreamWorkers are created");
};
const createQW = async function () {
  const queryWorker = await client.createRestql(
    "happy",
    "for i in ack filter i.key == @key return i.region"
  );
  console.log("QueryWorker created");
};
const runInSeries = async () => {
  const list = [
    createKVColl,
    createACKColl,
    createTTL,
    createSW,
    createQW
  ];
  for (const fn of list) {
    try {
      await fn(); // call function to get returned Promise
    } catch (e) {
      console.log(e);
      break;
    }
  }
};
runInSeries();
