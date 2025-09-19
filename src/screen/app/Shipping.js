/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import { goBack, navigate } from '../../../navigationRef';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import {
  AddressContext,
  LoadContext,
  ToastContext,
  UserContext,
} from '../../../App';
import LocationDropdown from '../../Assets/Component/LocationDropdown';
import { request, PERMISSIONS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import GetCurrentAddressByLatLong from '../../Assets/Component/GetCurrentAddressByLatLong';
import { LocationIcon } from '../../../Theme';
import { useTranslation } from 'react-i18next';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { Checkbox } from 'react-native-paper';
import GetLatLongFromAddress from '../../Assets/Helpers/GetLatLongFromAddress';
import Toast from 'react-native-toast-message';

const Shipping = props => {
  const { t } = useTranslation();
  const propdata = props?.route?.params;
  const [user, setuser] = useContext(UserContext);
  const [from, setFrom] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [, setToast] = useContext(ToastContext);
  const [, setLoading] = useContext(LoadContext);
  const [location, setlocation] = useState();
  const [locationadd, setlocationadd] = useContext(AddressContext);
  const [addressdata, setaddressdata] = useState({
    name: '',
    lastname: '',
    address: '',
    ApartmentNo: '',
    SecurityGateCode: '',
    zipcode: '',
    number: '',
    state: '',
    city: '',
    country: '',
  });
  const [isBusiness, setIsBusiness] = useState(false);
  const [businessAddress, setBusinessAddress] = useState({
    businessAddress: user?.BusinessAddress || '',
  });

  const fetchZipCodes = async () => {
    setLoading(true);
    GetApi('getPinCode', {}).then(
      async res => {
        console.log('Zip Codes:', res);
        // setAvailableZipCodes(res?.pincodes || []);
        setLoading(false);
      },
      err => {
        console.log('Error fetching zip codes:', err);
        Toast.show({
          type: 'error',
          text1: t('Error fetching zip codes'),
        })
        setLoading(false);
      },
    );
  };

  const data = async () => {
    setLoading(true);
    GetApi('getProfile', {}).then(
      async res => {
        setLoading(false);
        console.log('Profile data:', res);
        if (res.status) {
          // Pre-fill form with existing user data
          setaddressdata(prev => ({
            ...prev,
            name:
              res?.data?.username ||
              res?.data?.name ||
              user?.name ||
              user?.username ||
              prev.name ||
              '',
            lastname:
              res?.data?.lastname || user?.lastname || prev.lastname || '',
            address: res?.data?.address || prev.address || '',
            ApartmentNo: res?.data?.ApartmentNo || prev.ApartmentNo || '',
            SecurityGateCode:
              res?.data?.SecurityGateCode || prev.SecurityGateCode || '',
            zipcode: res?.data?.zipcode || prev.zipcode || '',
            number:
              res?.data?.number ||
              res?.data?.number ||
              user?.number ||
              user?.phone ||
              user?.mobile ||
              prev.number ||
              '',
            city: res?.data?.city || prev.city || '',
            country: res?.data?.country || prev.country || '',
          }));

          // Set location if available
          if (res?.data?.location?.coordinates) {
            setlocation({
              latitude: res?.data?.location.coordinates[1],
              longitude: res?.data?.location.coordinates[0],
            });
          }

          // Set business address data
          setBusinessAddress({
            businessAddress: res?.data?.BusinessAddress || '',
          });
          setIsBusiness(res?.data?.isBusiness || false);

          // If no address exists, get current location
          if (!res?.data?.address) {
            CustomCurrentLocation();
          }
        } else {
          // If API fails, try to use existing user context data
          if (user) {
            setaddressdata(prev => ({
              ...prev,
              name: user?.name || user?.username || prev.name,
              number:
                user?.number || user?.phone || user?.mobile || prev.number,
            }));
          }
        }
      },
      err => {
        setLoading(false);
        console.log('Profile fetch error:', err);

        // If API fails, try to use existing user context data
        if (user) {
          setaddressdata(prev => ({
            ...prev,
            name: user?.name || user?.username || prev.name,
            number: user?.number || user?.phone || user?.mobile || prev.number,
          }));
        }
      },
    );
  };

  useEffect(() => {
    data();
    fetchZipCodes();
  }, []);

  // Initialize form with user data if available
  useEffect(() => {
    if (user && (!addressdata.name || !addressdata.number)) {
      setaddressdata(prev => ({
        ...prev,
        name: prev.name || user?.name || user?.username || '',
        number:
          prev.number || user?.number || user?.phone || user?.mobile || '',
        lastname: prev.lastname || user?.lastname || '',
      }));
    }
  }, [user]);

  // useEffect(() => {
  //   if (propdata?.type === 'mapdata') {
  //     setlocation(propdata.location);
  //     GetCurrentAddressByLatLong({
  //       lat: propdata.location.latitude,
  //       long: propdata.location.longitude,
  //     }).then(res => {
  //       console.log('res===>', res);
  //       const formattedAddress = res.results[0].formatted_address;
  //       setaddressdata(prevState => ({
  //         ...prevState,
  //         address: formattedAddress,
  //       }));
  //       setlocationadd(formattedAddress);
  //     });
  //   }
  // }, [propdata]);

  useEffect(() => {
    if (
      propdata?.type === 'mapdata' &&
      propdata.location &&
      (!addressdata.city || !addressdata.country)
    ) {
      setlocation(propdata.location);

      GetCurrentAddressByLatLong({
        lat: propdata.location.latitude,
        long: propdata.location.longitude,
      }).then(res => {
        const formattedAddress = res.results[0].formatted_address;
        setaddressdata(prevState => ({
          ...prevState,
          address: formattedAddress,
        }));
        setlocationadd(formattedAddress);
      });
    }
  }, [propdata, addressdata.city, addressdata.country]);

  // useEffect(() => {
  //   if (addressdata?.zipcode && availableZipCodes?.length > 0) {
  //     if (availableZipCodes.some(zip => zip.pincode === addressdata?.zipcode)) {
  //       setError(false);
  //     } else {
  //       setError(true);
  //     }
  //   } else {
  //     setError(true);
  //   }
  // }, [addressdata?.zipcode, availableZipCodes]);

  useEffect(() => {
    if (locationadd) {
      fetchLatLongAndLocationDetails(locationadd);
    }
  }, [locationadd]);

  const fetchLatLongAndLocationDetails = async address => {
    // Only fetch lat/long if we don't already have complete location data
    if (!location || !addressdata.city || !addressdata.country) {
      const result = await GetLatLongFromAddress(address);

      if (result) {
        const { latitude, longitude, state, country, city } = result;

        setlocation({
          latitude,
          longitude,
        });

        setaddressdata(prev => ({
          ...prev,
          lat: latitude,
          long: longitude,
          state: state || prev.state || '',
          country: country || prev.country || '',
          city: city || prev.city || '',
        }));

        console.log('Fetched location details from address:', {
          lat: latitude,
          long: longitude,
          state,
          country,
          city,
        });
      }
    }
  };

  const getLocationValue = (lat, add, city, country, state) => {
    console.log('lat=======>', lat);
    console.log('add=======>', add);
    console.log('city=======>', city);
    console.log('country=======>', country);
    console.log('state=======>', state); // ✅ NEW

    setaddressdata((prev) => ({
      ...prev,
      address: add,
      city: city || '',
      country: country || '',
      state: state || '', // ✅ NEW
      lat: lat.lat,
      long: lat.lng,
    }));

    setlocation({
      latitude: lat.lat,
      longitude: lat.lng,
    });

    setlocationadd(add);
  };


  const submit = () => {
    const isEmpty = val => !val || val.trim() === '';

    const requiredFields = [
      addressdata.name,
      addressdata.lastname,
      addressdata.zipcode,
      addressdata.number,
    ];

    if (
      requiredFields.some(isEmpty) ||
      (isBusiness && isEmpty(businessAddress?.businessAddress))
    ) {
      setSubmitted(true);
      return;
    }

    // if (error) {
    //   setToast(t('Not serviceable zip code'));
    //   return;
    // }
    // setSubmitted(false);

    // Ensure we have an address from either source
    const finalAddress = addressdata.address || locationadd;

    const finalAddressData = {
      ...addressdata,
      address: finalAddress,
    };

    // Ensure location is available before accessing its properties
    if (
      location &&
      location.longitude !== undefined &&
      location.latitude !== undefined
    ) {
      finalAddressData.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      };
    } else {
      Toast.show({
        type: 'Success',
        text1: t('Location is required. Please select a location.'),
      })
      setLoading(false);
      return;
    }

    if (isBusiness) {
      finalAddressData.BusinessAddress = businessAddress?.businessAddress;
      finalAddressData.isBusiness = true;
    } else {
      finalAddressData.BusinessAddress = '';
      finalAddressData.isBusiness = false;
    }

    console.log('Final Address Data:', finalAddressData);

    const userdata = {
      address: finalAddressData.address,
      location: finalAddressData.location,
      lat: finalAddressData.lat,
      long: finalAddressData.long,
      state: finalAddressData.state,
      city: finalAddressData.city,
      country: finalAddressData.country,
      zipcode: finalAddressData.zipcode,
      isBusiness: finalAddressData.isBusiness,
      BusinessAddress: finalAddressData.BusinessAddress,
      ApartmentNo: finalAddressData.ApartmentNo,
      SecurityGateCode: finalAddressData.SecurityGateCode,
      number: finalAddressData.number,
      userId: user?._id,
      name: finalAddressData.name,
      lastname: finalAddressData.lastname,
    };

    setLoading(true);
    Post('updateProfile', userdata, {}).then(
      async res => {
        setLoading(false);
        console.log(res);

        if (res?.status) {
          setuser(res.data);
          if (propdata?.type === 'checkout') {
            navigate('Checkout');
          } else {
            goBack();
          }
        } else {
          setToast(res?.message);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const CustomCurrentLocation = async () => {
    try {
      if (Platform.OS === 'ios') {
        request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(result => {
          console.log(result);
          if (result === 'granted') {
            Geolocation.getCurrentPosition(
              position => {
                // setlocation(position);
              },
              err => {
                console.log(err.code, err.message);
                //   return err;
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
            );
          }
        });
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            position => {
              console.log(position);
              // setlocation(position);
              setlocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                // latitudeDelta: 0.05,
                // longitudeDelta: 0.05,
              });
              // setper(granted);
              GetCurrentAddressByLatLong({
                lat: position.coords.latitude,
                long: position.coords.longitude,
              }).then(res => {
                console.log('res===>', res);
                const formattedAddress = res.results[0].formatted_address;
                setlocationadd(formattedAddress);
                setaddressdata(prevstate => ({
                  ...prevstate,
                  address: formattedAddress,
                  lat: position.coords.latitude,
                  long: position.coords.longitude,
                }));
              });
            },
            err => {
              console.log(err.code, err.message);
              //   return err;
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        } else {
          console.log('location permission denied');
        }
      }
    } catch (err) {
      console.log('location err =====>', err);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* <Header back={true} item={'Shipping'} /> */}
      <DriverHeader item={t('Shipping Address')} showback={true} />
      {/* <View style={styles.toppart}>
        <Text style={styles.carttxt}>{t('Shipping Address')} </Text>
      </View> */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ marginTop: 20, marginHorizontal: 20 }}>
        <Text style={styles.headtxt}>{t('Shipping Address')}</Text>
        <View style={styles.box}>
          <Text style={styles.name}>{t('First Name')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Enter First Name')}
            placeholderTextColor={Constants.customgrey}
            value={addressdata?.name}
            onChangeText={name => setaddressdata({ ...addressdata, name })}
          />
        </View>
        {submitted && addressdata.name === '' && (
          <Text style={styles.require}>{t('Name is required')}</Text>
        )}
        {/* {availableZipCodes?.map((zip) => (
          <Text key={zip}>
            {zip?.pincode}
          </Text>
        ))} */}
        <View style={styles.box}>
          <Text style={styles.name}>{t('Last Name')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Enter Last Name')}
            placeholderTextColor={Constants.customgrey}
            value={addressdata?.lastname}
            onChangeText={lastname =>
              setaddressdata({ ...addressdata, lastname })
            }
          />
        </View>
        {submitted && addressdata.lastname === '' && (
          <Text style={styles.require}>{t('Last Name is required')}</Text>
        )}
        <View style={styles.box2}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{t('Address')}</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: Constants.customgrey3,
                color: Constants.black,
                fontWeight: '500',
                borderRadius: 10,
                textAlign: 'left',
                fontSize: 16,
                fontFamily: FONTS.Regular,
                marginTop: 5,
                paddingHorizontal: 10,
                // flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 50,
                width: '100%',
              }}>
              <LocationDropdown
                value={addressdata?.address || locationadd || ''}
                focus={from === 'location'}
                setIsFocus={setFrom}
                from="location"
                getLocationValue={(lat, add, city, country) =>
                  getLocationValue(lat, add, city, country)
                }
              />
            </View>
          </View>
        </View>
        {submitted && addressdata.address === '' && !locationadd && (
          <Text style={styles.require}>{t('Address is required')}</Text>
        )}
        <View style={styles.box}>
          <Text style={styles.name}>{t('Apartment No.')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Enter Apartment No (Optional)')}
            placeholderTextColor={Constants.customgrey}
            value={addressdata?.ApartmentNo}
            onChangeText={ApartmentNo =>
              setaddressdata({ ...addressdata, ApartmentNo })
            }
          />
        </View>
        <View style={styles.box}>
          <Text style={styles.name}>{t('Security Gate No.')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Enter Security Gate No. (Optional)')}
            placeholderTextColor={Constants.customgrey}
            value={addressdata?.SecurityGateCode}
            onChangeText={SecurityGateCode =>
              setaddressdata({ ...addressdata, SecurityGateCode })
            }
          />
        </View>
        <View style={styles.box}>
          <Text style={styles.name}>{t('Zip / Post Code')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Enter Zip / Post Code')}
            keyboardType="number-pad"
            placeholderTextColor={Constants.customgrey}
            value={addressdata?.zipcode}
            onChangeText={zipcode => setaddressdata({ ...addressdata, zipcode })}
          />
          {/* <Dropdown
            style={styles.input}
            // search={true}
            data={availableZipCodes.map(zip => ({
              label: zip?.pincode,
              value: zip?.pincode,
            }))}
            value={addressdata?.zipcode}
            onChange={item => {
              setaddressdata({...addressdata, zipcode: item.value});
            }}
            placeholder={t('Select Zip Code')}
            placeholderStyle={{color: Constants.customgrey}}
            selectedTextStyle={{color: Constants.black}}
            maxHeight={200}
            labelField="label"
            valueField="value"
            // renderLeftIcon={() => (
            //   <LocationIcon
            //     color={Constants.customgrey}
            //     style={{marginLeft: 5}}
            //   />
            // )}
            renderItem={item => (
              <Text style={{padding: 10, color: Constants.black}}>
                {item.label}
              </Text>
            )}
          />*/}
        </View>
        {submitted && addressdata.zipcode === '' && (
          <Text style={styles.require}>{t('Zip/Post code is required')}</Text>
        )}
        {/* {error && (
          <Text style={styles.require}>{t('Not serviceable area')}</Text>
        )} */}
        <View style={styles.box}>
          <Text style={styles.name}>{t('Mobile Number')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Enter Number')}
            keyboardType="number-pad"
            placeholderTextColor={Constants.customgrey}
            value={addressdata?.number}
            onChangeText={number => setaddressdata({ ...addressdata, number })}
          />
        </View>
        {submitted && addressdata.number === '' && (
          <Text style={styles.require}>{t('Number is required')}</Text>
        )}
        {/* <View style={styles.box}>
          <Text style={styles.name}>{t('City')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Enter City')}
            placeholderTextColor={Constants.customgrey}
            value={addressdata?.city}
            onChangeText={city => setaddressdata({...addressdata, city})}
          />
        </View>
        {submitted && addressdata.city === '' && (
          <Text style={styles.require}>{t('City is required')}</Text>
        )}
        <View style={styles.box}>
          <Text style={styles.name}>{t('Country')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Enter Country')}
            placeholderTextColor={Constants.customgrey}
            value={addressdata?.country}
            onChangeText={country => setaddressdata({...addressdata, country})}
          />
        </View>
        {submitted && addressdata.country === '' && (
          <Text style={styles.require}>{t('Country is required')}</Text>
        )} */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 5,
            marginLeft: -20
          }}>
          <Checkbox.Item status={isBusiness ? 'checked' : 'unchecked'}
            onPress={() => setIsBusiness(!isBusiness)}
            color={Constants.saffron}
            uncheckedColor={Constants.customgrey}
            mode='android'
            label={t('This is business address')}
            position='leading'
          />
          {/* <Checkbox
            status={isBusiness ? 'checked' : 'unchecked'}
            onPress={() => setIsBusiness(!isBusiness)}
            color={Constants.saffron}
            uncheckedColor={Constants.customgrey}
            mode='android'
          /> */}
          {/* <Text
            style={{
              fontSize: 16,
              fontFamily: FONTS.Regular,
            }}>
            {t('This is business address')}
          </Text> */}
        </View>
        {isBusiness && (
          <View style={styles.box}>
            <Text style={styles.name}>{t('Business Name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('Enter Business Name')}
              placeholderTextColor={Constants.customgrey}
              value={businessAddress?.businessAddress}
              onChangeText={text =>
                setBusinessAddress({ ...businessAddress, businessAddress: text })
              }
            />
          </View>
        )}
        {submitted && isBusiness && !businessAddress?.businessAddress && (
          <Text style={styles.require}>{t('Business Name is required')}</Text>
        )}
        <TouchableOpacity style={styles.btn} onPress={() => submit()}>
          <Text style={styles.btntxt}>
            {propdata?.type === 'checkout'
              ? t('Continue')
              : t('Update Address')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Shipping;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
    // padding: 20,
  },
  toppart: {
    backgroundColor: Constants.saffron,
    paddingTop: 5,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  carttxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    marginLeft: 10,
  },
  image: {
    height: 100,
    width: 100,
    position: 'absolute',
    opacity: 0.1,
    display: 'flex',
    alignSelf: 'center',
    top: Dimensions.get('screen').height / 2 - 50,
  },
  headtxt: {
    fontSize: 24,
    // fontWeight: '700',
    color: Constants.black,
    fontFamily: FONTS.Bold,
    marginBottom: 20,
  },
  input: {
    // flex:1,
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    color: Constants.black,
    fontWeight: '500',
    borderRadius: 10,
    textAlign: 'left',
    fontSize: 16,
    fontFamily: FONTS.Regular,
    marginTop: 5,
    paddingHorizontal: 10,
    height: 45,
  },
  name: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Regular,
    fontWeight: '700',
    marginBottom: 0,
  },
  box: {
    marginVertical: 5,
  },
  box2: {
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  btntxt: {
    fontSize: 20,
    color: Constants.white,
    // fontWeight:'700'
    fontFamily: FONTS.Bold,
  },
  btn: {
    height: 60,
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    backgroundColor: Constants.saffron,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 40,
  },
  require: {
    color: Constants.red,
    fontFamily: FONTS.Medium,
    marginLeft: 10,
    fontSize: 13,
  },

  locatcov: {
    height: 30,
    width: 30,
    backgroundColor: Constants.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
});
