const jsc8 = require("jsc8");
///////////////////////////////////// User configuration
const backupFabricName = ""; //Fabric name of backup GF
const fabricName = "_system"; //Fabric name of production fabric
const url = "https://gdn.paas.macrometa.io"; //federation URL
const apiKey1 = ""; //API key of source fabric
const apiKey2 =""; //API key of destination fabric
//////////////////////////////////////////

//Connection to source and destination tenant
const client1 = new jsc8({
  url,
  apiKey: apiKey1,
  fabricName: backupFabricName,
});
const client2 = new jsc8({
  url,
  apiKey: apiKey2,
  fabricName,
});

//Timeout function, for slowing down cloning process
const sleep = (milliseconds) => {
  console.log(`${milliseconds / 1000} seconds timeout`);
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

//Restoring indexes 
const cloneIndexes = async function () {
  try {
    const indexes = await client1.getDocumentMany("indexes", 1000);
    let arr = [];
    for (let i of indexes) {
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
          await client2.addFullTextIndex(name, i.fields, {
            name: i.name,
            minLength: i.minLength,
          });
        } else if (i.type === "geo") {
          let name = i.id.split("/")[0];
          await client2.addGeoIndex(name, i.fields, {
            name: i.name,
            geoJson: i.geoJson,
          });
        } else if (i.type === "ttl") {
          let name = i.id.split("/")[0];
          await client2.addTtlIndex(name, i.fields, i.expireAfter, i.name);
        } else if (i.type === "persistent") {
          let name = i.id.split("/")[0];
          await client2.addPersistentIndex(name, i.fields, {
            name: i.name,
            unique: i.unique ? true : false,
            sparse: i.sparse ? true : false,
            deduplicate: i.deduplicate ? true : false,
          });
        }
      }
      console.log("The indexes recreating process is DONE!");
    } catch (e) {
      console.log(e.response.body);
      console.log("Something went wrong with indexes recreating process");
    }
  } catch (e) {
    console.log("Something went wrong with indexes cloning process");
    console.log(e);
  }
};
//Restoring collections
const cloneCollections = async function () {
  const collections = await client1.listCollections(true);
  try {
    for (let i of collections) {
      if (i.collectionModel === "DOC") {
        if (i.type === 2) {
          await client2.createCollection(i.name, {
            stream: i.hasStream ? true : false,
          });
        } else {
          await client2.createCollection(
            i.name,
            { stream: i.hasStream ? true : false },
            { isEdge: true }
          );
        }
      } else if (i.collectionModel === "KV") {
        const result = await client2.createKVCollection(i.name, {
          expiration: true,
          stream: i.hasStream ? true : false,
        });
      } else if (i.collectionModel === "DYNAMO") {
        console.log(
          `"${i.name}" DYNAMO collection is not cloned, there is no driver support for this type of collection`
        );
      } else {
        console.log("I dont know this type");
      }
    }
    console.log("Collections restoring process is DONE");
  } catch (e) {
    console.log(
      "Something went wrong with collections restoring request"
    );
    console.log(e.response.body);
  }
};

//Cloning data
const cloneData = async function () {
  const batchSize = 1000;
  let collections = await client1.listCollections(true);
  collections = collections.filter((item) => item.collectionModel !== "DYNAMO");

  try {
    for (let i of collections) {
      let name = i.name;
      const { count } = await client1.collection(name).count();
      const num = Math.ceil(count / batchSize);
      for (i = 0; i < num; i++) {
        //We change the offset for each iteration
        let offset = i * batchSize;
        await sleep(100);
        let cursor = await client1.exportDataByCollectionName(name, {
          offset: offset,
          limit: batchSize,
        });
        console.log(
          `Data pulled from source fabric, collection ${name}, ${
            i + 1
          } of ${num}, server code: ${cursor.code}`
        );
        await sleep(200);
        let insert = await client2.importDocuments(
          name,
          cursor.result,
          true,
          "_key",
          true
        );
        console.log(
          `Data inserted in destination fabric, collection ${name}, ${
            i + 1
          } of ${num} >>> created: ${insert.result.created}`
        );
      }
    }
  } catch (e) {
    console.log(e);
    console.log("There is error in data restoring process");
  }
  console.log("Restoring process is finished");
};

//Restoring graphs
const cloneGraph = async function () {
  try {
    const graphs = await client1.getDocumentMany("graphs");
    for (let i of graphs) {
      const newGraph = client2.graph(i.name);
      const info = await newGraph.create({
        edgeDefinitions: i.edgeDefinitions,
      });

      console.log(`"${i.name}" graph is created!`);
    }
  } catch (e) {
    console.log(e);
    console.log("Graphs cant be restored");

  }
};

//This function will clone restqls
const cloneRestqls = async function () {
  try {
    const listOfCreatedRestql = await client1.getRestqls();
    for (let i of listOfCreatedRestql.result) {
      await client2.createRestql(i.name, i.value);
    }
    console.log("All RESTqls are restored");
  } catch (e) {
    console.log(e);
    console.log("Something went wrong, RESTqls cant be restored");
  }
};

const runInSeries = async () => {
  const list = [
    cloneCollections,
    cloneIndexes,
    cloneRestqls,
    cloneGraph,
    cloneData,
  ];
  let start = Date.now();
  for (const fn of list) {
    await fn(); // call function to get returned Promise
  }
  console.log(`${(Date.now() - start) / 1000 / 60 / 60} hours`);
};
runInSeries();
