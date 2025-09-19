import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import styles from './styles';
import Constants from '../../Assets/Helpers/constant';
import { navigate, reset } from '../../../navigationRef';
import Spinner from '../../Assets/Component/Spinner';
import { LoadContext, ToastContext } from '../../../App';
import { Post } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';
import { checkEmail } from '../../Assets/Helpers/InputsNullChecker';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const ForgotPassword = props => {
  const { t } = useTranslation();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [showPass, setShowPass] = useState(true);
  const [showPass2, setShowPass2] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [value, setValue] = useState('');

  const sendotp = () => {
    if (email === '') {
      setSubmitted(true);
      return;
    }
    const emailcheck = checkEmail(email.trim());
    if (!emailcheck) {
      Toast.show({
        type: 'error',
        text1: t('Your email id is invalid'),
      })
      return;
    }
    const d = {
      email: email.trim().toLowerCase(),
    };
    //   console.log('data==========>', d);s
    setLoading(true);

    Post('sendOTP', d, {}).then(async res => {
      setLoading(false);
      console.log(res);
      setSubmitted(false);
      if (res.status) {
        setToast(res.data.message);
        // const data = {
        //   email: userDetail.email,
        //   token: res.data.token,
        // };
        // navigate('OtpVerify', {data});
        setShowEmail(false);
        setShowOtp(true);
        setShowPassword(false);
        setToken(res?.data?.token);
        console.log('enter');
        // setUserDetail({
        //   email: '',
        // });
      } else {
        setLoading(false);
        setToast(res.message);
      }
    });
  };
  const verifyotp = () => {
    if (value === '') {
      setSubmitted(true);
      return;
    }
    const data = {
      otp: value,
      token,
    };
    // data.token = otptoken;
    console.log('data==========>', data);
    setLoading(true);
    Post('verifyOTP', data, {}).then(
      async res => {
        setLoading(false);
        setSubmitted(false);
        console.log('res =======>', res);
        if (res.status) {
          setToast(res.data.message);
          setValue('');
          setShowEmail(false);
          setShowOtp(false);
          setShowPassword(true);
          setToken(res?.data?.token);
          // navigate('ChangePassword', {token: res.data.token});
        } else {
          setToast(res.message);
        }
      },
      err => {
        setLoading(false);
        console.log('err =======>', err);
      },
    );
  };
  const submit = () => {
    if (confirmPassword === '' || password === '') {
      setSubmitted(true);
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: t('Your password does not match with Confirm password'),
      })
    }

    const data = {
      password,
      token,
    };
    console.log('data==========>', data);
    setLoading(true);
    Post('changePassword', data, {}).then(
      async res => {
        setLoading(false);
        setSubmitted(false);
        console.log(res);
        if (res.status) {
          setToast(res.data.message);
          await AsyncStorage.removeItem('userDetail');
          navigate('SignIn');
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
    // }
  };
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ marginTop: 30 }}>
        <Text style={styles.logintitle}>{t('Forgot password')}</Text>
      </View>
      <Image
        source={require('../../Assets/Images/forgetlogo.png')}
        style={styles.logo2}
      />
      {showEmail && (
        <View style={styles.textInput}>
          <TextInput
            style={styles.input}
            placeholder={t('Enter email')}
            placeholderTextColor={Constants.customgrey}
            value={email}
            onChangeText={e => setEmail(e)}
          />
          <View style={[styles.mylivejobtitle]}>
            <Text style={styles.jobtitle}>{t('Email')}</Text>
          </View>
        </View>
      )}
      {submitted && email === '' && (
        <Text style={styles.require}>{t('Email is required')}</Text>
      )}
      {showOtp && (
        <View style={styles.textInput}>
          <TextInput
            style={styles.input}
            placeholder={t('Enter OTP')}
            placeholderTextColor={Constants.customgrey}
            value={value}
            maxLength={4}
            keyboardType="number-pad"
            onChangeText={e => setValue(e)}
          />
          <View style={[styles.mylivejobtitle]}>
            <Text style={styles.jobtitle}>{t('OTP')}</Text>
          </View>
        </View>
      )}
      {submitted && value === '' && (
        <Text style={styles.require}>{t('OTP is required')}</Text>
      )}

      {showPassword && <View>
        <View style={styles.textInput}>
          <TextInput
            style={styles.input}
            placeholder={t('Password')}
            placeholderTextColor={Constants.customgrey}
            secureTextEntry={showPass}
            value={password}
            onChangeText={password => setPassword(password)}
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
        <View style={styles.textInput}>
          <TextInput
            style={styles.input}
            placeholder={t('Confirm Password')}
            placeholderTextColor={Constants.customgrey}
            secureTextEntry={showPass2}
            value={confirmPassword}
            onChangeText={confirmPassword =>
              setConfirmPassword(confirmPassword)
            }
          />
          <TouchableOpacity
            onPress={() => {
              setShowPass2(!showPass2);
            }}
            style={[styles.iconView, { borderRightWidth: 0 }]}>
            <Image
              source={
                showPass2
                  ? require('../../Assets/Images/eye-1.png')
                  : require('../../Assets/Images/eye.png')
              }
              style={{ height: 28, width: 28 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={[styles.mylivejobtitle]}>
            <Text style={styles.jobtitle}>{t('Confirm Password')}</Text>
          </View>
        </View>
        {submitted && userDetail.password === '' && (
          <Text style={styles.require}>{t('Confirm Password is required')}</Text>
        )}
      </View>}

      {showEmail && <TouchableOpacity style={[styles.signInbtn, { marginTop: 30, marginBottom: 50 }]} onPress={() => sendotp()}>
        <Text style={styles.buttontxt}>{t('Next')}</Text>
      </TouchableOpacity>}
      {showOtp && <TouchableOpacity style={[styles.signInbtn, { marginTop: 30, marginBottom: 50 }]} onPress={() => verifyotp()}>
        <Text style={styles.buttontxt}>{t('Verify OTP')}</Text>
      </TouchableOpacity>}
      {showPassword && <TouchableOpacity style={[styles.signInbtn, { marginTop: 30, marginBottom: 50 }]} onPress={() => submit()}>
        <Text style={styles.buttontxt}>{t('Submit')}</Text>
      </TouchableOpacity>}
    </ScrollView>
  );
};

export default ForgotPassword;
