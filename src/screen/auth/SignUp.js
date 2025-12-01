import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Post } from '../../Assets/Helpers/Service';
import CountryPicker from 'react-native-country-picker-modal';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SuccessPopup = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>

            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalText}>Registration Successful</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function SignupScreen({ navigation }) {
  const [userType, setUserType] = useState('user'); // 'user' or 'seller'
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: `+${callingCode}${formData.phone}`,
      password: formData.password,
      role: userType === 'user' ? 'User' : 'Seller', // Changed from userType to role and capitalize first letter
    };

    try {
      setIsLoading(true);
      const response = await Post('auth/register', payload);

      if (response.success) {
        // Remove guest user flag on successful registration
        await AsyncStorage.removeItem('isGuestUser');
        setShowSuccess(true);
        // Auto navigate after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          navigation.navigate('SignIn');
        }, 2000);
      } else {
        Alert.alert('Error', response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>
          Macheglobal
        </Text>

        {/* User Type Selection */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.userButton,
              userType === 'user' ? styles.activeButton : styles.inactiveButton
            ]}
            onPress={() => setUserType('user')}
          >
            <Text style={[
              styles.userButtonText,
              userType === 'user' ? styles.activeText : styles.inactiveText
            ]}>
              User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sellerButton,
              userType === 'seller' ? styles.activeButton : styles.inactiveButton
            ]}
            onPress={() => setUserType('seller')}
          >
            <Text style={[
              styles.sellerButtonText,
              userType === 'seller' ? styles.activeText : styles.inactiveText
            ]}>
              Seller
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full Name Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            autoCapitalize="words"
          />
          {errors.name && <Text style={{ color: 'red' }}>{errors.name}</Text>}
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text.toLowerCase())}
          />
          {errors.email && <Text style={{ color: 'red' }}>{errors.email}</Text>}
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <View style={styles.phoneInputWrapper}>
            <TouchableOpacity 
              style={styles.countrySelector}
              onPress={() => setCountryPickerVisible(true)}
            >
              <CountryPicker
                countryCode={countryCode}
                withFlag
                withCallingCode
                withFilter
                withAlphaFilter
                withEmoji
                onSelect={(country) => {
                  setCountryCode(country.cca2);
                  setCallingCode(country.callingCode[0]);
                  setCountryPickerVisible(false);
                }}
                visible={countryPickerVisible}
                onClose={() => setCountryPickerVisible(false)}
                containerButtonStyle={styles.countryButton}
              />
              <Text style={styles.callingCode}>+{callingCode}</Text>
              <Icon name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone Number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
            />
          </View>
          {errors.phone && <Text style={{ color: 'red' }}>{errors.phone}</Text>}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
          {errors.password && <Text style={{ color: 'red' }}>{errors.password}</Text>}
        </View>

        {/* Terms and Conditions */}
        <TouchableOpacity style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms & Conditions
          </Text>
        </TouchableOpacity>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.signupButton, isLoading && styles.disabledButton]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signupButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Divider with "Or signup using" */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine}></View>
          <Text style={styles.dividerText}>Or signup using</Text>
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
          style={styles.skipButton}
          onPress={async () => {
            await AsyncStorage.setItem('isGuestUser', 'true');
            navigation.replace('App');
          }}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        {/* Bottom Text */}
        <View style={styles.bottomContainer}>
          <View style={styles.bottomTextContainer}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.bottomLinkText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SuccessPopup
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigation.navigate('SignIn');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  checkmarkContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkmark: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  modalText: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
    width: '70%',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
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
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
    paddingLeft: 20,
    paddingRight: 20,
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
    marginBottom: 32,
    justifyContent: 'center',
  },
  userButton: {
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 10,
    marginRight: 12,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
  },
  sellerButton: {
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
  },
  activeButton: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  inactiveButton: {
    backgroundColor: 'white',
    borderColor: '#f97316',
  },
  activeText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  inactiveText: {
    color: '#f97316',
    fontWeight: '500',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#374151',
    fontSize: 16,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  countryButton: {
    marginRight: 4,
  },
  callingCode: {
    fontSize: 16,
    color: '#374151',
    marginRight: 4,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    padding: 0,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  disabledButton: {
    backgroundColor: '#fbbf24',
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32
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
    marginTop: 8
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 2,
    marginTop: 8,
    marginBottom: 16,
  },
  skipButtonText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
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

    alignItems: 'center',
    justifyContent: 'center',
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
  appleImage: {
    width: 36,
    height: 36,
  },
  bottomContainer: {
    paddingBottom: 32,
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bottomText: {
    color: '#6b7280',
    fontSize: 14,
  },
  bottomLinkText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  // modalContent: {
  //   backgroundColor: '#ffffff',
  //   borderTopLeftRadius: 20,
  //   borderTopRightRadius: 20,
  //   maxHeight: '70%',
  // },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 15,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  countryCodeModal: {
    fontSize: 14,
    color: '#6b7280',
  },
});