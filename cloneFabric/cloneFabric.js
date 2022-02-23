const jsc8 = require("jsc8");

const copyFabric = "test";
const pasteFabric = "test2";
url = "https://gdn.paas.macrometa.io";
apiKey = "";

const client1 = new jsc8({
  url,
  apiKey,
  fabricName: copyFabric,
});
const client2 = new jsc8({
  url,
  apiKey,
  fabricName: pasteFabric,
});
// As the script is designed for cloning fabric one in another, cloning destination fabric needs to be empty.
//This function can be used for cleaning destination fabric
const deleteAllCollections = async function() {
  try {
    const collections = await client2.listCollections(true);
    for (let i of collections) {
      await client2.deleteCollection(i.name);
    }
    console.log(`Fabric ${pasteFabric} is PURGED`);
  } catch (e) {
    console.log("PURGE is not working:<");
    console.log(e.response.body);
  }
};

const cloneIndexes = async function() {
  const collections = await client2.listCollections(true);
  let arr = [];
  for (let i of collections) {
    const collectionIndexes = await client1.getCollectionIndexes(i.name);
    for (let i of collectionIndexes) {
      if (i.type !== "primary" && i.type !== "edge" && i.fields[0] !== "expireAt") {
        arr.push(i);
      }
    }
  }
  //console.log(arr);
  try {
    for (let i of arr) {
      if (i.type === "fulltext") {
        let name = i.id.split("/")[0];
        await client2.addFullTextIndex(name, i.fields);
      } else if (i.type === "geo") {
        let name = i.id.split("/")[0];
        await client2.addGeoIndex(name, i.fields);
      } else if (i.type === "ttl") {
        let name = i.id.split("/")[0];
        await client2.addTtlIndex(name, i.fields, i.expireAfter);
      } else if (i.type === "persistent") {
        let name = i.id.split("/")[0];
        await client2.addPersistentIndex(name, i.fields, {
          unique: i.unique ? true : false,
          sparse: i.sparse ? true : false,
          deduplicate: i.deduplicate ? true : false,
        });
      }
    }
    console.log("Index cloning process is DONE!");
  } catch (e) {
    console.log("Something went wrong with index cloning process");
    console.log(e.response.body);
  }
};

const cloneCollections = async function() {
  const collections = await client1.listCollections(true);
  //console.log(collections);
  try {
    for (let i of collections) {
      if (i.collectionModel === "DOC") {
        if (i.type === 2) {
          await client2.createCollection(i.name, { stream: i.hasStream ? true : false });
        } else {
          await client2.createCollection(i.name, { stream: i.hasStream ? true : false }, { isEdge: true });
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
    console.log("Collection cloning process id DONE");
  } catch (e) {
    console.log(
      "Somthing went wrong with collection cloning requst, please make sure that destination fabric is empty"
    );
    console.log(e.response.body);
  }
};

const readData = async function() {
  let data = [];
  const batchSize = 1000;
  let obj = new Object();
  let collections = await client1.listCollections(true);
  collections = collections.filter(item => item.collectionModel !== "DYNAMO");

  try {
    console.log("Loading data is started!");
    for (let i of collections) {
      //Determining collection size and number of times that we are going to call query
      let name = i.name;
      const { count } = await client1.collection(name).count();
      const num = Math.ceil(count / batchSize);

      for (i = 0; i < num; i++) {
        //We change the offset for each iteration
        let offset = i * batchSize;
        //Query part before ${collection_name} and after ${batch Size} can be changed. After ${batchSize} must come Return part of query.
        query = `FOR doc IN ${name} limit ${offset}, ${batchSize} return doc`;
        const cursor = await client1.query(query, {}, { batchSize: batchSize });
        data.push.apply(data, cursor._result);
      }
      obj[name] = data;
      data = [];
    }
    console.log("Data is loaded");
  } catch (e) {
    console.log("Data cant be loaded");
    console.log(e.response.body);
  }
  try {
    console.log("Cloning data is started");
    for (let i of collections) {
      await client2.insertDocumentMany(i.name, obj[i.name]);
      // await client2.importDocuments(i.name, obj[i.name], true, "", true);
    }
    console.log("Data is cloned to new fabric");
  } catch (e) {
    console.log("There is error in data cloning process");
    console.log(e.response.body);
  }
};

const runInSeries = async () => {
  const list = [deleteAllCollections, cloneCollections, cloneIndexes, readData];
  for (const fn of list) {
    await fn(); // call function to get returned Promise
  }
};

runInSeries();
