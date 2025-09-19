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
import { ApiFormData, GetApi, Post } from '../../Assets/Helpers/Service';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
//   import Header from '../../Assets/Component/Header';
import { UploadIcon } from '../../../Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate, reset } from '../../../navigationRef';
import { LoadContext, ToastContext, UserContext } from '../../../App';
import { useIsFocused } from '@react-navigation/native';
import LocationDropdown2 from '../../Assets/Component/LocationDropdown2';
import Geolocation from 'react-native-geolocation-service';
import GetCurrentAddressByLatLong from '../../Assets/Component/GetCurrentAddressByLatLong';
import { useTranslation } from 'react-i18next';
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import Toast from 'react-native-toast-message';

const Driverform = props => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [user, setuser] = useContext(UserContext);
  const [status, setStatus] = useState('');
  const [model, setmodel] = useState(false);
  const [userDetail, setUserDetail] = useState({
    username: '',
    dl_number: '',
    address: '',
    country: '',
    number_plate_no: '',
    number: '',
    dl_image: '',
    number_plate_image: '',
    address_support_letter: '',
    national_id_no: '',
    national_id: '',
    background_check_document: '',
  });

  const cameraRef = createRef();
  const cameraRef2 = createRef();
  const cameraRef3 = createRef();
  const cameraRef4 = createRef();

  const IsFocused = useIsFocused();
  useEffect(() => {
    if (IsFocused) {
      getProfile();
    }
  }, [IsFocused]);

  useEffect(() => {
    setmodel(true);
  }, []);

  const getImageValue = async img => {
    ApiFormData(img.assets[0]).then(
      res => {
        console.log(res);

        if (res.status) {
          setUserDetail({
            ...userDetail,
            dl_image: res.data.file,
          });
        }
      },
      err => {
        console.log(err);
      },
    );
  };

  const cancel = () => { };

  // Camera permission functions
  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.CAMERA);
        return {
          granted: result === 'granted',
          blocked: result === 'blocked'
        };
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return {
          granted: granted === PermissionsAndroid.RESULTS.GRANTED,
          blocked: granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        };
      }
    } catch (err) {
      console.warn('Camera permission error:', err);
      return { granted: false, blocked: false };
    }
  };

  const handleCameraOpen = async (cameraRefParam) => {
    const permission = await requestCameraPermission();
    if (permission.granted) {
      Keyboard.dismiss();
      setTimeout(() => {
        cameraRefParam.current.show();
      }, 100);
    } else if (permission.blocked) {
      // Permission is permanently denied, show alert to go to settings
      Toast.show({
        type: 'error',
        text1: t('Camera permission is required. Please enable it in app settings.'),
      })
      setTimeout(() => {
        openSettings();
      }, 2000);
    } else {
      // Permission denied but not permanently, user can try again
      Toast.show({
        type: 'error',
        text1: t('Camera permission is required to upload images'),
      })
    }
  };
  const getImageValue2 = async img => {
    ApiFormData(img.assets[0]).then(
      res => {
        console.log(res);

        if (res.status) {
          setUserDetail({
            ...userDetail,
            number_plate_image: res.data.file,
          });
        }
      },
      err => {
        console.log(err);
      },
    );
  };
  const getImageValue3 = async img => {
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
  const getImageValue4 = async img => {
    ApiFormData(img.assets[0]).then(
      res => {
        console.log(res);

        if (res.status) {
          setUserDetail({
            ...userDetail,
            background_check_document: res.data.file,
          });
        }
      },
      err => {
        console.log(err);
      },
    );
  };

  const getProfile = () => {
    setLoading(true);
    GetApi(`getProfile`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        // setUserDetail(res.driver);
        console.log(user);
        console.log(res.data);
        if (res.data.status === 'Verified') {
          const newdata = res.data;
          newdata.token = user.token;
          await AsyncStorage.setItem('userDetail', JSON.stringify(newdata));
          setuser(res.data);
          navigate('Drivertab');
        } else {
          setmodel(true);
          setStatus(res.data.status);
          setUserDetail(res?.data);
          if (res.data?.address === '' || !res.data?.address) {
            CustomCurrentLocation();
          }
          // setUserDetail({
          //   username: res?.data?.username || '',
          //   store_name: res?.data?.store_name || '',
          //   address: res?.data?.address || '',
          //   country: res?.data?.country || '',
          //   number: res?.data?.number || '',
          //   store_doc: res?.data?.store_doc || '',
          //   national_id_no: res?.data?.national_id_no || '',
          //   national_id: res?.data?.national_id || '',
          // });
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const submit = async () => {
    if (
      userDetail.username === '' || !userDetail.username ||
      userDetail.address === '' || !userDetail.address ||
      userDetail.country === '' || !userDetail.country ||
      userDetail.dl_image === '' || !userDetail.dl_image ||
      userDetail.dl_number === '' || !userDetail.dl_number ||
      userDetail.number_plate_image === '' || !userDetail.number_plate_image ||
      userDetail.number_plate_no === '' || !userDetail.number_plate_no ||
      userDetail.number === '' || !userDetail.number ||
      userDetail.address_support_letter === '' || !userDetail.address_support_letter ||
      userDetail.national_id_no === '' || !userDetail.national_id_no ||
      userDetail.national_id === '' || !userDetail.national_id ||
      userDetail.background_check_document === '' || !userDetail.background_check_document
    ) {
      setSubmitted(true);
      return;
    }
    console.log(userDetail)
    setLoading(true);
    Post('updateProfile', userDetail, {}).then(
      async res => {
        setLoading(false);
        console.log(res);

        if (res.status) {
          // setToast(res.data.message);
          getProfile();
          setToast('Profile updated successfully');
        } else {
          setToast(res?.message);
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
    // setUserDetail({
    //   ...userDetail,
    //   address: add,
    //   // shop_lat: lat.lat,
    //   // shop_long: lat.lng,
    // });
    setUserDetail(pervdata => ({
      ...pervdata,
      address: add,
      location: {
        type: 'Point',
        coordinates: [
          lat.lng,
          lat.lat,
        ],
      },
    }));
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
      <Text style={styles.headtxt}>{t('Driver Account')}</Text>
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
          placeholderTextColor={Constants.customgrey2}
          value={userDetail?.dl_number}
          onChangeText={dl_number =>
            setUserDetail({ ...userDetail, dl_number: dl_number })
          }
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={[styles.jobtitle]}>{t('DL Number')}</Text>
        </View>
      </View>
      {submitted && (userDetail.dl_number === '' || !userDetail.dl_number) && (
        <Text style={styles.require}>{('Dl number is required')}</Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          height: 100,
          marginTop: 20, marginBottom: 30,
          justifyContent: 'center',
        }}>
        <TouchableOpacity
          style={styles.uploadbox}
          onPress={() => handleCameraOpen(cameraRef)}>
          {/* <Image
            source={require('../../Assets/Images/upload.png')}
            style={styles.imgstyle}
          /> */}
          <UploadIcon color={Constants.saffron} height={'100%'} width={'100%'} />
          <Text style={styles.uploadtxt}>{t('Upload License')}</Text>
        </TouchableOpacity>
        <View style={styles.uploadimgbox}>
          {userDetail?.dl_image && (
            <Image
              source={{
                uri: userDetail?.dl_image,
              }}
              style={styles.imgstyle2}
            />
          )}
        </View>
      </View>
      {submitted && !userDetail?.dl_image && (
        <Text style={styles.require}>{('License image is required')}</Text>
      )}
      <View style={[styles.textInput]}>
        <TextInput
          style={[styles.input]}
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
          value={userDetail?.address_support_letter}
          onChangeText={address_support_letter =>
            setUserDetail({ ...userDetail, address_support_letter })
          }
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={[styles.jobtitle]}>{t('Address support letter')}</Text>
        </View>
      </View>
      {submitted &&
        (userDetail.address_support_letter === '' ||
          !userDetail.address_support_letter) && (
          <Text style={styles.require}>{t('Address support letter is required')}</Text>
        )}
      <View style={[styles.textInput]}>
        <TextInput
          style={[styles.input]}
          //   placeholder="Enter Name"
          maxLength={10}
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
      <View style={[styles.textInput]}>
        <TextInput
          style={[styles.input]}
          value={userDetail?.number_plate_no}
          onChangeText={number_plate_no => {
            setUserDetail({
              ...userDetail,
              number_plate_no: number_plate_no,
            });
            console.log(userDetail.number_plate_no);
          }}
        />

        <View style={[styles.mylivejobtitle]}>
          <Text style={[styles.jobtitle]}>{t('Number Plate')}</Text>
        </View>
      </View>
      {submitted &&
        (userDetail.number_plate_no === '' || !userDetail.number_plate_no) && (
          <Text style={styles.require}>{t('Number plate is required')}</Text>
        )}
      <View style={{ flexDirection: 'row', height: 100, marginTop: 20, marginBottom: 30 }}>
        <TouchableOpacity
          style={styles.uploadbox}
          onPress={() => handleCameraOpen(cameraRef2)}>
          <UploadIcon color={Constants.saffron} height={'100%'} width={'100%'} />
          <Text style={styles.uploadtxt}>{t('Number plate image')}</Text>
        </TouchableOpacity>
        <View style={styles.uploadimgbox}>
          {userDetail?.number_plate_image && (
            <Image
              source={{
                uri: `${userDetail.number_plate_image}`,
              }}
              style={styles.imgstyle2}
            />
          )}
        </View>
      </View>

      {submitted && !userDetail?.number_plate_image && (
        <Text style={styles.require}>{t('Number plate image is required')}</Text>
      )}

      <View style={[styles.textInput]}>
        <TextInput
          style={[styles.input]}
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
          <Text style={[styles.jobtitle]}>{t('National ID card number')}</Text>
        </View>
      </View>
      {submitted &&
        (userDetail.national_id_no === '' ||
          !userDetail.national_id_no) && (
          <Text style={styles.require}>
            {t('National ID card number is required')}
          </Text>
        )}

      <View style={{ flexDirection: 'row', height: 100, marginTop: 20, marginBottom: 30 }}>
        <TouchableOpacity
          style={styles.uploadbox}
          onPress={() => handleCameraOpen(cameraRef3)}>
          <UploadIcon color={Constants.saffron} height={'100%'} width={'100%'} />
          <Text style={styles.uploadtxt}>{t('National ID Card image')}</Text>
        </TouchableOpacity>
        <View style={styles.uploadimgbox}>
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
        <Text style={styles.require}>{t('National ID Card image is required')}</Text>
      )}
      <View style={{ flexDirection: 'row', height: 100, marginTop: 20, marginBottom: 30 }}>
        <TouchableOpacity
          style={styles.uploadbox}
          onPress={() => handleCameraOpen(cameraRef4)}>
          <UploadIcon color={Constants.saffron} height={'100%'} width={'100%'} />
          <Text style={styles.uploadtxt}>{t('Insurance card image')}</Text>
        </TouchableOpacity>
        <View style={styles.uploadimgbox}>
          {userDetail?.background_check_document && (
            <Image
              source={{
                uri: `${userDetail.background_check_document}`,
              }}
              style={styles.imgstyle2}
            />
          )}
        </View>
      </View>

      {submitted && !userDetail?.background_check_document && (
        <Text style={styles.require}>
          {('Background check document image is required')}
        </Text>
      )}

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
                {t('Please be patient, we will verify your details within 3 to 5 business days. Kindly wait until the verification process is complete. Thank you for your patience.')}
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
        cancel={cancel}
      />
      <CameraGalleryPeacker
        refs={cameraRef3}
        getImageValue={getImageValue3}
        base64={false}
        cancel={cancel}
      />
      <CameraGalleryPeacker
        refs={cameraRef4}
        getImageValue={getImageValue4}
        base64={false}
        cancel={cancel}
      />
    </ScrollView>
  );
};

export default Driverform;

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
    textAlign: 'left'
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
    fontFamily: FONTS.Medium,
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
    fontFamily: FONTS.Medium,
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
