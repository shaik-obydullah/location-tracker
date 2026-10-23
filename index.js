/**
 * @format
 */

import { AppRegistry } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import App from './App';
import { name as appName } from './app.json';
import { insertLocation } from './src/database/locationDB';

BackgroundFetch.configure(
  {
    minimumFetchInterval: 15,
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
    forceAlarmManager: true,
  },
  async (taskId) => {
    console.log('[HeadlessTask] Background fetch fired in headless mode');
    BackgroundFetch.finish(taskId);
  },
);

BackgroundFetch.registerHeadlessTask(async ({ taskId }) => {
  console.log('[HeadlessTask] registerHeadlessTask fired');
  BackgroundFetch.finish(taskId);
  return Promise.resolve();
});

AppRegistry.registerComponent(appName, () => App);