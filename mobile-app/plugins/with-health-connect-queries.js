const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin: Adds Health Connect package visibility to AndroidManifest.xml
 *
 * This allows the app to discover and communicate with Health Connect on Android 11+.
 * Required for proper Health Connect integration and app visibility in HC settings.
 */
function withHealthConnectQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure queries array exists
    if (!manifest.queries) {
      manifest.queries = [{}];
    }

    // Access the queries array (it's typically an array with one object)
    const queriesArray = Array.isArray(manifest.queries)
      ? manifest.queries
      : [manifest.queries];

    if (queriesArray.length === 0) {
      queriesArray.push({});
    }

    const queries = queriesArray[0];

    // Initialize package array if needed
    if (!queries.package) {
      queries.package = [];
    }

    const packageArray = Array.isArray(queries.package)
      ? queries.package
      : [queries.package];

    // Check if Health Connect package already exists
    const hasHealthConnect = packageArray.some(
      (pkg) =>
        pkg.$?.['android:name'] === 'com.google.android.apps.healthdata'
    );

    if (!hasHealthConnect) {
      packageArray.push({
        $: {
          'android:name': 'com.google.android.apps.healthdata',
        },
      });
    }

    queries.package = packageArray;
    manifest.queries = queriesArray;

    return config;
  });
}

module.exports = withHealthConnectQueries;
