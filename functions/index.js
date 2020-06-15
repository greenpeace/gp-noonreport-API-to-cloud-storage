/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 */
'use strict';

// Request Data From A URL
var request = require('request');

// Var Firebase Functions
var functions = require('firebase-functions');
const admin = require('firebase-admin');

// Var JSONStrem Functions
const JSONStream = require('JSONStream');

// Initalise App
admin.initializeApp();
// init firebase admin and get the default project id
const projectId = admin.instanceId().app.options.projectId

// Imports the Google Storage client library
const {Storage} = require('@google-cloud/storage');

// Import the Secret Manager client and instantiate it:
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const secretClient = new SecretManagerServiceClient();

// Setting Timeout in Seconds - default is 1 second
// The maximum value for timeoutSeconds is 540, or 9 minutes. Valid values for memory are:
// 128MB, 256MB, 512MB, 1GB, 2GB

const runtimeOpts = {
  timeoutSeconds: 300,
  memory: '512MB'
}

/**
 * Delete a file from a storage bucket and download a new file from remote location to store in the bucket
 */
exports.getNoonreportAPItoStorage = functions
  .runWith(runtimeOpts)
  .region('europe-west1')
  .https.onRequest(async (req, res) => {

    // Creates a storage client
    const storage = new Storage({
      projectId: projectId,
    });
    
    // Get Secret
    const apikey = await getSecret("emilyapikey");
    const apiurl = await getSecret("emilyurl");

    // First we want to delete the current file, the filename is always the same. 
    // Set Bucket Name
    const bucket = storage.bucket('masterlog_gp_ships');
    // Set destination filename
    const masterlog = bucket.file('masterlog-noonreport.json'); 

    // Delete file in the Bucket
    bucket.deleteFiles({
      prefix: `masterlog-noonreport.json`
    })
    .catch( (err) => {
      console.log(`Failed to delete masterlog-noonreport.json`);
    });

    // Table to get data from
    var apitable = 'noon_reportgcp';

    // From were the data comes
    // 1 = Shoreserver
    // 2 = Ezperanza
    // 3 = Arctic Sunrise
    // 4 = Rainbow Warrior 
    var shipid = '1';

    // Get the current date 
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = '0000' + '-' + '00' + '-' + '00';

    var url = apiurl + shipid + '/' + apitable + '?apikey=' + apikey + '&syncdate=' + today + '?format=json';

    // Set the options to make the request
    var options = {
        url: url,
        strictSSL: false,
        secureProtocol: 'TLSv1_method'
    }

    // Setting the destination for streaming the data
    const fileWriteStream = masterlog.createWriteStream({
      resumable: false
    });

    // Make a request for the API and store the file in Storage
    request(options)
      .pipe(fileWriteStream)
      .on('finish', function(error) {
      if (error) {
          console.log(error);
          res.status(500).send(error);
      } else {
          console.log( "- done!")
          res.status(200).send("OK");
      }
    });
    // End Function with status code 200

    async function getSecret(secretkey) {
      // Access the secret.
      let resource_name = 'projects/' + projectId + '/secrets/' + secretkey + '/versions/latest';
      let [version] = await secretClient.accessSecretVersion({name: resource_name})

      console.info(`Found secret ${version.payload.data} with state ${version.state}`);
      let secretvalue = version.payload.data;
      return secretvalue;
    }
  });