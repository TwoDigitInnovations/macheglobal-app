import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import styles from './styles';
import Constants from '../../Assets/Helpers/constant';
import { navigate, reset } from '../../../navigationRef';
import Spinner from '../../Assets/Component/Spinner';
import { ToastContext } from '../../../App';
import { Post } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
import { useTranslation } from 'react-i18next';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import Toast from 'react-native-toast-message';

const SignUp = props => {
  const { t } = useTranslation();
  const [showPass, setShowPass] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useContext(ToastContext);
  const [title, settile] = useState('');
  const [user, setuser] = useState(0);
  const [userDetail, setUserDetail] = useState({
    password: '',
    number: '',
    email: '',
    username: '',
    type: 'USER'
  });

  const submit = async () => {
    if (
      userDetail.number === '' ||
      userDetail.password === '' ||
      userDetail.email.trim === '' ||
      userDetail.username === ''
    ) {
      setSubmitted(true);
      return;
    }
    const emailcheck = checkEmail(userDetail.email.trim());
    if (!emailcheck) {
      Toast.show({
        type: 'error',
        text1: t('Your email id is invalid'),
      })
      return;
    }
    if (userDetail?.password?.trim().length < 6) {
      Toast.show({
        type: 'error',
        text1: t('Password must be at least 6 characters.'),
      })
      return;
    }
    userDetail.email = userDetail.email.trim().toLowerCase();
    console.log('data==========>', userDetail);
    setLoading(true);
    Post('signUp', userDetail, { ...props }).then(
      async res => {
        setLoading(false);
        console.log(res);
        setSubmitted(false);
        if (res.success) {
          setUserDetail({
            password: '',
            number: '',
            email: '',
            username: '',
          });
          setToast(res.message);
          navigate('SignIn')

        } else {
          setLoading(false);
          setToast(res.message);
          console.log('error------>', res);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
        setSubmitted(false);
      },
    );
  };
  const privacy = async () => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open('https://www.bachhoahouston.com/PrivacyPolicy', {
          // Customization options
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: Constants.saffron,
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          enableBarCollapsing: false,
        });
      } else {
        // Fallback to a regular browser if InAppBrowser is not available
        Linking.openURL('https://www.bachhoahouston.com/PrivacyPolicy');
      }
    } catch (error) {
      console.error(error);
    }
  }
  const term = async () => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open('https://www.bachhoahouston.com/Termsandcondition', {
          // Customization options
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: Constants.saffron,
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          enableBarCollapsing: false,
        });
      } else {
        // Fallback to a regular browser if InAppBrowser is not available
        Linking.openURL('https://www.bachhoahouston.com/PrivacyPolicy');
      }
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Spinner color={'#fff'} visible={loading} />
      <View style={{ marginTop: 30 }}>
        <Text style={styles.logintitle}>{t('WELCOME')}</Text>
        <Text style={styles.title2}>{t('Please enter your Sign up details')}</Text>
      </View>
      {/* <Image
          source={require('../../Assets/Images/loginlogo.png')}
          style={styles.logo}
        /> */}
      <View style={[styles.btnCov2, styles.shadowProp]}>
        <TouchableOpacity
          style={[user === 0 ? styles.selectBtn : styles.unselectBtn]}
          onPress={() => {
            setuser(0);
            userDetail.type = 'USER';
          }}>
          <View style={user === 0 ? styles.selectshad : null}>
            <Text style={[user === 0 ? styles.selebtntxt : styles.unselebtntxt]}>{t('User')}</Text>
          </View>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={[user === 1 ? styles.selectBtn : styles.unselectBtn,
            // {    borderRightWidth:user != 1 ?1:0,
            // borderLeftWidth:user != 1 ?1:0,
            // borderColor:Constants.saffron}
          ]}
          onPress={() => {
            setuser(1);
            userDetail.type = 'SELLER';
          }}>
          <View style={user === 1 ? styles.selectshad : null}>
            <Text style={[user === 1 ? styles.selebtntxt : styles.unselebtntxt]}>{t('Seller')}</Text>
          </View>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={[user === 2 ? styles.selectBtn : styles.unselectBtn]}
          onPress={() => {
            setuser(2);
            userDetail.type = 'DRIVER';
          }}>
          <View style={user === 2 ? styles.selectshad : null}>
            <Text style={[user === 2 ? styles.selebtntxt : styles.unselebtntxt]}>{t('Driver')}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.textInput}>
        <TextInput
          style={styles.input}
          placeholder={t('Enter Name')}
          placeholderTextColor={Constants.customgrey}
          value={userDetail.username}
          onChangeText={username => setUserDetail({ ...userDetail, username })}
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={styles.jobtitle}>{t('Name')}</Text>
        </View>
      </View>
      {submitted && userDetail.username === '' && (
        <Text style={styles.require}>{t('Name is required')}</Text>
      )}
      <View style={styles.textInput}>
        <TextInput
          style={styles.input}
          placeholder={t('Enter Email')}
          placeholderTextColor={Constants.customgrey}
          value={userDetail.email}
          onChangeText={email => setUserDetail({ ...userDetail, email })}
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={styles.jobtitle}>{t('Email')}</Text>
        </View>
      </View>
      {submitted && userDetail.email === '' && (
        <Text style={styles.require}>{t('Email is required')}</Text>
      )}
      <View style={styles.textInput}>
        <TextInput
          style={styles.input}
          placeholder={t('Phone Number')}
          placeholderTextColor={Constants.customgrey}
          keyboardType="number-pad"
          value={userDetail.number}
          onChangeText={number => setUserDetail({ ...userDetail, number })}
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={styles.jobtitle}>{t('Phone Number')}</Text>
        </View>
      </View>
      {submitted && userDetail.number === '' && (
        <Text style={styles.require}>{t('Number is required')}</Text>
      )}
      <View style={styles.textInput}>
        <TextInput
          style={styles.input}
          placeholder={t('Password')}
          placeholderTextColor={Constants.customgrey}
          secureTextEntry={showPass}
          value={userDetail.password}
          onChangeText={password => setUserDetail({ ...userDetail, password })}
        />
        <TouchableOpacity
          onPress={() => {
            setShowPass(!showPass);
          }}
          style={[styles.iconView, { borderRightWidth: 0 }]}>
          <Image
            source={
              showPass
                ? require('../../Assets/Images/eye-1.png')
                : require('../../Assets/Images/eye.png')
            }
            style={{ height: 28, width: 28 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={[styles.mylivejobtitle]}>
          <Text style={styles.jobtitle}>{t('Password')}</Text>
        </View>
      </View>
      {submitted && userDetail.password === '' && (
        <Text style={styles.require}>{t('Password is required')}</Text>
      )}
      {user === 0 && <View style={styles.textInput}>
        <TextInput
          style={styles.input}
          placeholder={t('Referral Code (optional)')}
          placeholderTextColor={Constants.customgrey}
          value={userDetail.referal}
          onChangeText={referal => setUserDetail({ ...userDetail, referal })}
        />
        <View style={[styles.mylivejobtitle]}>
          <Text style={styles.jobtitle}>{t('Referral Code')}</Text>
        </View>
      </View>}

      <View style={styles.pp}>
        <Text style={styles.pp2}>{t('By clicking Sign up, you agree with our')}</Text>
        <View style={styles.pt}>
          <Text style={styles.pp3} onPress={() => term()}>
            {t('Terms and Condition')}
          </Text>
          <Text style={styles.pp2}> {t('and')} </Text>
          <Text style={styles.pp3} onPress={() => privacy()}>
            {t('Privacy Policy')}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signInbtn} onPress={() => submit()}>
        <Text style={styles.buttontxt}>{t('Sign Up')}</Text>
      </TouchableOpacity>

      <View style={{ alignSelf: 'center', marginBottom: 40 }}>
        <View style={[styles.acountBtn]}>
          <Text style={styles.Already}>{t('Already have any account ?')}</Text>
          <TouchableOpacity onPress={() => navigate('SignIn')}>
            <Text style={styles.signin}>{t('Sign in')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;
