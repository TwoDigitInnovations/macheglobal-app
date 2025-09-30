/* eslint-disable react-native/no-inline-styles */
import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  TextInput,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DownarrIcon,
  LocationIcon,
  ProfileIcon,
  SearchIcon,
} from '../../../Theme';
import Constants, { FONTS } from '../Helpers/constant';
import { goBack, navigate } from '../../../navigationRef';
// import { GetApi } from '../Helpers/Service';
// import { PERMISSIONS, request } from 'react-native-permissions';
// import Geolocation from 'react-native-geolocation-service';
// import GetCurrentAddressByLatLong from './GetCurrentAddressByLatLong';
import { AddressContext, UserContext } from '../../../App';

const Header = props => {
  const [location, setlocation] = useState(null);
  const [locationadd, setlocationadd] = useContext(AddressContext);
  const [user, setuser] = useContext(UserContext);

  return (
    <View style={{ backgroundColor: Constants.yellow }}>
      <StatusBar barStyle={Platform.OS === 'android' ? "dark-content" : "dark-light"} backgroundColor={Constants.saffron} />
      <View style={styles.toppart}>
        <View style={styles.firstrow}>
          <TouchableOpacity
            style={{ flexDirection: 'row' }}
            onPress={() => navigate('Shipping')}>
            <LocationIcon height={25} width={25} color={Constants.white} />
            {user?.address ? (
              <Text style={styles.locationtxt} numberOfLines={1}>
                {user?.ApartmentNo
                  ? `${user?.ApartmentNo}, ${user?.address}`
                  : user?.address}
              </Text>
            ) : (
              <Text style={styles.locationtxt} numberOfLines={1}>
                {locationadd}
              </Text>
            )}
            <DownarrIcon height={15} width={15} style={{ alignSelf: 'center' }} />
          </TouchableOpacity>
          {user?.img || user?.user?.img ? (
            <TouchableOpacity onPress={() =>
              user?.email || user?.user?.email ? navigate('Account') : navigate('Auth')
            }>
              <Image
                source={{
                  uri: user?.img || user?.user?.img,
                }}
                style={styles.hi}
              />
            </TouchableOpacity>
          ) : (
            <ProfileIcon
              height={25}
              width={25}
              onPress={async () => {
                try {
                 
                  const userData = await AsyncStorage.getItem('userDetail');
                  const userDetail = userData ? JSON.parse(userData) : null;
                  
                
                  // Check if user is logged in (either from context or AsyncStorage)
                  const isLoggedIn = user?.email || user?.user?.email || userDetail?.email || userDetail?.user?.email;
                  
                  if (isLoggedIn) {
                    console.log('Navigating to Account');
                    navigate('Account');
                  } else {
                    console.log('No user found, navigating to Auth');
                    navigate('Auth');
                  }
                } catch (error) {
                  console.error('Error getting user data:', error);
                  navigate('Auth');
                }
              }}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  toppart: {
    backgroundColor: Constants.saffron,
    paddingTop: 5,
    // paddingBottom: 20,
  },
  firstrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 10,
  },
  locationtxt: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Bold,
    marginLeft: 10,
    marginRight: 5,
    width: '70%',
  },
  hi: {
    height: 28,
    width: 28,
    borderRadius: 15,
  },
});
