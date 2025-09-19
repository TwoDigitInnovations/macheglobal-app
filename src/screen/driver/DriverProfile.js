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
  Pressable,
} from 'react-native';
import React, { createRef, useContext, useEffect, useState } from 'react';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import Spinner from '../../Assets/Component/Spinner';
import { ApiFormData, GetApi, Post } from '../../Assets/Helpers/Service';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
//   import Header from '../../Assets/Component/Header';
import { BackIcon, EditIcon, UploadIcon } from '../../../Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goBack, navigate, reset } from '../../../navigationRef';
import { LoadContext, ToastContext, UserContext } from '../../../App';
import { useIsFocused } from '@react-navigation/native';
import LocationDropdown2 from '../../Assets/Component/LocationDropdown2';
import Geolocation from 'react-native-geolocation-service';
import GetCurrentAddressByLatLong from '../../Assets/Component/GetCurrentAddressByLatLong';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const DriverProfile = props => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [user, setuser] = useContext(UserContext);
  const [status, setStatus] = useState('');
  const [model, setmodel] = useState(false);
  const [edit, setEdit] = useState(false);
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
  const cameraRef5 = createRef();

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
  const getImageValue5 = async img => {
    ApiFormData(img.assets[0]).then(
      res => {
        console.log(res);

        if (res.status) {
          setUserDetail({
            ...userDetail,
            img: res.data.file,
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
        if (res.status) {
          setUserDetail(res.data)
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
      userDetail.username === '' ||
      !userDetail.username ||
      userDetail.address === '' ||
      !userDetail.address ||
      userDetail.country === '' ||
      !userDetail.country ||
      userDetail.dl_image === '' ||
      !userDetail.dl_image ||
      userDetail.dl_number === '' ||
      !userDetail.dl_number ||
      userDetail.number_plate_image === '' ||
      !userDetail.number_plate_image ||
      userDetail.number_plate_no === '' ||
      !userDetail.number_plate_no ||
      userDetail.number === '' ||
      !userDetail.number ||
      userDetail.address_support_letter === '' ||
      !userDetail.address_support_letter ||
      userDetail.national_id_no === '' ||
      !userDetail.national_id_no ||
      userDetail.national_id === '' ||
      !userDetail.national_id ||
      userDetail.background_check_document === '' ||
      !userDetail.background_check_document
    ) {
      setSubmitted(true);
      return;
    }
    console.log(userDetail);
    setLoading(true);
    Post('updateProfile', userDetail, {}).then(
      async res => {
        setLoading(false);
        console.log(res);

        if (res.status) {
          setEdit(false)
          await AsyncStorage.setItem(
            'userDetail', JSON.stringify(res.data),
          );
          setuser(res.data)
          getProfile();
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
  console.log('userdetail', userDetail)
  return (
    <SafeAreaView style={[styles.container]}>
      <View style={styles.toppart}>
        <BackIcon color={Constants.white} onPress={() => goBack()} />
        <Text style={styles.carttxt}>{('Profile')} </Text>
        {edit ? (
          <Text style={styles.addbtn} onPress={submit}>
            {t('Update Profile')}
          </Text>
        ) : (
          <Text
            style={styles.addbtn}
            onPress={() => {
              setEdit(true);
            }}>
            {t('Edit Profile')}
          </Text>
        )}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        style={{ paddingHorizontal: 20 }}>
        <View
          style={{
            height: 120,
            width: 120,
            alignSelf: 'center',
            position: 'relative',
            zIndex: 9,
            marginBottom: 20,
          }}>
          {edit && (
            <Pressable
              style={styles.editiconcov}
              onPress={() => cameraRef5.current.show()}>
              <EditIcon height={15} color={Constants.white} />
            </Pressable>
          )}
          <Image
            // source={require('../../Assets/Images/profile.png')}
            source={
              userDetail?.img
                ? {
                  uri: `${userDetail.img}`,
                }
                : require('../../Assets/Images/profile.png')
            }
            style={styles.logo}
          />
        </View>

        <View style={[styles.textInput]}>
          <TextInput
            style={[styles.input]}
            editable={edit}
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
            editable={edit}
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
        {submitted &&
          (userDetail.dl_number === '' || !userDetail.dl_number) && (
            <Text style={styles.require}>{t('Dl number is required')}</Text>
          )}
        <View
          style={{
            flexDirection: 'row',
            height: 100,
            marginTop: 20,
            marginBottom: 30,
            justifyContent: 'center',
          }}>
          <TouchableOpacity
            style={styles.uploadbox}
            onPress={() => {
              Keyboard.dismiss();
              setTimeout(() => {
                edit && cameraRef.current.show();
              }, 100);
            }}>
            {/* <Image
              source={require('../../Assets/Images/upload.png')}
              style={styles.imgstyle}
            /> */}
            <UploadIcon
              color={Constants.saffron}
              height={'100%'}
              width={'100%'}
            />
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
          <Text style={styles.require}>{t('License image is required')}</Text>
        )}
        <View style={[styles.textInput]}>
          <TextInput
            style={[styles.input]}
            editable={edit}
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
            editable={edit}
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
            <Text style={styles.require}>
              {t('Address support letter is required')}
            </Text>
          )}
        <View style={[styles.textInput]}>
          <TextInput
            style={[styles.input]}
            editable={edit}
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
            editable={edit}
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
          (userDetail.number_plate_no === '' ||
            !userDetail.number_plate_no) && (
            <Text style={styles.require}>{t('Number plate is required')}</Text>
          )}
        <View
          style={{
            flexDirection: 'row',
            height: 100,
            marginTop: 20,
            marginBottom: 30,
          }}>
          <TouchableOpacity
            style={styles.uploadbox}
            onPress={() => {
              Keyboard.dismiss();
              setTimeout(() => {
                edit && cameraRef2.current.show();
              }, 100);
            }}>
            <UploadIcon
              color={Constants.saffron}
              height={'100%'}
              width={'100%'}
            />
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
            editable={edit}
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
          (userDetail.national_id_no === '' || !userDetail.national_id_no) && (
            <Text style={styles.require}>
              {t('National ID card number is required')}
            </Text>
          )}

        <View
          style={{
            flexDirection: 'row',
            height: 100,
            marginTop: 20,
            marginBottom: 30,
          }}>
          <TouchableOpacity
            style={styles.uploadbox}
            onPress={() => {
              Keyboard.dismiss();
              setTimeout(() => {
                edit && cameraRef3.current.show();
              }, 100);
            }}>
            <UploadIcon
              color={Constants.saffron}
              height={'100%'}
              width={'100%'}
            />
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
        <View style={{ marginBottom: 30 }}>
          <View
            style={{
              flexDirection: 'row',
              height: 100,
              marginTop: 20,
              marginBottom: 30,
            }}>
            <TouchableOpacity
              style={styles.uploadbox}
              onPress={() => {
                Keyboard.dismiss();
                setTimeout(() => {
                  edit && cameraRef4.current.show();
                }, 100);
              }}>
              <UploadIcon
                color={Constants.saffron}
                height={'100%'}
                width={'100%'}
              />
              <Text style={styles.uploadtxt}>
                {t('Background check document image')}
              </Text>
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
              {t('Background check document image is required')}
            </Text>
          )}
        </View>
        {/* <TouchableOpacity style={styles.signInbtn} onPress={() => submit()}>
          <Text style={styles.buttontxt}>Submit</Text>
        </TouchableOpacity> */}

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
        <CameraGalleryPeacker
          refs={cameraRef5}
          getImageValue={getImageValue5}
          base64={false}
          cancel={cancel}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
    //   padding: 20,
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
  addbtn: {
    backgroundColor: Constants.pink,
    color: Constants.white,
    paddingHorizontal: 25,
    paddingVertical: 7,
    borderRadius: 15,
    fontSize: 16,
    fontFamily: FONTS.Bold,
    marginTop: 5,
    borderWidth: 1,
    borderColor: Constants.white,
  },
  carttxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    marginLeft: 10,
  },
  logo: {
    height: 120,
    width: 120,
    alignSelf: 'center',
    borderRadius: 60,
    marginTop: 20,
  },
  editiconcov: {
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: Constants.customblue,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    // marginTop: 115,
    right: -5,
    bottom: 0,
    zIndex: 9,
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
