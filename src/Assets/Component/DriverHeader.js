/* eslint-disable react-native/no-inline-styles */
import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import Constants, {FONTS} from '../Helpers/constant';
import {goBack, navigate, reset} from '../../../navigationRef';
import {GetApi} from '../Helpers/Service';
import {CartContext, UserContext} from '../../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BackIcon, CartFilledIcon} from '../../../Theme';
import {useNavigation} from '@react-navigation/native';

const DriverHeader = props => {
  const [loading, setLoading] = useState(false);
  const [user, setuser] = useContext(UserContext);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [userDetail, setUserDetail] = useState({
    email: '',
    username: '',
    number: '',
    img: '',
  });
  const navigation = useNavigation();

  return (
    <View style={styles.toppart}>
      {/* <StatusBar barStyle={Platform.OS === 'android' ? 'dark-content' : 'dark-light'} backgroundColor={Constants.saffron} /> */}
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          height: '100%',
          alignItems: 'center',
        }}>
        {props.showback ? (
          <TouchableOpacity
            onPress={() => goBack()}
            style={{width: 20, height: 20, marginRight: 10}}>
            <BackIcon color={Constants.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={async () => {
              try {
                const userDetail = await AsyncStorage.getItem('userDetail');
                console.log('=== Profile Icon Debug ===');
                console.log('User from context:', JSON.stringify(user, null, 2));
                console.log('User from AsyncStorage:', userDetail);
                
                if (userDetail) {
                  const parsedUser = JSON.parse(userDetail);
                  
                  // Check multiple possible locations for type field
                  const userType = user?.type || 
                                  parsedUser?.type || 
                                  parsedUser?.user?.type ||
                                  parsedUser?.data?.type;
                  
                  console.log('Detected user type:', userType);
                  
                  if (userType === 'DRIVER') {
                    console.log('→ Navigating to DriverAccount');
                    navigate('DriverAccount');
                  } else if (userType === 'SELLER') {
                    console.log('→ Navigating to VendorAccount');
                    navigate('VendorAccount');
                  } else {
                    // Default: User is logged in, go to Account
                    console.log('→ Navigating to Account (default for logged in users)');
                    const parent = navigation?.getParent?.();
                    if (parent) {
                      parent.navigate('Account');
                    } else {
                      navigate('Account');
                    }
                  }
                } else {
                  console.log('→ No user data, navigating to Auth');
                  navigate('Auth');
                }
              } catch (error) {
                console.error('Error in profile navigation:', error);
                navigate('Auth');
              }
            }}>
            <Image
              // source={require('../Images/profile.png')}
              source={
                user?.img
                  ? {
                      uri: `${user.img}`,
                    }
                  : require('../../Assets/Images/profile2.png')
              }
              style={styles.hi}
            />
          </TouchableOpacity>
        )}
        <Text style={styles.backtxt}>{props?.item}</Text>
      </View>
      {props?.showCart && (
        <Pressable
          onPress={() =>
            navigation.navigate('App', {
              screen: 'Cart',
            })
          }>
          <CartFilledIcon
            height={28}
            width={28}
            style={{alignSelf: 'center'}}
          />
          {cartdetail && cartdetail.length > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cartdetail.length > 99 ? '99+' : cartdetail.length}
              </Text>
            </View>
          ) : null}
        </Pressable>
      )}
    </View>
  );
};

export default DriverHeader;

const styles = StyleSheet.create({
  backtxt: {
    color: Constants.white,
    fontWeight: '600',
    fontSize: 20,
    fontFamily: FONTS.dmsansedium,
  },
  toppart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Constants.saffron,
  },
  hi: {
    marginRight: 10,
    height: 25,
    width: 25,
    borderRadius: 15,
  },
  aliself: {
    alignSelf: 'center',
    // fontWeight:'bold'
    // fontFamily:FONTS.Bold
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Constants.green,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
