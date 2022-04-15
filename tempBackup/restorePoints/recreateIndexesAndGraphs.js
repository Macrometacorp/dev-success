const jsc8 = require("jsc8");

///////////////////////////////////// User configuration
const fabricName = ""; //Name of fabric
const url = "https://gdn.paas.macrometa.io"; //Federation URL
const apiKey = "";// API key
//////////////////////////////////////////

//Connection
const client = new jsc8({
  url,
  apiKey,
  fabricName,
});

// This function will recreate indexes from "indexes" collection
const recreateIndexes = async function () {
  const docs = await client.getDocumentMany("indexes");
  let arr = [];
  for (let i of docs) {
    if (
      i.type !== "primary" &&
      i.type !== "edge" &&
      i.fields[0] !== "expireAt"
    ) {
      arr.push(i);
    }
  }
  try {
    for (let i of arr) {
      if (i.type === "fulltext") {
        let name = i.id.split("/")[0];
        await client.addFullTextIndex(name, i.fields, {
          name: i.name,
          minLength: i.minLength,
        });
      } else if (i.type === "geo") {
        let name = i.id.split("/")[0];
        await client.addGeoIndex(name, i.fields, {
          name: i.name,
          geoJson: i.geoJson,
        });
      } else if (i.type === "ttl") {
        let name = i.id.split("/")[0];
        await client.addTtlIndex(name, i.fields, i.expireAfter, i.name);
      } else if (i.type === "persistent") {
        let name = i.id.split("/")[0];
        await client.addPersistentIndex(name, i.fields, {
          name: i.name,
          unique: i.unique ? true : false,
          sparse: i.sparse ? true : false,
          deduplicate: i.deduplicate ? true : false,
        });
      }
    }
    console.log("The index recreating process is DONE!");
  } catch (e) {
    console.log(e.response.body);
    console.log("Something went wrong with index recreating process");
  }
};
//This function will recreate graphs from "graphs" collection
const recreateGraphs = async function () {
  try {
    const graphs = await client.getDocumentMany("graphs");
    for (let i of graphs) {
      const newGraph = client.graph(i.name);
      const info = await newGraph.create({
        edgeDefinitions: i.edgeDefinitions,
      });

      console.log(`"${i.name}" graph is created!`);
    }
  } catch (e) {
    console.log("Graph cant be created", e);
    console.log(e.response.body);
  }
};

const runInSeries = async () => {
  const list = [recreateGraphs, recreateIndexes];
  for (const fn of list) {
    await fn(); // call function to get returned Promise
  }
};
runInSeries();
