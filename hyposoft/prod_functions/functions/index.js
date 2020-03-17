const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();

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
    return response;
  })
  .catch(err => {
    console.error(err);
    throw new Error('Export operation failed');
  });
});

exports.scheduledWeeklyFirestoreExport = functions.pubsub
                                            .schedule('every 7 days')
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
    return response;
  })
  .catch(err => {
    console.error(err);
    throw new Error('Export operation failed');
  });
});

exports.scheduledMonthlyFirestoreExport = functions.pubsub
                                            .schedule('every 30 days')
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
    return response;
  })
  .catch(err => {
    console.error(err);
    throw new Error('Export operation failed');
  });
});
