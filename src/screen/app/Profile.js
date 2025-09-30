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
  const getImageValue = async (img) => {
    console.log('Image selected:', img);
    if (!img?.assets?.[0]?.uri) {
      console.log('No image URI found');
      setToast('No image selected');
      return;
    }

    setLoading(true);
    
    try {
      const imageUri = img.assets[0].uri;
      const imageType = img.assets[0].type || 'image/jpeg';
      const imageName = img.assets[0].fileName || `profile_${Date.now()}.jpg`;
      
      console.log('Preparing image for upload:', { imageUri, imageType, imageName });
      
      // Prepare the image data for ApiFormData
      const imageData = {
        uri: imageUri,
        type: imageType,
        name: imageName,
        fileName: imageName
      };
      
      console.log('Uploading image to server...');
      const res = await ApiFormData(imageData);
      
      console.log('Image upload response:', res);
      
      if (res?.status && res?.data?.fileUrl) {
        const fileUrl = res.data.fileUrl;
        console.log('Image uploaded successfully:', fileUrl);
        
        // Update local state
        setUserDetail(prev => ({
          ...prev,
          img: fileUrl
        }));
        
        // Update context and AsyncStorage
        const userData = await AsyncStorage.getItem('userDetail');
        if (userData) {
          const currentUser = JSON.parse(userData);
          const updatedUser = {
            ...currentUser,
            user: {
              ...(currentUser.user || {}),
              avatar: fileUrl
            }
          };
          await AsyncStorage.setItem('userDetail', JSON.stringify(updatedUser));
          setuser(updatedUser);
        }
        
        setToast('Profile picture updated successfully');
        return fileUrl;
      } else {
        const errorMsg = res?.message || 'Failed to upload profile picture';
        console.error('Upload failed:', errorMsg);
        setToast(errorMsg);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setToast('Error uploading profile picture');
    } finally {
      setLoading(false);
    }
  };
  console.log('img', userDetail.img);
  const cancel = () => {
    setEdit(false);
    cameraRef.current?.hide()

  };
  const getProfile = async () => {
    try {
      setLoading(true);
      // Try getting the profile data from the user context first
      const userData = await AsyncStorage.getItem('userDetail');
      const userDetail = userData ? JSON.parse(userData) : null;
      
      if (userDetail?.user) {
        console.log('Using user data from context:', userDetail.user);
        setUserDetail({
          email: userDetail.user.email,
          username: userDetail.user.name,
          number: userDetail.user.phone,
          img: userDetail.user.avatar || userDetail.user.profile
        });
        
        // Also update the user state if needed
        if (setuser) {
          setuser(prev => ({ ...prev, ...userDetail.user }));
        }
      } else {
        // Fallback to API if user data is not in context
        console.log('Fetching profile from API...');
        const res = await GetApi('user/profile');
        console.log('Profile API Response:', res);
        
        if (res?.success) {
          const profileData = {
            email: res.data.email,
            username: res.data.name,
            number: res.data.phone,
            img: res.data.avatar || res.data.profile
          };
          
          setUserDetail(profileData);
          
          // Update the user state if needed
          if (setuser) {
            setuser(prev => ({ ...prev, ...res.data }));
          }
        } else {
          console.error('Failed to fetch profile:', res?.message || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Error in getProfile:', error);
    } finally {
      setLoading(false);
    }
  };
  const submit = async () => {
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
      userId: user?.user?._id,
      name: userDetail.username,
      phone: userDetail.number,
      email: userDetail.email,
      // Include avatar URL if available
      avatar: userDetail.img || user?.user?.avatar || ''
    };
    
    if (otpval.otp) {
      data.otp = otpval.otp;
    }
    
    // For backward compatibility
    if (userDetail.img) {
      data.profile = userDetail.img;
    }
    
    console.log('data==========>', data);
    setLoading(true);
    
   
    const endpoints = ['auth/updateProfile'];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const res = await Post(endpoint, data, { ...props });
        console.log('Update response:', res);

        if (res?.status || res?.success) {
          const responseData = res.data || res;
          setToast(responseData.message || 'Profile updated successfully');

         
          const userData = await AsyncStorage.getItem('userDetail');
          const currentUser = userData ? JSON.parse(userData) : {};
          
         
          const updatedUser = {
            ...currentUser,
            user: {
              ...(currentUser.user || {}),
              ...responseData,
              
              name: data.username || currentUser.user?.name || responseData?.name || '',
             
              username: data.username || currentUser.user?.username || responseData?.username || '',
         
              phone: data.number || currentUser.user?.phone || responseData?.phone || '',
              number: data.number || currentUser.user?.number || responseData?.number || '',
              email: data.email || currentUser.user?.email || responseData?.email || '',
              avatar: responseData?.avatar || responseData?.profile || currentUser.user?.avatar || ''
            }
          };
          
        
          await AsyncStorage.setItem('userDetail', JSON.stringify(updatedUser));
    
          setuser(updatedUser);
          
       
          setUserDetail({
            ...userDetail,
            username: data.username || userDetail.username,
            email: data.email || userDetail.email,
            number: data.number || userDetail.number,
            img: responseData?.avatar || responseData?.profile || userDetail.img
          });
          
          if (responseData?.otp) {
            setotpfield(true);
            setEdit(true);
          } else {
            setEdit(false);
            setotpfield(false);
            await getProfile();
          }
          return; // Success, exit the function
        } else {
          lastError = res?.message || 'Failed to update profile';
        }
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
        lastError = error.message || 'Network error';
      }
    }
    
    // If we get here, all endpoints failed
    setLoading(false);
    setToast(lastError || 'Failed to update profile. Please try again.');
    setotpval({ otp: '' });
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
