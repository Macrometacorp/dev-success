const jsc8 = require("jsc8");
const fs = require("fs");

///////////////////////////////////// User configuration
const fabricName = ""; // Name of fabric that you want to export
const url = "https://gdn.paas.macrometa.io"; //Federation url
const apiKey = ""; //API key of fabric that you want to export
//////////////////////////////////////////

let dataOBJ = new Object();
let configOBJ = new Object();

//Connect to GDN
const client = new jsc8({
  url,
  apiKey,
  fabricName,
});

//Timeout
const sleep = (milliseconds) => {
  //console.log(`${milliseconds / 1000} seconds timeout`);
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

//Exporting indexes
const cloneIndexes = async function () {
  try {
    const collections = await client.listCollections(true);
    let arr = [];
    for (let i of collections) {
      const collectionIndexes = await client.getCollectionIndexes(i.name);
      for (let i of collectionIndexes) {
        if (
          i.type !== "primary" &&
          i.type !== "edge" &&
          i.fields[0] !== "expireAt"
        ) {
          arr.push(i);
        }
      }
    }
    configOBJ["indexes"] = arr;
    console.log("Indexes exporting process is DONE!");
  } catch (e) {
    console.log(e);
    console.log("Something went wrong with indexes exporting process");
  }
};
//Exporting collections
const cloneCollections = async function () {
  try {
    const collections = await client.listCollections(true);
    configOBJ["collections"] = collections;
    console.log("Collections exporting process is DONE!");
  } catch (e) {
    console.log(e);
    console.log(
      "Something went wrong with collections exporting request."
    );
  }
};
//Pulling data from GDN
const pullData = async function () {
  let data = [];
  const batchSize = 1000;
  let collections = await client.listCollections(true);
  collections = collections.filter((item) => item.collectionModel !== "DYNAMO");
  try {
    console.log("Loading data is started!");
    for (let i of collections) {
      //Determining collection size and number of times that we are going to call query
      let name = i.name;
      const { count } = await client.collection(name).count();
      const num = Math.ceil(count / batchSize);
      for (i = 0; i < num; i++) {
        let offset = i * batchSize;
        await sleep(200);
        let cursor = await client.exportDataByCollectionName(name, {
          offset: offset,
          limit: batchSize,
        });
        data.push.apply(data, cursor.result);
        console.log(`Collection "${name}" is loading, ${i + 1} of ${num}`);
      }
      dataOBJ[name] = data;
      data = [];
    }
    console.log("Data is loaded");
    await sleep(500);
  } catch (e) {
    console.log("Data cant be loaded");
    console.log(e);
  }
};

//Exporting graphs
const cloneGraph = async function () {
  const graphs = await client.getGraphs();
  const graphlist = [];
  try {
    for (let i of graphs) {
      const graph = await client.getGraph(i.name);
      graphlist.push(graph);
    }
    configOBJ["graph"] = graphlist;
    console.log(`All Graphs are exported!`);
  } catch (e) {
    console.log(e);
    console.log("Something went wrong with graphs exporting request");
  }
};

//Exporting RESTqls
const cloneRestqls = async function () {
  try {
    const listOfCreatedRestql = await client.getRestqls();
    configOBJ["restql"] = listOfCreatedRestql.result;
    console.log("All RESTqls are exported");
  } catch (e) {
    console.log(e);
    console.log("Something went wrong with RESTqls exporting request");
  }
};
//Save data and config to JSON files
const saveDataToFile = function (filename, data) {
  var dir = "./data";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  fs.writeFile(
    `./data/${filename}.json`,
    JSON.stringify(data, null, 2),
    (err) => {
      if (err) throw err;
      console.log(`The "${filename}" file has been saved!`);
    }
  );
};
const runInSeries = async () => {
  const list = [
    cloneCollections,
    cloneIndexes,
    cloneRestqls,
    cloneGraph,
    pullData,
  ];
  for (const fn of list) {
    await fn(); // call function to get returned Promise
  }
  saveDataToFile("config", configOBJ);
  saveDataToFile("data", dataOBJ);
};
runInSeries();
