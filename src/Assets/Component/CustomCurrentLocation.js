/* eslint-disable no-unused-vars */
import {View, Text, PermissionsAndroid, Platform} from 'react-native';
import React from 'react';
import Geolocation from 'react-native-geolocation-service';
import {
  request,
  PERMISSIONS,
  requestLocationAccuracy,
} from 'react-native-permissions';
import {
  setKey,
  setDefaults,
  setLanguage,
  setRegion,
  fromAddress,
  fromLatLng,
  fromPlaceId,
  setLocationType,
  geocode,
  RequestType,
} from 'react-geocode';

const CustomCurrentLocation = async getLocation => {
  try {
    if (Platform.OS === 'ios') {
      request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(result => {
        console.log(result);
        if (result === 'granted') {
          Geolocation.getCurrentPosition(
            position => {
              setDefaults({
                key: 'AIzaSyDHd5FoyP2sDBo0vO2i0Zq7TIUZ_7GhBcI', // Your API key here.
                language: 'en', // Default language for responses.
                region: 'es', // Default region for responses.
              });
              fromLatLng(
                position?.coords?.latitude,
                position?.coords?.longitude,
              )
                .then(({results}) => {
                  getLocation(position, results);
                  const {lat, lng} = results[0].geometry.location;
                  console.log(lat, lng);
                })
                .catch(console.error);
            },
            error => {
              console.log(error.code, error.message);
              //   return error;
            },
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
          );
        }
      });
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      console.log(granted, PermissionsAndroid.RESULTS.GRANTED);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          position => {
            setDefaults({
              key: 'AIzaSyDHd5FoyP2sDBo0vO2i0Zq7TIUZ_7GhBcI', // Your API key here.
              language: 'en', // Default language for responses.
              region: 'es', // Default region for responses.
            });
            fromLatLng(position?.coords?.latitude, position?.coords?.longitude)
              .then(({results}) => {
                getLocation(position, results);
                const {lat, lng} = results[0].geometry.location;
                console.log(lat, lng);
              })
              .catch(console.error);
          },
          error => {
            console.log(error.code, error.message);
            //   return error;
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      } else {
        console.log('location permission denied');
      }
    }
  } catch (err) {
    console.log('location err =====>', err);
  }
};

export default CustomCurrentLocation;
