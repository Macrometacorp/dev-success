import requests

url = "https://api-gdn.paas.macrometa.io/_fabric/_system/_api/cursor/"
apiKey = "<Enter APIkey>"
payload = '{"batchSize": 1000,"stream": true,"query": "FOR i IN testCollection RETURN i"}'
headers = {
    'Authorization': 'apikey '+apiKey,
    'Content-Type': 'text/plain'
}
result = []
errMsg = ""
response = requests.request("POST", url, headers=headers, data=payload).json()
result += (response["result"])

while(response["hasMore"]):
    try:
        response = requests.request(
            "put", url+response["id"], headers=headers, data={}).json()
        result += (response["result"])

    except:
        errMsg = "The query is executing more than 10 seconds"
        break
print(result)
print(errMsg)
