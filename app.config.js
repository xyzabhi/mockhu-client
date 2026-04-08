// Merges app.json and adds the Google Sign-In config plugin (Expo without Firebase).
// Official setup: https://react-native-google-signin.github.io/docs/setting-up/expo
// `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` must be set in .env before `npx expo prebuild --clean` / `expo run:ios`
// so `iosUrlScheme` matches Google Cloud (same as the doc’s com.googleusercontent.apps.* value).
const appJson = require('./app.json');

function iosUrlSchemeFromEnv() {
  const iosClient = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  if (!iosClient) {
    return 'com.googleusercontent.apps.placeholder';
  }
  const idPart = iosClient.replace(/\.apps\.googleusercontent\.com$/i, '');
  return `com.googleusercontent.apps.${idPart}`;
}

module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [
      ...(appJson.expo.plugins || []),
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: iosUrlSchemeFromEnv(),
        },
      ],
    ],
  },
};
