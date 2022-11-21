const jsc8 = require("jsc8");

///////////////////////////////////// User configuration
const urlGDN = "https://gdn.paas.macrometa.io/"; //federation URL
const urlPlay = "https://play.paas.macrometa.io/"; //federation URL
const apiKeyGDN =""; //API key of source account
const apiKeyPLAY =""; //API key of destination account
const apiKeyPLAY_ID = "testPLAY"; //ID of apiKeyPLAY/ name of API key
const apiKeyGDN_ID = "test"; //ID of apiKeyPLAY/ name of API key

//////////////////////////////////////////
let fabricName = "";

//Connection to source and destination tenant
const clientGDN = new jsc8({
  url: urlGDN,
  apiKey: apiKeyGDN,
  fabricName,
});
const clientPlay = new jsc8({
  url: urlPlay,
  apiKey: apiKeyPLAY,
  fabricName,
});

//Timeout function, for slowing down cloning process
const sleep = (milliseconds) => {
  console.log(`${milliseconds / 1000} seconds timeout.`);
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

//Creating GeoFabric and giving APIkey permission that it can access it
const createGF = async function () {
  if (fabricName != "_system") {
    try {
      const data = await clientGDN.get();
      let locations = "";
      for (let i of data.options.associated_regions) {
        locations = locations + "," + i.replace("gdn", "play");
      }
      locations = locations.replace("sydney", "southeast");
      clientPlay.useFabric("_system");
      const info = await clientPlay.createFabric(fabricName, ["root"], {
        dcList: locations.slice(1),
      });

      await clientPlay.setDatabaseAccessLevel(apiKeyPLAY_ID, fabricName, "rw");
      clientPlay.useFabric(fabricName);
      console.log("GeoFabric is created!");
    } catch (e) {
      console.log(e);
      console.log(
        "Something went wrong in GF creating process, check the error log."
      );
    }
  }
};

//Cloning index configuration on backup GF. It only save index configuration.
const cloneIndexes = async function () {
  try {
    const collections = await clientPlay.listCollections(true);
    let arr = [];
    for (let i of collections) {
      if (i.collectionModel !== "KV") {
        const collectionIndexes = await clientGDN.getCollectionIndexes(i.name);
        for (let i of collectionIndexes) {
          if (i.type !== "primary" && i.type !== "edge") {
            arr.push(i);
          }
        }
      }
    }
    try {
      for (let i of arr) {
        if (i.type === "fulltext") {
          let name = i.id.split("/")[0];
          await clientPlay.addFullTextIndex(name, i.fields, {
            name: i.name,
            minLength: i.minLength,
          });
        } else if (i.type === "geo") {
          let name = i.id.split("/")[0];
          await clientPlay.addGeoIndex(name, i.fields, {
            name: i.name,
            geoJson: i.geoJson,
          });
        } else if (i.type === "ttl") {
          let name = i.id.split("/")[0];
          await clientPlay.addTtlIndex(name, i.fields, i.expireAfter, i.name);
        } else if (i.type === "persistent") {
          let name = i.id.split("/")[0];
          await clientPlay.addPersistentIndex(name, i.fields, {
            name: i.name,
            unique: i.unique ? true : false,
            sparse: i.sparse ? true : false,
            deduplicate: i.deduplicate ? true : false,
          });
        }
      }
      console.log("Indexes creating is done!");
    } catch (e) {
      console.log(e.response.body);
      console.log("Something went wrong with index creating process");
    }
  } catch (e) {
    console.log("Something went wrong with index cloning process");
    console.log(e.response.body);
  }
};
//This function will clone the collections to destination fabric; This function do not clone data
const cloneCollections = async function () {
  const collections = await clientGDN.listCollections(true);
  try {
    for (let i of collections) {
      if (i.collectionModel === "DOC") {
        if (i.type === 2) {
          await clientPlay.createCollection(i.name, {
            stream: i.hasStream ? true : false,
          });
        } else {
          await clientPlay.createCollection(
            i.name,
            { stream: i.hasStream ? true : false },
            { isEdge: true }
          );
        }
      } else if (i.collectionModel === "KV") {
        const result = await clientPlay.createKVCollection(i.name, {
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
    console.log("Collections creating is done");
  } catch (e) {
    console.log(
      "Something went wrong with collection cloning request, please make sure that destination fabric is empty"
    );
    console.log(e.response.body);
  }
};

//Cloning data
const cloneData = async function () {
  const batchSize = 1000;
  let collections = await clientGDN.listCollections(true);
  collections = collections.filter((item) => item.collectionModel !== "DYNAMO");
  console.log("Data cloning process is started");
  console.log("===============================");

  try {
    for (let i of collections) {
      let name = i.name;
      const { count } = await clientGDN.collection(name).count();
      const num = Math.ceil(count / batchSize);
      for (i = 0; i < num; i++) {
        //We change the offset for each iteration
        let offset = i * batchSize;
        await sleep(100);
        let cursor = await clientGDN.exportDataByCollectionName(name, {
          offset: offset,
          limit: batchSize,
        });
        console.log(
          `Data pulled from source fabric, collection ${name}, ${
            i + 1
          } of ${num}, server code: ${cursor.code}`
        );
        await sleep(200);
        let insert = await clientPlay.importDocuments(
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
    console.log("There is error in data cloning process");
  }
  console.log("Data cloning process is finished");
  console.log("===============================");
};

//Cloning graphs configuration on backup GF. It only save graphs configuration into graphs collection.
const cloneGraph = async function () {
  const graphs = await clientGDN.getGraphs();
  try {
    for (let i of graphs) {
      const graph = await clientGDN.getGraph(i.name);
      const hasGraph = await clientPlay.hasGraph(i.name);
      if (hasGraph != true) {
        const newGraph = clientPlay.graph(i.name);
        const info = await newGraph.create({
          edgeDefinitions: graph.edgeDefinitions,
        });

        //console.log(`"${i.name}" graph is created!`);
      } else {
        console.log(`"${i.name}" is already in PLAY GeoFabric`);
      }
    }
    console.log("Graphs creating is done");
  } catch (e) {
    console.log("Graph cant be created", e);
    console.log(e.response.body);
  }
};

//This function will clone restqls
const cloneRestqls = async function () {
  try {
    const listOfCreatedRestql = await clientGDN.getRestqls();
    console.log(listOfCreatedRestql);
    for (let i of listOfCreatedRestql.result) {
      await clientPlay.createRestql(i.name, i.value);
    }
    console.log("RESTqls creating is done");
  } catch (e) {
    console.log(e);
    console.log("Something went wrong, RESTqls cant be cloned");
  }
};

const cloneView = async function () {
  const views = await clientGDN.getListOfViews();
  try {
    for (let i of views.result) {
      const view = await clientGDN.getViewProperties(i.name);
      clientPlay.createView(
        view.result.name,
        view.result.links,
        view.result.primarySort
      );
    }
    console.log("View creating is done");
  } catch (e) {
    console.log("Something went wrong");
  }
};
const cloneStreamWorkers = async function () {
  const streamapps = await clientGDN.retrieveStreamApp();
  try {
    for (let i of streamapps.streamApps) {
      let regions = [];
      for (c of i.regions) {
        regions.push(c.replace("gdn", "play"));
      }
      const streamApp = await clientPlay.createStreamApp(regions, i.definition);
      await clientPlay.activateStreamApp(i.name, i.isActive);
      //console.log(`"${i.name}" SW is created!`);
    }
    console.log("StreamWorkers creating is done ");
  } catch (e) {
    console.log("Stream Worker cant be created", e);
  }
};
const cloneStreams = async function () {
  const streams = await clientGDN.getStreams();
  try {
    for (let i of streams.result) {
      let hasStream = await clientPlay.hasStream(i.topic, i.local);

      if (
        hasStream != true &&
        (i.topic.split(".")[0] === "c8globals" ||
          i.topic.split(".")[0] === "c8locals")
      ) {
        await clientPlay.createStream(i.topic.split(".")[1], i.local);
        // console.log(`"${i.topic}" stream is created!`);
      } else {
        // console.log(`"${i.topic}" is already in PLAY GeoFabric`);
      }
    }
    console.log("Streams creating is done");
  } catch (e) {
    console.log("Stream cant be created");
    console.log(e.response.body);
  }
};

const runInSeries = async () => {
  const list = [
    createGF,
    cloneCollections,
    cloneIndexes,
    cloneRestqls,
    cloneGraph,
    cloneStreams,
    cloneStreamWorkers,
    //cloneView,
    cloneData,
  ];
  let start = Date.now();
  const fabrics = await clientGDN.listFabrics();
  for (i of fabrics) {
    console.log(`Cloning "${i}" fabric started`);

    fabricName = i;
    clientGDN.useFabric("_system");
    await clientGDN.setDatabaseAccessLevel(apiKeyGDN_ID, fabricName, "rw");

    clientGDN.useFabric(i);
    for (const fn of list) {
      await fn(); // call function to get returned Promise
    }
    console.log(`Cloning "${i}" fabric finished`);
  }
  console.log(
    `Job is completed : ${(Date.now() - start) / 1000 / 60 / 60} hours`
  );
};
runInSeries();
