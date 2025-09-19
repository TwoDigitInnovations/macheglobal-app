import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Modal,
  Keyboard,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, { createRef, useContext, useEffect, useState } from 'react';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import Spinner from '../../Assets/Component/Spinner';
import {
  ApiFormData,
  GetApi,
  Post,
  Postwithimage,
} from '../../Assets/Helpers/Service';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
//   import Header from '../../Assets/Component/Header';
import { EditIcon, UploadIcon } from '../../../Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate, reset } from '../../../navigationRef';
import { LoadContext, ToastContext, UserContext } from '../../../App';
import { useIsFocused } from '@react-navigation/native';
import LocationDropdown2 from '../../Assets/Component/LocationDropdown2';
import GetCurrentAddressByLatLong from '../../Assets/Component/GetCurrentAddressByLatLong';
import Geolocation from 'react-native-geolocation-service';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const VendorForm = props => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [user, setuser] = useContext(UserContext);
  const [status, setStatus] = useState('');
  const [model, setmodel] = useState(false);
  const [userDetail, setUserDetail] = useState({
    username: '',
    store_name: '',
    address: '',
    country: '',
    number: '',
    store_doc: '',
    national_id_no: '',
    national_id: '',
  });

  const cameraRef = createRef();
  const cameraRef2 = createRef();

  const IsFocused = useIsFocused();
  useEffect(() => {
    if (IsFocused) {
      getProfile();

    }
  }, [IsFocused]);

  const getImageValue = async img => {
    ApiFormData(img.assets[0]).then(
      res => {
        console.log(res);

        if (res.status) {
          setUserDetail({
            ...userDetail,
            store_doc: res.data.file,
          });
        }
      },
      err => {
        console.log(err);
      },
    );
  };
  console.log('img', userDetail);
  const cancel = () => { };
  const getImageValue2 = async img => {
    ApiFormData(img.assets[0]).then(
      res => {
        console.log(res);

        if (res.status) {
          setUserDetail({
            ...userDetail,
            national_id: res.data.file,
          });
        }
      },
      err => {
        console.log(err);
      },
    );
  };
  // console.log('img', userDetail.img);
  const cancel2 = () => { };

  const getProfile = () => {
    setLoading(true);
    GetApi(`getProfile`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        // setUserDetail(res.driver);
        console.log(user)
        console.log(res.data)
        if (res.data.status === 'Verified') {
          const newdata = res.data
          newdata.token = user.token
          await AsyncStorage.setItem(
            'userDetail', JSON.stringify(newdata),
          );
          setuser(res.data);
          navigate('Vendortab');
        } else {
          CustomCurrentLocation();
          setmodel(true);
          setStatus(res.data.status);
          setUserDetail({
            username: res?.data?.username || '',
            store_name: res?.data?.store_name || '',
            address: res?.data?.address || '',
            country: res?.data?.country || '',
            number: res?.data?.number || '',
            store_doc: res?.data?.store_doc || '',
            national_id_no: res?.data?.national_id_no || '',
            national_id: res?.data?.national_id || '',
          });
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const submit = async () => {
    console.log(userDetail);
    if (
      userDetail.username === '' ||
      !userDetail.username ||
      userDetail.address === '' ||
      userDetail.country === '' ||
      userDetail.store_name === '' ||
      userDetail.number === '' ||
      userDetail.store_doc === '' ||
      userDetail.national_id_no === '' ||
      userDetail.national_id === ''
    ) {
      setSubmitted(true);
      return;
    }

    // const regex2 = /^[1-9]\d{9}$/;

    // if (regex2.test(userDetail.number)) {
    //   console.log('Valid mobile number');
    // } else {
    //   setToast([{error: true, message: 'Please enter a valid mobile number'}]);
    //   return;
    // }
    setLoading(true);
    Post('updateProfile', userDetail, {}).then(
      async res => {
        setLoading(false);
        console.log(res);

        if (res.status) {
          setToast(res.data.message);
          getProfile();
        } else {
        }
      },
      err => {
        setLoading(false);
        console.log(err);
        // setToast(res?.message);
        Toast.show({
          type: 'error',
          text1: err?.message || 'An error occurred',
        })
      },
    );
  };
  const getLocationVaue = (lat, add, set) => {
    console.log('lat=======>', lat);
    console.log('add=======>', add);
    setUserDetail({
      ...userDetail,
      address: add,
      location: {
        type: 'Point',
        coordinates: [lat.lng, lat.lat],
      },
    });
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
              error => {
                console.log(error.code, error.message);
                //   return error;
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
              // setlocation({
              //   latitude: position.coords.latitude,
              //   longitude: position.coords.longitude,
              //   latitudeDelta: 0.05,
              //   longitudeDelta: 0.05,
              // });
              GetCurrentAddressByLatLong({
                lat: position.coords.latitude,
                long: position.coords.longitude,
              }).then(res => {
                console.log('res===>', res);
                // setlocationadd(res.results[0].formatted_address);
                setUserDetail(pervdata => ({
                  ...pervdata,
                  address: res.results[0].formatted_address,
                  location: {
                    type: 'Point',
                    coordinates: [
                      position.coords.longitude,
                      position.coords.latitude,
                    ],
                  },
                }));
              });
            },
            error => {
              console.log(error.code, error.message);
              //   return error;
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
    <ScrollView
      style={[styles.container]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always">
      <Text style={styles.headtxt}>{t('Create store')}</Text>
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <Text style={styles.statustxt}>{t('Verification Status')} -</Text>
        <Text style={[styles.statustxt, { color: '#fab905', marginLeft: 3 }]}>
          {status}
        </Text>
      </View>
      <View style={[styles.textInput]}>
        <TextInput
          style={[styles.input]}
          placeholder={t("Enter Name")}
          value={userDetail?.username}
          onChangeText={username => setUserDetail({ ...userDetail, username })}
          placeholderTextColor={Constants.customgrey2}
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={[styles.jobtitle]}>{t('Full Name')}</Text>
        </View>
      </View>
      {submitted && (userDetail.username === '' || !userDetail.username) && (
        <Text style={styles.require}>{t('Name is required')}</Text>
      )}
      <View style={[styles.textInput]}>
        <TextInput
          style={[styles.input]}
          // autoCapitalize="characters"
          //   placeholder="Enter Name"
          placeholderTextColor={Constants.customgrey2}
          value={userDetail?.store_name}
          onChangeText={store_name =>
            setUserDetail({ ...userDetail, store_name: store_name })
          }
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={[styles.jobtitle]}>{t('Store Name')}</Text>
        </View>
      </View>
      {submitted &&
        (userDetail.store_name === '' || !userDetail.store_name) && (
          <Text style={styles.require}>{t('Store Name is required')}</Text>
        )}

      <View style={[styles.textInput]}>
        <TextInput
          style={[styles.input]}
          // placeholder="Enter Country"
          placeholderTextColor={Constants.customgrey2}
          value={userDetail?.country}
          onChangeText={country => setUserDetail({ ...userDetail, country })}
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={[styles.jobtitle]}>{t('Country')}</Text>
        </View>
      </View>
      {submitted && (userDetail.country === '' || !userDetail.country) && (
        <Text style={styles.require}>{t('Country is required')}</Text>
      )}
      <View style={[styles.textInput]}>
        {/* <TextInput
          style={[styles.input]}
          //   placeholder="Enter Name"
          placeholderTextColor={Constants.customgrey2}
          value={userDetail?.address}
          onChangeText={address => setUserDetail({...userDetail, address})}
        /> */}
        <LocationDropdown2
          value={userDetail?.address || ''}
          // focus={from === 'location'}
          // setIsFocus={setFrom}
          // from="location"
          getLocationVaue={(lat, add) => getLocationVaue(lat, add)}
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={[styles.jobtitle]}>{t('Address')}</Text>
        </View>
      </View>
      {submitted && (userDetail.address === '' || !userDetail.address) && (
        <Text style={styles.require}>{t('Address is required')}</Text>
      )}
      <View style={[styles.textInput]}>
        <TextInput
          style={[styles.input]}
          //   placeholder="Enter Name"
          // maxLength={10}
          placeholderTextColor={Constants.customgrey2}
          keyboardType="number-pad"
          value={userDetail?.number}
          onChangeText={number => setUserDetail({ ...userDetail, number })}
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={[styles.jobtitle]}>{t('Phone Number')}</Text>
        </View>
      </View>
      {submitted && (userDetail.number === '' || !userDetail.number) && (
        <Text style={styles.require}>{t('Number is required')}</Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          height: 100,
          marginVertical: 20,
          justifyContent: 'center',
        }}>
        <TouchableOpacity
          style={styles.uploadbox}
          onPress={() => {
            Keyboard.dismiss();
            setTimeout(() => {
              cameraRef.current.show();
            }, 100);
          }}>
          <UploadIcon color={Constants.saffron} height={'100%'} width={'100%'} />
          <Text style={styles.uploadtxt}>{t('Store Document')}</Text>
        </TouchableOpacity>
        <View style={styles.uploadimgbox}>
          {/* <Image
              source={require('../../Assets/Images/loginlogo.png')}
              style={styles.imgstyle2}
            /> */}
          {/* {userDetail?.dl_image?.uri && (
            <Image
              source={{
                uri: userDetail?.dl_image?.uri,
              }}
              style={styles.imgstyle2}
            />
          )} */}
          {userDetail?.store_doc && (
            <Image
              source={{
                uri: userDetail?.store_doc,
              }}
              style={styles.imgstyle2}
            />
          )}
        </View>
      </View>
      {submitted && !userDetail?.store_doc && (
        <Text style={styles.require}>{t('Store Document is required')}</Text>
      )}
      <View style={[styles.textInput]}>
        <TextInput
          style={[styles.input]}
          // autoCapitalize="characters"
          // placeholder="MH12AB1234"
          placeholderTextColor={Constants.customgrey2}
          value={userDetail?.national_id_no}
          onChangeText={national_id_no => {
            setUserDetail({
              ...userDetail,
              national_id_no: national_id_no,
            });
            console.log(userDetail.national_id_no);
          }}
        />

        <View style={[styles.mylivejobtitle]}>
          <Text style={[styles.jobtitle]}>{t('National Id Number')}</Text>
        </View>
      </View>
      {submitted &&
        (userDetail.national_id_no === '' || !userDetail.national_id_no) && (
          <Text style={styles.require}>{t('National Id Number is required')}</Text>
        )}

      <View style={{ flexDirection: 'row', height: 100, marginVertical: 20 }}>
        <TouchableOpacity
          style={styles.uploadbox}
          onPress={() => {
            Keyboard.dismiss();
            setTimeout(() => {
              cameraRef2.current.show();
            }, 100);
          }}>
          {/* <Image
            source={require('../../Assets/Images/upload.png')}
            style={styles.imgstyle}
          /> */}
          <UploadIcon color={Constants.saffron} height={'100%'} width={'100%'} />
          <Text style={styles.uploadtxt}>{t('Upload National ID')}</Text>
        </TouchableOpacity>
        <View style={styles.uploadimgbox}>
          {/* {userDetail?.number_plate_image?.uri && (
            <Image
              source={{
                uri: `${userDetail.number_plate_image.uri}`,
              }}
              style={styles.imgstyle2}
            />
          )} */}
          {userDetail?.national_id && (
            <Image
              source={{
                uri: `${userDetail.national_id}`,
              }}
              style={styles.imgstyle2}
            />
          )}
        </View>
      </View>

      {submitted && !userDetail?.national_id && (
        <Text style={styles.require}>{t('National ID is required')}</Text>
      )}

      {/* {userDetail?.number_plate_image?.uri&&  <Image source=
      {{
        uri: `${userDetail.number_plate_image.uri}`,
      }}
      style={{height:50,width:50}}
    // : require('../../Assets/Images/profile.png')
    />} */}

      <TouchableOpacity style={styles.signInbtn} onPress={() => submit()}>
        <Text style={styles.buttontxt}>{t('Submit')}</Text>
      </TouchableOpacity>

      <Modal transparent={true} visible={model} animationType="slide">
        <View
          style={{
            justifyContent: 'center',
            flex: 1,
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
          <View style={styles.modal}>
            <View style={styles.box2}>
              <Text style={styles.modtxt}>
                {t('Please fill all the details. We will verify them within 3 to 5 business days. Kindly wait until the verification process is complete. Thank you for your patience.')}
              </Text>
              <TouchableOpacity
                style={styles.button2}
                onPress={() => {
                  setmodel(false);
                }}>
                <Text style={styles.buttontxt2}>{t('Ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CameraGalleryPeacker
        refs={cameraRef}
        getImageValue={getImageValue}
        base64={false}
        cancel={cancel}
      />
      <CameraGalleryPeacker
        refs={cameraRef2}
        getImageValue={getImageValue2}
        base64={false}
        cancel={cancel2}
      />
    </ScrollView>
  );
};

export default VendorForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
    padding: 20,
  },
  textInput: {
    borderColor: Constants.customgrey,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    // width: 370,
    height: 60,
    marginTop: 40,
    flexDirection: 'row',
  },
  input: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.Medium,
    color: Constants.black,
    flex: 1,
  },
  signInbtn: {
    height: 60,
    // width: 370,
    borderRadius: 30,
    backgroundColor: Constants.saffron,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  mylivejobtitle: {
    position: 'absolute',
    backgroundColor: Constants.white,
    paddingHorizontal: 5,
    top: -10,
    left: 30,
  },
  jobtitle: {
    color: Constants.black,
    fontSize: 13,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  headtxt: {
    color: Constants.black,
    fontSize: 22,
    fontFamily: FONTS.Bold,
  },
  statustxt: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  aliself: {
    alignSelf: 'center',
  },
  require: {
    color: Constants.red,
    fontFamily: FONTS.Medium,
    marginLeft: 10,
    fontSize: 14,
    marginTop: 10,
  },
  imgstyle: {
    height: '80%',
    width: '80%',
    // flex:1,
    resizeMode: 'contain',
  },
  imgstyle2: {
    height: '100%',
    width: '100%',
    // flex:1,
    resizeMode: 'contain',
  },
  uploadbox: {
    flex: 1,
    alignItems: 'center',
    // backgroundColor:Constants.red
  },
  uploadimgbox: {
    flex: 1,
    alignItems: 'center',
    // backgroundColor:Constants.red
  },
  uploadtxt: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Bold,
    textAlign: 'center',
  },

  ///model///
  modal: {
    // height: '40%',
    width: '85%',
    backgroundColor: Constants.white,
    borderRadius: 5,
  },
  box2: {
    padding: 20,
    // alignItems:'center',
    // justifyContent:'center'
  },
  modtxt: {
    fontSize: 20,
    color: Constants.black,
    fontWeight: '500',
    textAlign: 'center',
  },
  button2: {
    backgroundColor: Constants.saffron,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    // marginBottom: 10,
    borderRadius: 10,
  },
  buttontxt2: {
    color: Constants.white,
    fontSize: 18,
  },
});
