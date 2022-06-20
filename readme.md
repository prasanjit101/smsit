for direction on inbound messages : https://www.smsit.ai/api-gateway.html#Webhook (Follows +1xxxxxxxxx format for number)

For direction on outbound messages: https://www.smsit.ai/api-cloud.html (Follows 1xxxxxxxxx format for number)

NOTE -

instead of using the URL they describe in the doc, this endpoint will be used when creating a new “listener” for inbound messages:
https://controlpanel.smsit.ai/custom_gateways/sms


## GUIDE

- add contact api of smsit requires group to be created beforehand, thus group with name 'ghl' is mandatory to get the app working
  create 'ghl' group with the following data - 
   - group name = ghl
   - keyword = ghl
   - Group Type = join
- the webhook url should have the path {domain-name}/hooks/smsit/:number
   (Include country code in the number US Example: 12025248725 UK Example: 447481340516)


## WORKFLOW LOGIC

- Authentication - 
   get code from the url -> exchange code for access token -> get form data 
   on form submit -> save in database

- Outbound -
   [GHL] Webhook ->process -> [smsit] send SMS using SMS-It api
   [smsit] Get messages and their current status -> update in GHL

- Inbound -
   [smsit] webhook ->process and store ->GHL inbound

