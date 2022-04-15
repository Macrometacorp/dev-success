#exportDBtoJSON.js

exportDBtoJSON.js will export all data from fabric to two JSON files:
1. All data will be exported to data.json  
	-data.json structure will be: { collectionName:[doc1,doc2,......], collectionName2:[doc1, doc2, ......], . . . }
2. All configurations in config.json.
	-config.json structure will be: { collections:[collection configuration], indexes: [indexes configuration], graphs: [graphs configuration] restqls: [restqls configuration] }


This script aims to create backup files that can be stored on other platforms.

### Config Variables need to be entered in the script before running
1. apikey
2. fabricName

### How to run it on the console 
1. Download the script folder.
2. npm install
4. node exportDBtoJSON.js
