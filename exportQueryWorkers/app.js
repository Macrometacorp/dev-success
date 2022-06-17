const jsc8 = require("jsc8");
const fs = require("fs");

///////////////////////////////////// User configuration
const fabricName = "_system"; // Name of fabric that you want to export
const url = "https://gdn.paas.macrometa.io"; //Federation url
const apiKey = ""; //API key of fabric that you want to export
//////////////////////////////////////////

let configOBJ = new Object();

//Connect to GDN
const client = new jsc8({
  url,
  apiKey,
  fabricName,
});

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
    cloneRestqls,
  ];
  for (const fn of list) {
    await fn(); // call function to get returned Promise
  }
  saveDataToFile("config", configOBJ);
};
runInSeries();
