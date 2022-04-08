This is a helper script for cloning collections from one fabric to another. The user needs to input an API key, collection name, and the source and destination fabric name.

Supported collections type:
Document,
KV,
Edge 

STEPS:
1. Install the latest version of drivers **npm i jsc8@0.17.6-beta.5**

2. Create an API key and configure API key permissions in GDN. The API key needs to have access to GeoFabric.

3. Add API key, collection name, federation URL and destination fabric in the script

4. Run script using **node app.js** command.
