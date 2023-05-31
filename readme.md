# SMS-IT + GHL integration

for direction on inbound messages : https://www.smsit.ai/api-gateway.html#Webhook (Follows +1xxxxxxxxx format for number)

For direction on outbound messages: https://www.smsit.ai/api-cloud.html (Follows 1xxxxxxxxx format for number)

## Pre-requisites

- You need to have a Gohighlevel API key to run the application
- A Gohighlevel application to use the application
- And SMS-IT subscription

## USER GUIDE

- add contact api of smsit requires group to be created beforehand, thus group with name 'ghl' is mandatory to get the app working
  create 'ghl' group with the following data - 
   - group name = ghl
   - keyword = ghl
   - Group Type = join
- the webhook url should have the path {domain-name}/hooks/smsit


## WORKFLOW LOGIC

- Authentication - 
   get code from the url -> exchange code for access token -> get form data 
   on form submit -> save in database

- Outbound -
   [GHL] Webhook ->process -> [smsit] send SMS using SMS-It api
   [smsit] Get messages and their current status -> update in GHL

- Inbound -
   [smsit] webhook ->process and store ->GHL inbound

