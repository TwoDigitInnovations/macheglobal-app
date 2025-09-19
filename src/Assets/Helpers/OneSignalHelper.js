import {OneSignal} from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Post} from './Service';
import {Platform} from 'react-native';

const registerDeviceWithBackend = async playerId => {
  try {
    console.log(
      'Utility: Attempting to register device with player ID:',
      playerId,
    );

    if (!playerId) {
      console.log('Utility: No player ID provided, skipping registration');
      return;
    }

    const userData = await AsyncStorage.getItem('userDetail');
    if (!userData) {
      console.log('Utility: No user data found in AsyncStorage');
      return;
    }

    const userDetail = JSON.parse(userData);

    if (userDetail?.token && playerId) {
      console.log(
        'Utility: User data found, registering device for user:',
        userDetail._id || userDetail.id,
      );

      try {
        OneSignal.login(userDetail._id || userDetail.id);
        console.log('Utility: OneSignal login successful');
      } catch (loginError) {
        console.log('Utility: OneSignal login error:', loginError);
      }

      const deviceData = {
        player_id: playerId,
        device_type: Platform.OS,
        user: userDetail._id || userDetail.id, // Fixed: changed from user_id to user
      };

      console.log('Utility: Sending device registration data:', deviceData);

      return Post('registerDevice', deviceData).then(
        res => {
          console.log('Utility: Device registered successfully:', res);
          // Store the player ID for future use
          AsyncStorage.setItem('oneSignalPlayerId', playerId);
          return res;
        },
        err => {
          console.log('Utility: Device registration failed:', err);
          throw err;
        },
      );
    } else {
      console.log(
        'Utility: Cannot register device - missing user token or player ID',
      );
      console.log('Utility: User token exists:', !!userDetail?.token);
      console.log('Utility: Player ID exists:', !!playerId);
    }
  } catch (error) {
    console.log('Utility: Device registration error:', error);
    throw error;
  }
};

export const triggerDeviceRegistrationAfterSignIn = async () => {
  console.log('Utility: Triggering device registration after sign-in...');

  const attemptRegistration = async (attempt = 1) => {
    try {
      // Check for stored player ID first
      const storedPlayerId = await AsyncStorage.getItem('oneSignalPlayerId');
      const subscription = OneSignal.User.pushSubscription.id;
      
      console.log(
        `Utility: Registration attempt ${attempt}, current subscription:`,
        subscription,
        'stored player ID:',
        storedPlayerId,
      );

      if (subscription) {
        await AsyncStorage.setItem('oneSignalPlayerId', subscription);
        await registerDeviceWithBackend(subscription);
      } else if (storedPlayerId) {
        console.log('Utility: Using stored player ID for registration');
        await registerDeviceWithBackend(storedPlayerId);
      } else if (attempt < 5) {
        setTimeout(() => attemptRegistration(attempt + 1), attempt * 2000);
      } else {
        console.log('Utility: Failed to get subscription ID after 5 attempts');
      }
    } catch (error) {
      console.log(`Utility: Error in registration attempt ${attempt}:`, error);
      if (attempt < 5) {
        setTimeout(() => attemptRegistration(attempt + 1), attempt * 2000);
      }
    }
  };

  setTimeout(() => attemptRegistration(), 1000);
};

export const checkOneSignalStatus = () => {
  try {
    const subscription = OneSignal.User.pushSubscription.id;
    console.log(
      'Utility: OneSignal status check - subscription ID:',
      subscription,
    );
    return !!subscription;
  } catch (error) {
    console.log('Utility: Error checking OneSignal status:', error);
    return false;
  }
};

export const handleUserLogout = async () => {
  try {
    console.log('Utility: Handling user logout - clearing OneSignal data');
    
    // Clear stored player ID
    await AsyncStorage.removeItem('oneSignalPlayerId');
    
    // Logout from OneSignal
    OneSignal.logout();
    
    console.log('Utility: OneSignal logout completed');
  } catch (error) {
    console.log('Utility: Error during OneSignal logout:', error);
  }
};

export default {
  triggerDeviceRegistrationAfterSignIn,
  checkOneSignalStatus,
  handleUserLogout,
};
