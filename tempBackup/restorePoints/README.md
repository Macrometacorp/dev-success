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

1. apiKey1 - API key of the source tenant
2. apiKey2 - API key of the destination tenant
3. apiKey2ID - ID of apiKey2 or name of apiKey2

## How to run it on the console

1. Download the script folder.
2. `npm install`
3. `node app.js`

# How to restore

## First approach using backup GeoFabric instead of production GF.
Run script recreateIndexesAndGraphs.js to recreate indexes and graphs on the backup GeoFabric
Change URL in your application for backup Geo Fabric URL

### Config Variables need to be entered in the recreateIndexesAndGraphs.js script before running:
fabricName - fabric name of backup Geo Fabric
apiKey - apiKey of backup GeoFabric, apiKey needs permission to access GF.

### How to run it on the console
1. `node recreateIndexesAndGraphs.js`

## Second approach, restoring data from backup GF to production GF.
Run the clearFabric.js script, be aware that this script will delete all data on fabric!!!
Run restoreFromBackupGF.js script; this will clone all data from selected backup GF to production fabric.

### Config Variables need to be entered in the clearFabric.js script before running:
1. apiKey1 
2. fabricName

### Config Variables need to be entered in the restoreFromBackupGF.js script before running:
1. backupFabricName
2. apiKey1 - apiKey of backup GF
3. apiKey2 - apiKey of production GF

### How to run it on the console
1. `node clearFabric.js`
1. `restoreFromBackupGF.js`
