Here is the doc you will follow : https://www.smsit.ai/api-gateway.html#Webhook

instead of using the URL they describe in the doc, you will use this endpoint when creating a new “listener” for inbound messages:
https://controlpanel.smsit.ai/custom_gateways/sms

And then this will be the doc/API we will be using for sending outbound messages: https://www.smsit.ai/api-cloud.html


## GUIDE

- add contact api of smsit requires group to be created beforehand, thus group with keyword 'ghl' is mandatory to get the app working
- the webhook url should have the path {domain-name}/hooks/smsit/:number
   (Include country code in the number US Example: 12025248725 UK Example: 447481340516)
