# Script app.js

## Overview
Script app.js will create a new GeoFabric on the destination tenant and clone all data and configuration from the source tenant to the destination tenant. This should be a temporary solution for quick backup recovery. This script aims to create production DB clones every day for ten days to quickly recover production DB if necessary. The script is designed for execution once daily. 

## Functions:
1. Create GeoFabric on the destination tenant
2. Cloning data and configuration of collections 
3. Saving all indexes configuration in a collection called indexes 
4. Saving all graphs configuration in a collection called graphs 
5. Cloning restqls 
6. Deleting GF backups older than ten days

## Restoring DB
There is two way to user restore fabric:
1. To quickly recover, backup GF can become a replacement for production fabric. The user needs to change the current URL for Backup GeoFabric URL and run the script recreateIndexesAndGraphs.js that will recreate indexes and graphs.

2. Second way is to first clear production fabric using the clearFabric.js script and then run the restoreFromBackupGF.js, to clone back everything.

# How to run app.js
## Config Variables need to be entered in the app.js script before running:

apiKey1 - API key of the source tenant
apiKey2 - API key of the destination tenant
apiKey2ID - ID of apiKey2 or name of apiKey2

## How to run it on the console

Download the script folder.
npm install
node app.js
