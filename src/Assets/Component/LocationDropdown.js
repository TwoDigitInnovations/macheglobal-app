/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PermissionsAndroid,
  Image,
  TextInput,
  Platform,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useEffect, useRef, useContext } from 'react';
import Geocode, { fromAddress, setDefaults, setKey } from 'react-geocode';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import Constants from '../Helpers/constant';
import Constants from '../Helpers/constant';


import axios from 'axios';
import {
  request,
  PERMISSIONS,
  requestLocationAccuracy,
  check
} from 'react-native-permissions';
// import {LocationIcon, SearchIcon} from '../../Theme/icons';
import { LocationIcon } from '../../../Theme';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const LocationDropdown = props => {
  const [showList, setShowList] = useState(false);
  const [prediction, setPredictions] = useState([]);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState({});
  const refInput = useRef(null);
  useEffect(() => {
    setAddress(props.value);
  }, [props.value]);

  useEffect(() => {
    getLocation();
  }, []);
  useEffect(() => {
    // setShowList(props?.focus);
    if (props?.focus) {
      console.log(props?.focus);
      refInput.current.focus();
      // Animated.timing(animate, {
      //   toValue: isAnim ? 0 : -45,
      //   duration: 300,
      //   useNativeDriver: true,
      // }).start();
    } else {
      // refInput.current?.blur();
    }
  }, [props]);
  // console.log('prediction',prediction)
  // prediction.map((ite)=>console.log('dropdata',item?.description))
  // console.log('location', location);

  const getLocation = async (text) => {
    try {
      if (Platform.OS === 'ios') {
        request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(async result => {
          console.log(result);
          if (result === 'granted') {
            GooglePlacesInput(text)
          }
        });
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        console.log(PermissionsAndroid.RESULTS.GRANTED, granted);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the location');
        } else {
          console.log('location permission denied');
          // alert("Location permission denied");
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const GOOGLE_PACES_API_BASE_URL =
    'https://maps.googleapis.com/maps/api/place';

  const GooglePlacesInput = async text => {
    const apiUrl = `${GOOGLE_PACES_API_BASE_URL}/autocomplete/json?key=AIzaSyDHd5FoyP2sDBo0vO2i0Zq7TIUZ_7GhBcI&input=${text}`;
    //&components=country:ec
    try {
      if (Platform.OS === 'ios') {
        check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(async result => {
          console.log('serdewe', result);
          if (result === 'granted') {
            setShowList(true);

            const result = await axios.request({
              method: 'post',
              url: apiUrl,
            });
            console.log(result)
            if (result) {
              const {
                data: { predictions },
              } = result;
              setPredictions(predictions);
              setShowList(true);
            }
          } else {
            getLocation(text);
          }
        });
      } else {
        const check = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (check) {
          setShowList(true);
          const result = await axios.request({
            method: 'post',
            url: apiUrl,
          });
          if (result) {
            const {
              data: { predictions },
            } = result;
            setPredictions(predictions);
            setShowList(true);
          }
        } else {
          getLocation(text);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  // const checkLocation = async (add) => {
  //   console.log('add===>', add);
  //   try {
  //     setKey('AIzaSyCre5Sym7PzqWQjHoNz7A3Z335oqtkUa9k');
  //     // setDefaults({
  //     //   key: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Your API key here.
  //     //   language: "en", // Default language for responses.
  //     //   region: "es", // Default region for responses.
  //     // });
  //     if (add) {
  //       fromAddress(add).then(
  //         (response) => {
  //           console.log('response==>', response);
  //           const lat = response.results[0].geometry.location;
  //           const country = response.results[0].address_components.find(
  //             (item) => item.types.includes('country'),
  //           );
  //           console.log('country==>', country?.long_name);
  //           const city = response.results[0].address_components.find(
  //             (item) => item.types.includes('locality'),
  //           );
  //           console.log('city==>', city?.long_name);
  //           setLocation(lat);
  //           props.getLocationVaue(lat, add, city?.long_name, country?.long_name);
  //         },
  //         (error) => {
  //           console.error(error);
  //         },
  //       );
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const checkLocation = async add => {
    try {
      setKey('AIzaSyCre5Sym7PzqWQjHoNz7A3Z335oqtkUa9k');

      if (add) {
        const response = await fromAddress(add);
        if (response.results.length > 0) {
          const lat = response.results[0].geometry.location;

          const components = response.results[0].address_components;

          const country = components.find(item =>
            item.types.includes('country'),
          );
          const city = components.find(item => item.types.includes('locality'));
          const state = components.find(item =>
            item.types.includes('administrative_area_level_1'),
          );

          // ✅ Combine state with country or city
          const fullLocation = {
            lat,
            add,
            city: city?.long_name || '',
            country: country?.long_name || '',
            state: state?.long_name || '',
          };

          // 🔁 Call parent function with all values
          props.getLocationValue(
            fullLocation.lat,
            fullLocation.add,
            fullLocation.city,
            fullLocation.country,
            fullLocation.state, // <-- now added!
          );

          setLocation(lat);
        } else {
          console.warn('No geocode results');
        }
      }
    } catch (error) {
      console.error('Geocode error:', error);
    }
  };

  // console.log('prediction',prediction)
  return (
    // <Autocomplete
    //   apiKey={'AIzaSyCre5Sym7PzqWQjHoNz7A3Z335oqtkUa9k'}
    //   onPlaceSelected={(place) => console.log(place)}
    // />
    <View>
      <View
        style={{
          flexDirection: 'row',
          // marginTop: 20,
          // backgroundColor: Constants.white,
          backgroundColor: Constants.white,
          // borderRadius: 20,
          height: 30,
          width: Dimensions.get('window').width - 110,
          // borderBottomWidth: 2,
          // borderColor: Constants.black,
          // flex:1
        }}>
        <View
          style={[
            styles.amountTimeMainView,
            // filedCheck.includes('LOCATION') && styles.validateBorder,
          ]}>
          {/* <Image
            source={require('../Assets/Images/location.png')}
            style={{height: 25, width: 25}}
            resizeMode="contain"
          /> */}
          {/* <SearchIcon
            height={22}
            width={22}
            color={COLORS.bgPrimary}
            style={{marginLeft: 20, marginRight: 10}}
          /> */}
          <View style={{ flex: 1 }}>
            {/* <Text style={[styles.amountTime, {marginBottom: 7}]}>
              Work Location
            </Text> */}
            <TextInput
              value={address}
              ref={refInput}
              // placeholder="Where you want to go...."
              placeholder={props?.placeholder || 'Address'}
              placeholderTextColor={Constants.customgrey}
              numberOfLines={5}
              // textAlignVertical="center"
              style={[
                styles.amountTime,
                styles.editjobinput,
                { color: Constants.black },
              ]}
              onBlur={() => {
                props.setIsFocus(false);
                setShowList(false);
              }}
              onFocus={() => {
                props.setIsFocus(props.focus);
              }}
              onChangeText={location => {
                GooglePlacesInput(location);
                setAddress(location);
              }}
            />
          </View>
        </View>
      </View>
      {prediction != '' && showList && (
        <View style={prediction && styles.list}>
          {prediction.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: Constants.lightgrey,
                // backgroundColor:Constants.white
              }}
              onPress={() => console.log('pressed')}>
              {/* <Ionicons
                name="location"
                size={18}
                color={Constants.red}
                style={{marginHorizontal: 5}}
              /> */}
              <LocationIcon
                height={18}
                width={18}
                color={Constants.white}
                style={{ marginHorizontal: 5 }}
              />
              <Text
                style={styles.item}
                onPress={() => {
                  console.log('pressed');
                  console.log('item==>', item);
                  console.log('itemdec==>', item.description);
                  refInput.current?.blur();
                  setAddress(item?.description);
                  checkLocation(item?.description);
                  setShowList(false);
                  setTimeout(() => {
                    props.setIsFocus(false);
                  }, 300);
                }}>
                {item?.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  editjobinput: {
    // height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    // marginRight:10,
    margin: 0,
    // lineHeight: 12,
    marginLeft: 2,
    // width: '90%',
    // color: Constants.white,
    // color: Constants.black,
  },
  amountTimeMainView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  amountTime: {
    color: Constants.white,
    // color:COLORS.bgPrimary,
    // fontWeight: '500',
    fontSize: 16,
    marginLeft: 5,
    // lineHeight: 18,
    // backgroundColor:'red'
  },
  list: {
    marginVertical: 10,
    position: 'absolute',
    top: 20,
    width: '100%',
    // marginLeft:20,
    // marginHorizontal: 20,
    borderColor: Constants.lightgrey,
    borderWidth: 1,
    borderRadius: 5,
    // padding: 10,
    backgroundColor: Constants.saffron,
    zIndex: 10,
    // marginTop:40
  },
  item: {
    // padding: 10,
    fontSize: 13,
    height: 'auto',
    marginVertical: 5,
    // borderBottomWidth: 1,
    // borderBottomColor: 'lightgrey',
    // fontFamily: 'Mulish-SemiBold',
    width: Dimensions.get('window').width - 100,
    flexWrap: 'wrap',
    // color:Constants.lightgrey,
    zIndex: 30,
    flex: 1,
    color: Constants.white,
    // color: Constants.white,
    // backgroundColor:COLORS.bgPrimary
  },
  validateBorder: {
    borderBottomColor: Constants.red,
    borderBottomWidth: 1,
    paddingBottom: 5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});

export default LocationDropdown;
