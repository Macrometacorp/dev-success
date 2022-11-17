This script is intended for migration from GDN to PLAY.

Use this script to migrate the GDN account to an empty PLAY account

Supported collection types : DOC, KV and Edge

Known limitation:
1. Local collections are not supported on PLAY, and all doc collections will switch to global
2. Migration of View is currently not working 
3. PLAY has a Storage per Day limit of 200 MB, be aware of that when moving your account.

Steps:
1. Create an account on PLAY
2. Create an API key on PLAY
3. Create an API key on GDN and give it access(admin) to all Geofabrics if you have more than one Geofabric
4. Configure the script
5. npm install 
6. node app.js
