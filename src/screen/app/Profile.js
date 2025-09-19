import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import React, { createRef, useContext, useEffect, useState } from 'react';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import { BackIcon, EditIcon } from '../../../Theme';
import Spinner from '../../Assets/Component/Spinner';
import { ApiFormData, GetApi, Post } from '../../Assets/Helpers/Service';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
import { LoadContext, ToastContext, UserContext } from '../../../App';
import Header from '../../Assets/Component/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goBack } from '../../../navigationRef';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const Profile = props => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  // const [loading, setLoading] = useState(false);
  const [user, setuser] = useContext(UserContext);
  const [otpfield, setotpfield] = useState(false);
  const [edit, setEdit] = useState(false);
  const [otpval, setotpval] = useState({
    otp: '',
  });
  const [userDetail, setUserDetail] = useState({
    email: '',
    username: '',
    number: '',
    img: '',
  });
  useEffect(() => {
    getProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cameraRef = createRef();
  const getImageValue = async img => {
    console.log(img)
    ApiFormData(img.assets[0]).then(
      res => {
        console.log(res);

        if (res.status) {
          setEdit(true);
          setUserDetail({
            ...userDetail,
            img: res.data.file,
          });
        }
      },
      err => {
        setEdit(false);
        console.log(err);
      },
    );
  };
  console.log('img', userDetail.img);
  const cancel = () => {
    setEdit(false);
    cameraRef.current?.hide()

  };
  const getProfile = () => {
    setLoading(true);
    GetApi(`getProfile`, { ...props }).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          // setprofile(res?.data || {});
          // await AsyncStorage.setItem('profilePic', res?.data?.profile || '');
          // setImage(res?.data?.profile || '');

          setUserDetail({
            email: res.data.email,
            username: res.data.username,
            number: res.data.number,
            img: res.data.profile,
          });
          setuser({ ...user, ...res.data });
          // setVerified(res.data.verified);
        } else {
          // setToast(res.message);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const submit = () => {
    console.log(userDetail);
    if (
      userDetail.username === '' ||
      userDetail.number === ''
      // || userDetail.email === ''
    ) {
      setSubmitted(true);
      return;
    }

    const emailcheck = checkEmail(userDetail.email);
    if (!emailcheck) {
      Toast.show({
        type: 'error',
        text1: t('Your email id is invalid'),
      })

      return;
    }

    const data = {
      userId: user._id,
      email: userDetail.email.toLowerCase(),
      username: userDetail.username,
      number: userDetail.number,
    };
    // {userDetail.otp&& data.otp=userDetail.otp}
    if (otpval.otp) {
      data.otp = otpval.otp;
    }
    if (userDetail.img) {
      data.profile = userDetail.img;
    }
    console.log('data==========>', data);
    setLoading(true);
    Post('updateprofile', data, { ...props }).then(
      async res => {
        setLoading(false);
        console.log(res);

        if (res.status) {
          // await AsyncStorage.setItem('userDetail', JSON.stringify(res.data));
          setToast(res.data.message);

          await AsyncStorage.setItem(
            'userDetail', JSON.stringify(res.data),
          );
          setuser(res.data)

          if (res.data?.otp) {
            setotpfield(true);
            setEdit(true);
          } else {
            setEdit(false);
            setotpfield(false);
            getProfile();
            setotpval({ otp: '' });
          }
        } else {
          setToast(res.message);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
    // }
  };

  const editUpdate = () => {
    setEdit(true);
  };
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Constants.white }]}>
      <View style={styles.toppart}>
        <BackIcon color={Constants.white} onPress={() => goBack()} />
        <Text style={styles.carttxt}>{t('Profile')}</Text>
        {edit ? <Text style={styles.addbtn} onPress={submit}>{t('Update Profile')}</Text> :
          <Text style={styles.addbtn} onPress={() => {
            setEdit(true);
          }}>{t('Edit Profile')}</Text>}
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* <Spinner color={'#fff'} visible={loading} /> */}
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
              onPress={() => cameraRef.current.show()}>
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
        <View
          style={[
            styles.card,
            styles.shadowProp,
            { backgroundColor: Constants.white },
            { shadowColor: Constants.black },
          ]}>
          <View style={[styles.textInput, { borderColor: Constants.customgrey }]}>
            <TextInput
              style={[styles.input, { color: Constants.black }]}
              placeholder={t('Enter Name')}
              placeholderTextColor={Constants.customgrey}
              editable={edit}
              value={userDetail?.username}
              onChangeText={username =>
                setUserDetail({ ...userDetail, username })
              }
            />
            <View
              style={[
                styles.mylivejobtitle,
                { backgroundColor: Constants.white },
              ]}>
              <Text style={[styles.jobtitle, { color: Constants.black }]}>
                {t('Name')}
              </Text>
            </View>
          </View>
          {submitted && userDetail.username === '' && (
            <Text style={{ color: 'red' }}>{t('Name is required')}</Text>
          )}
          <View style={[styles.textInput, { borderColor: Constants.customgrey }]}>
            <TextInput
              style={[styles.input, { color: Constants.black }]}
              placeholder={t('Enter Phone Number')}
              placeholderTextColor={Constants.customgrey}
              editable={edit}
              value={userDetail?.number}
              onChangeText={number => setUserDetail({ ...userDetail, number })}
            />
            <View
              style={[
                styles.mylivejobtitle,
                { backgroundColor: Constants.white },
              ]}>
              <Text style={[styles.jobtitle, { color: Constants.black }]}>
                {t('Phone Number')}
              </Text>
            </View>
          </View>
          {submitted && userDetail.number === '' && (
            <Text style={{ color: 'red' }}>{t('Number is required')}</Text>
          )}
          <View style={[styles.textInput, { borderColor: Constants.customgrey }]}>
            <TextInput
              style={[styles.input, { color: Constants.black }]}
              placeholder={t("Enter email")}
              placeholderTextColor={Constants.customgrey}
              editable={edit}
              value={userDetail?.email}
              onChangeText={email => setUserDetail({ ...userDetail, email })}
            />
            <View
              style={[
                styles.mylivejobtitle,
                { backgroundColor: Constants.white },
              ]}>
              <Text style={[styles.jobtitle, { color: Constants.black }]}>
                {t('Email')}
              </Text>
            </View>
          </View>
          {submitted && userDetail.email === '' && (
            <Text style={{ color: 'red' }}>{t('Email is required')}</Text>
          )}

          {otpfield && (
            <View
              style={[styles.textInput, { borderColor: Constants.customgrey }]}>
              <TextInput
                style={[styles.input, { color: Constants.black }]}
                placeholder={t("Enter otp")}
                placeholderTextColor={Constants.customgrey}
                value={otpval.otp}
                onChangeText={otp => setotpval({ ...otpval, otp })}
                keyboardType="number-pad"
              />
              <View
                style={[
                  styles.mylivejobtitle,
                  { backgroundColor: Constants.white },
                ]}>
                <Text style={[styles.jobtitle, { color: Constants.black }]}>
                  {t('OTP')}
                </Text>
              </View>
            </View>
          )}
        </View>
        {/* {edit ? (
        <TouchableOpacity style={styles.signInbtn} onPress={submit}>
          <Text style={styles.buttontxt}>Update Profile</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.signInbtn}
          onPress={() => {
            setEdit(true);
          }}>
          <Text style={styles.buttontxt}>Edit Profile</Text>
        </TouchableOpacity>
      )} */}
        <CameraGalleryPeacker
          refs={cameraRef}
          getImageValue={getImageValue}
          base64={false}
          cancel={cancel}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Constants.white,
    // padding: 20,
  },
  logo: {
    height: 120,
    width: 120,
    alignSelf: 'center',
    borderRadius: 60,
    marginTop: 20,
  },
  textInput: {
    // borderColor: Constants.customgrey,
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
    textAlign: 'left',
    // color: Constants.black,
    flex: 1,
  },
  signInbtn: {
    height: 60,
    // width: 370,
    borderRadius: 10,
    backgroundColor: Constants.lightblue,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  mylivejobtitle: {
    position: 'absolute',
    // backgroundColor: Constants.white,
    paddingHorizontal: 5,
    top: -13,
    left: 30,
  },
  jobtitle: {
    // color: Constants.black,
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
    textAlign: 'center',
    fontWeight: '500',
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
  shadowProp: {
    // shadowColor: Constants.black,
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    // backgroundColor: Constants.white,
    borderRadius: 10,
    paddingTop: 15,
    paddingBottom: 45,
    paddingHorizontal: 15,
    // width: '90%',
    marginVertical: 20,
    // alignSelf: 'center',
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
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
});
