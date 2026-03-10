import AsyncStorage from '@react-native-async-storage/async-storage';
import { reset } from '../../../navigationRef';


export const isUserLoggedIn = async () => {
  try {
    const userDetail = await AsyncStorage.getItem('userDetail');
    const isGuest = await AsyncStorage.getItem('isGuestUser');
    
    if (userDetail && JSON.parse(userDetail)?.token) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};


export const requireAuth = async (returnRoute = null) => {
  const loggedIn = await isUserLoggedIn();
  
  if (!loggedIn) {
    console.log(' Authentication required - redirecting to SignIn');
    // Store return route if provided
    if (returnRoute) {
      await AsyncStorage.setItem('returnRoute', returnRoute);
    }
    reset('Auth');
    return false;
  }
  
  return true;
};


export const getAndClearReturnRoute = async () => {
  try {
    const returnRoute = await AsyncStorage.getItem('returnRoute');
    if (returnRoute) {
      await AsyncStorage.removeItem('returnRoute');
      return returnRoute;
    }
    return null;
  } catch (error) {
    console.error('Error getting return route:', error);
    return null;
  }
};
