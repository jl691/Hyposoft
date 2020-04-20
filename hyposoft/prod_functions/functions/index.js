const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();

admin.initializeApp();

// This is for the email delivery
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ece458jajascript@gmail.com',
        pass: 'dukeece458badpassword'
    }
});

const bucket_daily = 'gs://daily_backups_hyposoft_prod';
const bucket_weekly = 'gs://weekly_backups_hyposoft_prod';
const bucket_monthly = 'gs://monthly_backups_hyposoft_prod';

exports.scheduledDailyFirestoreExport = functions.pubsub
                                            .schedule('every 24 hours')
                                            .onRun((context) => {

  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  const databaseName =
    client.databasePath(projectId, '(default)');

  return client.exportDocuments({
    name: databaseName,
    outputUriPrefix: bucket_daily,
    // Leave collectionIds empty to export all collections
    // or set to a list of collection IDs to export,
    // collectionIds: ['users', 'posts']
    collectionIds: []
    })
  .then(responses => {
    const response = responses[0];
    console.log(`Operation Name: ${response['name']}`);
    // Now send directed email
    cors(req, res, () => {

       const dest = 'ad353duke.edu';

       const mailOptions = {
           from: 'HypoSoft Backup Team <ece458jajascript@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
           to: dest,
           subject: "Daily Backup Success", // email subject
           html: "<p>Hello!</p><br/><p>A daily backup of your database was successfully taken at "+ new Date()+"</p><br/><p>Have a great day!</p><p>HypoSoft Backup Team</p>" // email content in HTML
       };

       // returning result
       return transporter.sendMail(mailOptions, (erro, info) => {
           if(erro){
               return res.send(erro.toString());
           }
           return res.send('Sent');
       });
   });
    return response;
  })
  .catch(err => {
    console.error(err);
    throw new Error('Export operation failed');
  });
});

exports.scheduledWeeklyFirestoreExport = functions.pubsub
                                            .schedule('0 0 * * 0')
                                            .onRun((context) => {

  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  const databaseName =
    client.databasePath(projectId, '(default)');

  return client.exportDocuments({
    name: databaseName,
    outputUriPrefix: bucket_weekly,
    // Leave collectionIds empty to export all collections
    // or set to a list of collection IDs to export,
    // collectionIds: ['users', 'posts']
    collectionIds: []
    })
  .then(responses => {
    const response = responses[0];
    console.log(`Operation Name: ${response['name']}`);
    // Now send directed email
    cors(req, res, () => {
       const dest = 'ad353duke.edu';

       const mailOptions = {
           from: 'HypoSoft Backup Team <ece458jajascript@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
           to: dest,
           subject: "Weekly Backup Success", // email subject
           html: "<p>Hello!</p><br/><p>A weekly backup of your database was successfully taken at "+ new Date()+"</p><br/><p>Have a great day!</p><p>HypoSoft Backup Team</p>" // email content in HTML
       };

       // returning result
       return transporter.sendMail(mailOptions, (erro, info) => {
           if(erro){
               return res.send(erro.toString());
           }
           return res.send('Sent');
       });
   });
    return response;
  })
  .catch(err => {
    console.error(err);
    throw new Error('Export operation failed');
  });
});

exports.scheduledMonthlyFirestoreExport = functions.pubsub
                                            .schedule('0 0 1 * *')
                                            .onRun((context) => {

  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  const databaseName =
    client.databasePath(projectId, '(default)');

  return client.exportDocuments({
    name: databaseName,
    outputUriPrefix: bucket_monthly,
    // Leave collectionIds empty to export all collections
    // or set to a list of collection IDs to export,
    // collectionIds: ['users', 'posts']
    collectionIds: []
    })
  .then(responses => {
    const response = responses[0];
    console.log(`Operation Name: ${response['name']}`);
    // Now send directed email
    cors(req, res, () => {

       const dest = 'ad353duke.edu';

       const mailOptions = {
           from: 'HypoSoft Backup Team <ece458jajascript@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
           to: dest,
           subject: "Monthly Backup Success", // email subject
           html: "<p>Hello!</p><br/><p>A monthly backup of your database was successfully taken at "+ new Date()+"</p><br/><p>Have a great day!</p><p>HypoSoft Backup Team</p>" // email content in HTML
       };

       // returning result
       return transporter.sendMail(mailOptions, (erro, info) => {
           if(erro){
               return res.send(erro.toString());
           }
           return res.send('Sent');
       });
   });
    return response;
  })
  .catch(err => {
    console.error(err);
    throw new Error('Export operation failed');
  });
});
