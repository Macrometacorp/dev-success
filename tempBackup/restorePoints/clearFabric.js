const jsc8 = require("jsc8");

//////THIS WILL CLEAR EVERYTHING FROM THE FABRIC; USE IT WITH CAUTION

const fabricName = ""; // Name of the fabric that you want to clear
const url = "https://gdn.paas.macrometa.io/"; //Federation URL
apiKey = ""; //API key of fabric you want to delete. The API key needs to have Admin permission for that fabric.

//Connection
const client = new jsc8({
  url,
  apiKey,
  fabricName: fabricName,
});

//This function will delete all collections
const deleteAllCollections = async function () {
  try {
    const collections = await client.listCollections(true);
    for (let i of collections) {
      await client.deleteCollection(i.name);
    }
    console.log(`All collections are deleted`);
  } catch (e) {
    console.log(e);
    console.log("Something went wrong, Collections cant be deleted");
  }
};

//This function will delete all RESTqls.
const deleteAllRestqls = async function () {
  try {
    const listOfCreatedRestql = await client.getRestqls();
    for (let i of listOfCreatedRestql.result) {
      await client.deleteRestql(i.name);
    }
    console.log("All RESTqls are deleted");
  } catch (e) {
    console.log(e);
    console.log("Something went wrong, RESTqls cant be deleted");
  }
};

//This function will delete all GRAPHS
const deleteAllGraphs = async function () {
  const graphs = await client.getGraphs();
  try {
    for (let i of graphs) {
      await client.deleteGraph(i.name);
    }
    console.log("Graphs are deleted");
  } catch (e) {
    console.log(e);
    console.log("Something went wrong, Graphs cant be deleted");
  }
};

const runInSeries = async () => {
  const list = [deleteAllCollections, deleteAllRestqls, deleteAllGraphs];
  for (const fn of list) {
    await fn(); // call function to get returned Promise
  }
};

runInSeries();
