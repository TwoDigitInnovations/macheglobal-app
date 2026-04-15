import { useNavigation } from '@react-navigation/native';
import React, { useState, useContext, useEffect } from 'react';
import Constants from '../../Assets/Helpers/constant';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Linking,
  Modal,
} from 'react-native';
import { Post } from '../../Assets/Helpers/Service';
import { LoadContext, ToastContext } from '../../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LoginScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useContext(LoadContext);
  const [toast, setToast] = useContext(ToastContext);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await AsyncStorage.getItem('LANG');
      if (savedLang) {
        i18n.changeLanguage(savedLang);
        setCurrentLanguage(savedLang);
      }
    };
    loadLanguage();
  }, []);

  // Toggle language between English and French
  const toggleLanguage = async () => {
    const newLang = currentLanguage === 'en' ? 'fr' : 'en';
    await AsyncStorage.setItem('LANG', newLang);
    i18n.changeLanguage(newLang);
    setCurrentLanguage(newLang);
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleLogin = async () => {
    console.log('Login button pressed');
    // Basic validation
    if (!formData.email || !formData.password) {
      console.log('Validation failed: Email or password missing');
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Calling login API...');
      const response = await Post('auth/login', formData);
      
      console.log('API Response received:', JSON.stringify(response, null, 2));
      
      if (!response) {
        console.error('No response from server');
        throw new Error('No response from server');
      }

      // Check if OTP is required (Admin or Seller trying to login from mobile app)
      if (response.requireOTP && (response.role === 'Admin' || response.role === 'Seller')) {
        console.log('OTP required - blocking Admin/Seller login from mobile app');
        setIsLoading(false);
        
        if (response.role === 'Seller') {
          // Show seller modal instead of alert
          setShowSellerModal(true);
        } else {
          // Show alert for admin
          Alert.alert(
            'Login Not Allowed',
            'Admin accounts cannot login from the mobile app. Please use the admin web panel to login.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      // Handle error responses (like invalid credentials)
      if (response.status === 'error' || response.message) {
        console.log('Server responded with message:', response.message);
        // We'll still continue if it's a pending seller account
        if (response.status === 'pending') {
          console.log('Pending seller account detected, proceeding with login...');
        } else {
          throw new Error(response.message || 'Login failed');
        }
      }

      // Extract token from response (it could be in different places)
      const token = response.token || (response.data && response.data.token);
      if (!token) {
        console.error('No token in response:', response);
        throw new Error('Authentication failed: No token received');
      }

     
      
      // Extract user data from the response (handle both direct and nested user data)
      const userData = {
        token: token,
        user: response.user || response.data?.user || { email: formData.email },
        ...(response.user || response.data?.user || {}) // Spread user details if they exist
      };

      // If we have a status in the response, include it
      if (response.status) {
        userData.user = userData.user || {};
        userData.user.status = response.status;
      }

      console.log('📦 Full API Response:', JSON.stringify(response, null, 2));
      console.log('📦 Constructed userData:', JSON.stringify(userData, null, 2));

    
      
      // Save user data to AsyncStorage
      try {
        await AsyncStorage.setItem('userDetail', JSON.stringify(userData));
        // Remove guest user flag on successful login
        await AsyncStorage.removeItem('isGuestUser');
        console.log('User data saved to AsyncStorage');
      } catch (storageError) {
        console.error('Error saving to AsyncStorage:', storageError);
        throw storageError;
      }
      
      // Show success message (or info message for pending accounts)
      const toastMessage = response.message || 'Login successful!';
      setToast({
        visible: true,
        message: toastMessage,
        type: response.status === 'pending' ? 'info' : 'success',
      });
      
      console.log('Toast message set');
      
      // Safely extract user data with defaults
      const responseUserData = userData?.user || userData || {};
      const userRole = String(responseUserData?.role || '').toLowerCase();
      // Handle both string and boolean status values
      const userStatus = responseUserData?.status;
      const statusString = userStatus === true ? 'verified' : 
                         userStatus === false ? 'pending' : 
                         String(userStatus || 'pending').toLowerCase();
      
      console.log('🔍 Extracted user data:', { 
        userRole, 
        userStatus, 
        statusString,
        fullUserData: responseUserData,
        originalRole: responseUserData?.role,
        isSeller: userRole === 'seller'
      });
      
      try {
        // Handle seller login based on status
        if (userRole === 'seller') {
          console.log('🏪 Seller login detected', { userRole, statusString });
          
          if (statusString === 'pending') {
            // Check if seller already has a store created
            // Check multiple possible locations for hasStore flag
            const hasStore = responseUserData?.hasStore || 
                           responseUserData?.store || 
                           response?.user?.hasStore ||
                           false;
            
            console.log('🔍 Checking hasStore:', {
              hasStore,
              'responseUserData.hasStore': responseUserData?.hasStore,
              'responseUserData.store': responseUserData?.store,
              'response.user.hasStore': response?.user?.hasStore,
              'Full responseUserData': responseUserData,
              'Full response.user': response?.user
            });
            
            if (hasStore) {
              // Pending seller with store already created - show pending review modal
              console.log('⏳ Pending seller with existing store - showing review modal');
              setShowPendingModal(true);
              setIsLoading(false);
              return;
            } else {
              // Pending seller without store - allow to create store
              console.log('⏳ Pending seller without store, navigating to SellerStore');
              navigation.reset({
                index: 0,
                routes: [{ name: 'SellerStore' }],
              });
            }
          } else if (statusString === 'verified' || statusString === 'approved') {
            // Verified/Approved seller - block login and show popup to use website
            console.log('🚫 Verified/Approved seller login blocked - redirecting to website');
            
            // Clear the saved user data since we're not allowing login
            await AsyncStorage.removeItem('userDetail');
            
            // Show custom modal popup
            setShowSellerModal(true);
            setIsLoading(false);
            return;
          } else {
            // Unknown status - default to SellerStore
            console.log('⚠️ Unknown seller status:', statusString, 'navigating to SellerStore');
            navigation.reset({
              index: 0,
              routes: [{ name: 'SellerStore' }],
            });
          }
        } else {
          // Handle navigation for non-seller users
          console.log(`👤 Regular user login (${userRole || 'customer'}), navigating to App`);
          navigation.replace('App');
        }
      } catch (navError) {
        console.error('❌ Navigation error:', navError);
        navigation.replace('App'); 
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.content}>
        {/* Language Toggle Button */}
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={toggleLanguage}
        >
          <Icon name="language" size={20} color="#FF7000" />
          <Text style={styles.languageText}>
            {currentLanguage === 'en' ? 'English' : 'Français'}
          </Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>
          Macheglobal
        </Text>

        {/* Sign UP and Login Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signUpText}>{t('Sign up')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.loginToggleButton}
            onPress={() => {}} // Optional: Add any login-specific logic here
          >
            <Text style={styles.loginToggleText}>{t('Login')}</Text>
          </TouchableOpacity>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder={t('Email')}
            placeholderTextColor="#9ca3af"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder={t('Password')}
            placeholderTextColor="#9ca3af"
            style={styles.input}
            secureTextEntry={true}
            autoCapitalize="none"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
          />
        </View>

        {/* Forgot Password */}
        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>{t('Forgot password ?')}</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>
              {t('Login')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider with "Or login using" */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine}></View>
          <Text style={styles.dividerText}>{t('Or login using')}</Text>
          <View style={styles.dividerLine}></View>
        </View>

        {/* Social Login Icons */}
        {/* <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <View style={styles.googleIcon}>
              <Image 
                source={require('../../Assets/Images/google.png')} 
                style={styles.googleImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <View style={styles.appleIcon}>
              <Image 
                source={require('../../Assets/Images/apple.png')} 
                style={styles.appleImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View> */}

        {/* Skip Button */}
        <TouchableOpacity 
          style={styles.skipButtonCenter}
          onPress={async () => {
            await AsyncStorage.setItem('isGuestUser', 'true');
            navigation.replace('App');
          }}
        >
          <Text style={styles.skipButtonCenterText}>{t('Skip')}</Text>
        </TouchableOpacity>

        {/* Don't have an account? Sign up */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>{t("Don't have an account?")} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>{t('Sign up')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Seller Login Blocked Modal */}
      <Modal
        visible={showSellerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSellerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Icon name="store" size={50} color="#FF7000" />
            </View>
            
            <Text style={styles.modalTitle}>
              {t('Seller Login Not Allowed')}
            </Text>
            
            <Text style={styles.modalMessage}>
              {t('To access the seller dashboard, please login on the website')}
            </Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSellerModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>
                  {t('Cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalWebsiteButton}
                onPress={() => {
                  setShowSellerModal(false);
                  Linking.openURL('https://www.seller.macheglobal.com/login');
                }}
              >
                <Text style={styles.modalWebsiteButtonText}>
                  {t('Open Website')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pending Seller Review Modal */}
      <Modal
        visible={showPendingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPendingModal(false);
          AsyncStorage.removeItem('userDetail');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Icon name="clock" size={50} color="#FF7000" />
            </View>
            
            <Text style={styles.modalTitle}>
              {t('Request Under Review')}
            </Text>
            
            <Text style={styles.modalMessage}>
              {t('Your request is under review. We will notify you via email within 3-4 business days if your verification is successful.')}
            </Text>
            
            <TouchableOpacity
              style={styles.modalOkButton}
              onPress={() => {
                setShowPendingModal(false);
                AsyncStorage.removeItem('userDetail');
              }}
            >
              <Text style={styles.modalWebsiteButtonText}>
                {t('OK')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  languageButton: {
    position: 'absolute',
    top: 10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF7000',
    zIndex: 10,
  },
  languageText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FF7000',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor:'#f3f4f6',
    marginHorizontal: 20, 
   paddingLeft:20,
   paddingRight:20,
   shadowColor: '#000',
   shadowOffset: {
     width: 0,
     height: 2,
   },
   shadowOpacity: 0.25,
   shadowRadius: 3.84,
   elevation: 5,
  },
  title: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 48,
    paddingTop: 32,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 48,
    justifyContent: 'center', 
  },
  signUpButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginRight: 12,
  },
  signUpText: {
    color: 'black',
    fontWeight: '500',
  },
  loginToggleButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  loginToggleText: {
    color: 'black',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#374151',
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
    padding: 8,
  },
  forgotPasswordText: {
    color: '#f97316',
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  skipButtonCenter: {
    alignItems: 'center',
    paddingVertical: 2,
    marginTop: 8,
    marginBottom: 6,
  },
  skipButtonCenterText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 48,
  },
  socialButton: {
    width: 48,
    height: 48,
  
  
 
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  googleImage: {
    width: 36,
    height: 36,
  },
  appleIcon: {
    width: 24,
    height: 24,
   
   
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  appleImage: {
    width: 36,
    height: 36,
    
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  signupText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalWebsiteButton: {
    flex: 1,
    backgroundColor: '#FF7000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalWebsiteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOkButton: {
    width: '100%',
    backgroundColor: '#FF7000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default LoginScreen;