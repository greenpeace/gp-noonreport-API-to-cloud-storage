# Cloud Function for maritime noon report with Google Cloud Dataprep

You can read the whole setup about using Google Cloud Dataprep in the cloud here -

# The Cloud Functions
The Cloud Function creates a data pipeline to request data from a restFUl API request, the data received is stored as a file in Cloud Storage the code is very much self-explanatory.

The ccode takes advantage of the Google Secret manager so the APIKEY and API URL are stored in the Google cloud secret manager. You need to understand how to setup secrets. You can read this article - https://torbjornzetterlund.com/using-secret-manager-in-a-google-cloud-function-with-python/

## Deploy and test
I'm using firebase to deploy the Cloud Functions using `firebase deploy -P greenpeace-ships --only functions:getNoonreportAPItoStorage`

You don't need to do that you can deply directly the Google CLoud Platform

## Modification 
You can easily modify the code, and access any restFUL API that you want to use and store that data to CLoud Storage. Have fun with it.