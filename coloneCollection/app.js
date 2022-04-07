const jsc8 = require("jsc8");

//Variables
const collectionName = "nameOfCollection" //The name of the collection that you want to clone
const copyFabric = "_system"; //The name of the fabric where the collection is located
const pasteFabric = "nameOfFabric";   // The name of the fabric where the collection is going to be cloned
const url = "";  //Federation URL for example https://gdn.paas.macrometa.io/
const apiKey = "APIkey" //Input API key

//Create a connection to gdn
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

//
const cloneCollection = async function() {
    const i = await client1.getCollection(collectionName)
    try {
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
          console.log("I don't know this type of collection");
        }
      
      console.log("Collection cloning process is DONE");
    } catch (e) {
      console.log("Something went wrong with the collection cloning request; please ensure that destination fabric doesn't have a collection with the same name.");
      console.log(e.response.body);
    }
  };
  const cloneData = async function() {
    let data = [];
    const batchSize = 1000;
    let obj = new Object();
    const i = await client1.getCollection(collectionName)
  
    try {
      console.log("Loading data is started!");
        //Determining collection size and number of times that we are going to call query
        let name = i.name;
        const { count } = await client1.collection(name).count();
        const num1 = Math.ceil(count / batchSize);
  
        for (a = 0; a < num1; a++) {
          //Changing the offset for each iteration
          let offset = a * batchSize;
          query = `FOR doc IN ${name} limit ${offset}, ${batchSize} return doc`;
          const cursor = await client1.query(query, {}, { batchSize: batchSize });
          data.push.apply(data, cursor._result);
          console.log(`Loading ${a+1} of ${num1}`);

        }
        obj[name] = data;
        data = [];
      console.log("Data is loaded");
    } catch (e) {
      console.log("Data cannot be loaded");
      console.log(e.response.body);
    }
    try {
      console.log("Cloning data is started")
        let limit = 10000
        let bat =10000
        let a=0
        let insert = obj[i.name]
        let count = insert.length
        const num2 = Math.ceil(count / limit);
        let coll = i.name
        for (c = 0; c < num2; c++) {    
          let b =insert.slice(a,(bat))
          await client2.importDocuments(coll, b,true, '_key', true);
          a=a+limit
          bat=bat+limit
          console.log(`Cloning ${c+1} of ${num2}`);

        
    }
      console.log("Data were cloned to new fabric");
    } catch (e) {
      console.log("There is an error in the data cloning process");
      console.log(e);
    }
  };

const cloneIndexes = async function() {
    const i = await client1.getCollection(collectionName)
    let arr = [];
    const collectionIndexes = await client1.getCollectionIndexes(i.name);
      for (let i of collectionIndexes) {
        if (i.type !== "primary" && i.type !== "edge" && i.fields[0] !== "expireAt") {
          arr.push(i);
        }
      }
    
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
      console.log("The indexes cloning process is DONE.!");
    } catch (e) {
      console.log("Something went wrong with the indexes cloning process.");
      console.log(e.response.body);
    }
  };
  
  const runInSeries = async () => {
    const list = [
      cloneCollection,
      cloneIndexes,
      cloneData,
    ];
    for (const fn of list) {
      await fn(); // call function to get returned Promise
    }
  };
  runInSeries();
