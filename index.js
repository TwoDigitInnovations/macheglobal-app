/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
console.log(appName)
const appname = Platform.OS === 'android' ? appName : 'matcheglobal'
AppRegistry.registerComponent(appname, () => App);
