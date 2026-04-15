import React, { useState, useCallback, memo, useEffect } from 'react';
import Constants from '../../Assets/Helpers/constant';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
  PermissionsAndroid,
  ActionSheetIOS,
  ActionSheetAndroid,
  Modal,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Post, GetApi } from '../../Assets/Helpers/Service';
import { useToast } from 'react-native-toast-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import CountryPicker from 'react-native-country-picker-modal';

const { width, height } = Dimensions.get('window');

const InputField = memo(({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  error, 
  icon, 
  keyboardType = 'default', 
  multiline = false, 
  numberOfLines = 1 
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {icon && <Icon name={icon} size={20} color="#6B7280" style={styles.inputIcon} />}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize="sentences"
          autoCorrect={false}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const SellerStore = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [toastContext, setToastContext] = useState(null);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Chile',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    aadharNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    businessType: 'retail',
    description: '',
    status: 'pending'
  });
  const [logo, setLogo] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [countryCode, setCountryCode] = useState('CL');
  const [callingCode, setCallingCode] = useState('56');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '' });

  // Helper function to get calling code from country code
  const getCallingCodeFromCountry = (countryCode) => {
    const callingCodes = {
      'AD': '376', 'AE': '971', 'AF': '93', 'AG': '1', 'AI': '1', 'AL': '355',
      'AM': '374', 'AO': '244', 'AR': '54', 'AS': '1', 'AT': '43', 'AU': '61',
      'AW': '297', 'AX': '358', 'AZ': '994', 'BA': '387', 'BB': '1', 'BD': '880',
      'BE': '32', 'BF': '226', 'BG': '359', 'BH': '973', 'BI': '257', 'BJ': '229',
      'BL': '590', 'BM': '1', 'BN': '673', 'BO': '591', 'BQ': '599', 'BR': '55',
      'BS': '1', 'BT': '975', 'BW': '267', 'BY': '375', 'BZ': '501', 'CA': '1',
      'CC': '61', 'CD': '243', 'CF': '236', 'CG': '242', 'CH': '41', 'CI': '225',
      'CK': '682', 'CL': '56', 'CM': '237', 'CN': '86', 'CO': '57', 'CR': '506',
      'CU': '53', 'CV': '238', 'CW': '599', 'CX': '61', 'CY': '357', 'CZ': '420',
      'DE': '49', 'DJ': '253', 'DK': '45', 'DM': '1', 'DO': '1', 'DZ': '213',
      'EC': '593', 'EE': '372', 'EG': '20', 'EH': '212', 'ER': '291', 'ES': '34',
      'ET': '251', 'FI': '358', 'FJ': '679', 'FK': '500', 'FM': '691', 'FO': '298',
      'FR': '33', 'GA': '241', 'GB': '44', 'GD': '1', 'GE': '995', 'GF': '594',
      'GG': '44', 'GH': '233', 'GI': '350', 'GL': '299', 'GM': '220', 'GN': '224',
      'GP': '590', 'GQ': '240', 'GR': '30', 'GT': '502', 'GU': '1', 'GW': '245',
      'GY': '592', 'HK': '852', 'HN': '504', 'HR': '385', 'HT': '509', 'HU': '36',
      'ID': '62', 'IE': '353', 'IL': '972', 'IM': '44', 'IN': '91', 'IO': '246',
      'IQ': '964', 'IR': '98', 'IS': '354', 'IT': '39', 'JE': '44', 'JM': '1',
      'JO': '962', 'JP': '81', 'KE': '254', 'KG': '996', 'KH': '855', 'KI': '686',
      'KM': '269', 'KN': '1', 'KP': '850', 'KR': '82', 'KW': '965', 'KY': '1',
      'KZ': '7', 'LA': '856', 'LB': '961', 'LC': '1', 'LI': '423', 'LK': '94',
      'LR': '231', 'LS': '266', 'LT': '370', 'LU': '352', 'LV': '371', 'LY': '218',
      'MA': '212', 'MC': '377', 'MD': '373', 'ME': '382', 'MF': '590', 'MG': '261',
      'MH': '692', 'MK': '389', 'ML': '223', 'MM': '95', 'MN': '976', 'MO': '853',
      'MP': '1', 'MQ': '596', 'MR': '222', 'MS': '1', 'MT': '356', 'MU': '230',
      'MV': '960', 'MW': '265', 'MX': '52', 'MY': '60', 'MZ': '258', 'NA': '264',
      'NC': '687', 'NE': '227', 'NF': '672', 'NG': '234', 'NI': '505', 'NL': '31',
      'NO': '47', 'NP': '977', 'NR': '674', 'NU': '683', 'NZ': '64', 'OM': '968',
      'PA': '507', 'PE': '51', 'PF': '689', 'PG': '675', 'PH': '63', 'PK': '92',
      'PL': '48', 'PM': '508', 'PR': '1', 'PS': '970', 'PT': '351', 'PW': '680',
      'PY': '595', 'QA': '974', 'RE': '262', 'RO': '40', 'RS': '381', 'RU': '7',
      'RW': '250', 'SA': '966', 'SB': '677', 'SC': '248', 'SD': '249', 'SE': '46',
      'SG': '65', 'SH': '290', 'SI': '386', 'SJ': '47', 'SK': '421', 'SL': '232',
      'SM': '378', 'SN': '221', 'SO': '252', 'SR': '597', 'SS': '211', 'ST': '239',
      'SV': '503', 'SX': '1', 'SY': '963', 'SZ': '268', 'TC': '1', 'TD': '235',
      'TG': '228', 'TH': '66', 'TJ': '992', 'TK': '690', 'TL': '670', 'TM': '993',
      'TN': '216', 'TO': '676', 'TR': '90', 'TT': '1', 'TV': '688', 'TW': '886',
      'TZ': '255', 'UA': '380', 'UG': '256', 'US': '1', 'UY': '598', 'UZ': '998',
      'VA': '39', 'VC': '1', 'VE': '58', 'VG': '1', 'VI': '1', 'VN': '84',
      'VU': '678', 'WF': '681', 'WS': '685', 'XK': '383', 'YE': '967', 'YT': '262',
      'ZA': '27', 'ZM': '260', 'ZW': '263'
    };
    return callingCodes[countryCode] || '1';
  };

  // Helper function to get country flag emoji
  const getCountryFlag = (countryCode) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // Helper function to validate phone number based on country
  const validatePhoneNumber = (phone, countryCode) => {
    if (!phone || phone.trim() === '') {
      return { isValid: false, message: 'Phone number is required' };
    }

    // Remove any non-digit characters
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Country-specific validation rules
    const validationRules = {
      // Chile
      'CL': { length: 9, pattern: /^[2-9]\d{8}$/, message: 'Chilean phone number must be 9 digits starting with 2-9' },
      
      // India
      'IN': { length: 10, pattern: /^[6-9]\d{9}$/, message: 'Indian phone number must be 10 digits starting with 6-9' },
      
      // USA
      'US': { length: 10, pattern: /^[2-9]\d{9}$/, message: 'US phone number must be 10 digits' },
      
      // UK
      'GB': { length: 10, pattern: /^[1-9]\d{9}$/, message: 'UK phone number must be 10 digits' },
      
      // Canada
      'CA': { length: 10, pattern: /^[2-9]\d{9}$/, message: 'Canadian phone number must be 10 digits' },
      
      // Australia
      'AU': { length: 9, pattern: /^[2-9]\d{8}$/, message: 'Australian phone number must be 9 digits' },
      
      // Mexico
      'MX': { length: 10, pattern: /^[1-9]\d{9}$/, message: 'Mexican phone number must be 10 digits' },
      
      // Brazil
      'BR': { length: 11, pattern: /^[1-9]\d{10}$/, message: 'Brazilian phone number must be 11 digits' },
      
      // Argentina
      'AR': { length: 10, pattern: /^[1-9]\d{9}$/, message: 'Argentine phone number must be 10 digits' },
      
      // Spain
      'ES': { length: 9, pattern: /^[6-9]\d{8}$/, message: 'Spanish phone number must be 9 digits starting with 6-9' },
      
      // France
      'FR': { length: 9, pattern: /^[1-9]\d{8}$/, message: 'French phone number must be 9 digits' },
      
      // Germany
      'DE': { minLength: 10, maxLength: 11, pattern: /^[1-9]\d{9,10}$/, message: 'German phone number must be 10-11 digits' },
      
      // China
      'CN': { length: 11, pattern: /^1[3-9]\d{9}$/, message: 'Chinese phone number must be 11 digits starting with 1' },
      
      // Japan
      'JP': { length: 10, pattern: /^[0-9]\d{9}$/, message: 'Japanese phone number must be 10 digits' },
      
      // South Korea
      'KR': { length: 10, pattern: /^[0-9]\d{9}$/, message: 'Korean phone number must be 10 digits' },
      
      // Pakistan
      'PK': { length: 10, pattern: /^3\d{9}$/, message: 'Pakistani phone number must be 10 digits starting with 3' },
      
      // Bangladesh
      'BD': { length: 10, pattern: /^1[3-9]\d{8}$/, message: 'Bangladeshi phone number must be 10 digits starting with 1' },
      
      // UAE
      'AE': { length: 9, pattern: /^[5]\d{8}$/, message: 'UAE phone number must be 9 digits starting with 5' },
      
      // Saudi Arabia
      'SA': { length: 9, pattern: /^[5]\d{8}$/, message: 'Saudi phone number must be 9 digits starting with 5' },
    };

    const rule = validationRules[countryCode];

    if (rule) {
      // Check length
      if (rule.length && cleanPhone.length !== rule.length) {
        return { isValid: false, message: rule.message };
      }

      // Check min/max length (for countries like Germany)
      if (rule.minLength && rule.maxLength) {
        if (cleanPhone.length < rule.minLength || cleanPhone.length > rule.maxLength) {
          return { isValid: false, message: rule.message };
        }
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(cleanPhone)) {
        return { isValid: false, message: rule.message };
      }

      return { isValid: true, message: '' };
    } else {
      // Default validation for countries not in the list
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        return { isValid: false, message: 'Phone number must be between 7-15 digits' };
      }
      return { isValid: true, message: '' };
    }
  };

  // Load existing store data if editing
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userDetail');
        if (userData) {
          const { user } = JSON.parse(userData);
          if (user.store) {
            setFormData(prev => ({
              ...prev,
              ...user.store,
              status: user.store.status || 'pending'
            }));
            if (user.store.logo) {
              setLogo({ uri: user.store.logo });
            }
          }
        }
      } catch (error) {
        console.error('Error loading store data:', error);
      }
    };

    loadStoreData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Real-time phone validation
    if (field === 'phone' && value.trim() !== '') {
      const phoneValidation = validatePhoneNumber(value, countryCode);
      if (!phoneValidation.isValid) {
        setErrors(prev => ({
          ...prev,
          [field]: phoneValidation.message
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [field]: null
        }));
      }
    } else if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const showImagePickerOptions = (type) => {
    Alert.alert(
      'Select Logo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(type),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImage(type),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const takePhoto = async (type) => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        toast.show('Camera permission is required to take photos', { type: 'warning' });
        return;
      }

      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        includeBase64: false,
        saveToPhotos: false,
        cameraType: 'back',
      };

      const result = await launchCamera(options);

      if (result.didCancel) {
        console.log('User cancelled camera');
      } else if (result.error) {
        console.log('Camera Error: ', result.error);
        toast.show('Failed to take photo. Please try again.', { type: 'danger' });
      } else if (result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        handleImageSelection(selectedAsset, type);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.show('Failed to access camera. Please try again.', { type: 'danger' });
    }
  };

  const pickImage = async (type) => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        includeBase64: false,
        selectionLimit: type === 'logo' ? 1 : 5,
      };

      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        console.log('User cancelled image picker');
      } else if (result.error) {
        console.log('ImagePicker Error: ', result.error);
        toast.show('Failed to pick image. Please try again.', { type: 'danger' });
      } else if (result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        handleImageSelection(selectedAsset, type);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.show('Failed to pick image. Please try again.', { type: 'danger' });
    }
  };

  const handleImageSelection = (selectedAsset, type) => {
    if (type === 'logo') {
      setLogo(selectedAsset);
      if (errors.logo) {
        setErrors(prev => ({ ...prev, logo: null }));
      }
    } else {
      setDocuments(prev => [...prev, selectedAsset]);
      if (errors.documents) {
        setErrors(prev => ({ ...prev, documents: null }));
      }
    }
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    console.log('Validating form...');
    const newErrors = {};
    
    // Required fields validation
    if (!formData.storeName?.trim()) {
      newErrors.storeName = 'Store name is required';
      console.log('Validation failed: Store name is required');
    }
    
    if (!formData.ownerName?.trim()) {
      newErrors.ownerName = 'Owner name is required';
      console.log('Validation failed: Owner name is required');
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
      console.log('Validation failed: Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      console.log('Validation failed: Invalid email format');
    }
    
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
      console.log('Validation failed: Phone number is required');
    } else {
      // Use country-specific validation
      const phoneValidation = validatePhoneNumber(formData.phone, countryCode);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.message;
        console.log('Validation failed:', phoneValidation.message);
      }
    }
    
    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
      console.log('Validation failed: Address is required');
    }
    
    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
      console.log('Validation failed: City is required');
    }
    
    if (!formData.pincode?.trim()) {
      newErrors.pincode = 'Pincode is required';
      console.log('Validation failed: Pincode is required');
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
      console.log('Validation failed: Invalid pincode format');
    }
    
    if (!formData.country?.trim()) {
      newErrors.country = 'Country is required';
      console.log('Validation failed: Country is required');
    }

    if (!logo) {
      newErrors.logo = 'Store logo is required';
      console.log('Validation failed: Store logo is required');
    }

    if (documents.length === 0) {
      newErrors.documents = 'At least one document is required';
      console.log('Validation failed: At least one document is required');
    }

    console.log('Validation errors:', Object.keys(newErrors).length > 0 ? newErrors : 'No errors');
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      toast.show('Please fill all required fields correctly', { type: 'danger' });
      return;
    }
    
    setIsLoading(true);
    console.log('Form data:', formData);
    
    try {
      const formDataToSend = new FormData();
      
      // Add form data with phone number including country code
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          // Add country code to phone number
          if (key === 'phone') {
            const phoneWithCode = `+${callingCode}${formData[key]}`;
            formDataToSend.append(key, phoneWithCode);
            console.log(`Added ${key}:`, phoneWithCode);
          } else {
            formDataToSend.append(key, formData[key]);
            console.log(`Added ${key}:`, formData[key]);
          }
        }
      });
      
      // Add logo if it exists
      if (logo) {
        const logoFile = {
          uri: logo.uri || logo,
          type: logo.type || 'image/jpeg',
          name: logo.fileName || `logo-${Date.now()}.jpg`,
        };
        console.log('Adding logo:', logoFile);
        formDataToSend.append('logo', logoFile);
      }
      
      // Add documents if they exist
      if (documents.length > 0) {
        documents.forEach((doc, index) => {
          const docFile = {
            uri: doc.uri,
            type: doc.type || 'application/octet-stream',
            name: doc.fileName || `document-${index}-${Date.now()}.${doc.type?.split('/')[1] || 'pdf'}`,
          };
          console.log(`Adding document ${index}:`, docFile);
          formDataToSend.append('documents', docFile);
        });
      }
      
      console.log('Submitting store data...');
      
      // Log the form data keys and values for debugging
      for (let [key, value] of formDataToSend._parts) {
        console.log(`${key}:`, value);
      }
      
      // Get the user token
      const userData = await AsyncStorage.getItem('userDetail');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user || !user.token) {
        throw new Error('User not authenticated');
      }
      
      // Log the request details
      const apiUrl = `${Constants.baseUrl}seller/`; // Remove 'create-store' as it's not in the route
      console.log('Making request to:', apiUrl);
      console.log('Request headers:', {
        'Authorization': `jwt ${user.token ? '***' + user.token.slice(-4) : 'undefined'}`,
        'Content-Type': 'multipart/form-data',
      });
      
      // Make the API call with proper headers
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `jwt ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formDataToSend,
      });
      
      // First, get the response as text to handle potential non-JSON responses
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
        console.log('API Response:', responseData);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        console.error('Response text:', responseText);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        console.error('Response data:', responseData);
        
        // Check if error field contains duplicate key error
        if (responseData.error && responseData.error.includes('E11000 duplicate key error')) {
          if (responseData.error.includes('email')) {
            throw new Error('DUPLICATE_EMAIL');
          } else {
            throw new Error('DUPLICATE_ENTRY');
          }
        }
        
        throw new Error(responseData.message || responseData.error || `Server error: ${response.status}`);
      }

      if (responseData.success) {
        // Update user data with store info
        const userData = await AsyncStorage.getItem('userDetail');
        if (userData) {
          const user = JSON.parse(userData);
          await AsyncStorage.setItem('userDetail', JSON.stringify({
            ...user,
            store: {
              ...response.data,
              status: 'pending'
            }
          }));
        }
        
        // Show success modal
        setShowSuccessModal(true);
      } else {
        // Show error toast
        toast.show(response.message || 'Failed to create store', {
          type: 'danger',
          placement: 'bottom',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error creating store:', error);
      let errorMessage = 'An error occurred while creating the store';
      let errorTitle = 'Error';
    
      // Check for duplicate email error
      if (error.message === 'DUPLICATE_EMAIL') {
        errorTitle = 'Duplicate Email';
        errorMessage = 'This email is already registered with another store. Please use a different email.';
      } else if (error.message === 'DUPLICATE_ENTRY') {
        errorTitle = 'Duplicate Entry';
        errorMessage = 'This information is already registered. Please use different details.';
      } else if (error.message && error.message.includes('E11000 duplicate key error')) {
        errorTitle = 'Duplicate Entry';
        if (error.message.includes('email')) {
          errorMessage = 'This email is already registered with another store. Please use a different email.';
        } else {
          errorMessage = 'This information is already registered. Please use different details.';
        }
      } else if (error.message && error.message.includes('already have a store')) {
        errorTitle = 'Store Exists';
        errorMessage = 'You already have a store. You cannot create another one.';
      } else if (error.message && error.message !== 'Error creating store') {
        errorMessage = error.message;
      }
      
      setErrorModalData({
        title: errorTitle,
        message: errorMessage
      });
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              t('Logout Required'),
              t('To access the user app, you need to logout from your seller account and login with a user account.'),
              [
                {
                  text: t('Cancel'),
                  style: 'cancel'
                },
                {
                  text: t('Logout'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Clear user data
                      await AsyncStorage.removeItem('userDetail');
                      await AsyncStorage.removeItem('userData');
                      
                      // Navigate to login screen
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Auth' }],
                      });
                    } catch (error) {
                      console.error('Error logging out:', error);
                      toast.show('Failed to logout. Please try again.', { type: 'danger' });
                    }
                  }
                }
              ]
            );
          }}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Create Your Store')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <TouchableOpacity 
              style={styles.logoUploadButton}
              onPress={() => showImagePickerOptions('logo')}
              activeOpacity={0.7}
            >
    {logo ? (
      <Image 
        source={{ uri: logo.uri || logo }} 
        style={styles.logoImage} 
      />
    ) : (
      <View style={styles.logoPlaceholder}>
        <Icon name="camera" size={32} color="#9CA3AF" />
        <Text style={styles.uploadText}>{t('Upload Store Logo')}</Text>
      </View>
    )}
  </TouchableOpacity>
  {errors.logo && <Text style={styles.errorText}>{errors.logo}</Text>}
</View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Store Information')}</Text>
            
            <InputField
              label="Store Name*"
              value={formData.storeName}
              onChangeText={useCallback((text) => handleInputChange('storeName', text), [handleInputChange])}
              placeholder="Enter store name"
              error={errors.storeName}
              icon="shopping-bag"
              key="storeName"
            />
            
            <InputField
              label="Owner Name*"
              value={formData.ownerName}
              onChangeText={useCallback((text) => handleInputChange('ownerName', text), [handleInputChange])}
              placeholder="Enter owner's full name"
              error={errors.ownerName}
              icon="user"
              key="ownerName"
            />
            
            <InputField
              label="Email Address*"
              value={formData.email}
              onChangeText={useCallback((text) => handleInputChange('email', text), [handleInputChange])}
              placeholder="Enter email address"
              keyboardType="email-address"
              error={errors.email}
              icon="mail"
              key="email"
            />
            
            {/* Phone Number with Country Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('Phone Number')}*</Text>
              <View style={[styles.phoneInputWrapper, errors.phone && styles.inputError]}>
                <TouchableOpacity
                  style={styles.countryPickerButton}
                  onPress={() => {
                    console.log('Button clicked! Opening country picker...');
                    console.log('Current state - countryCode:', countryCode, 'callingCode:', callingCode);
                    setCountryPickerVisible(true);
                  }}
                >
                  <Text style={styles.flagEmoji}>{getCountryFlag(countryCode)}</Text>
                  <Text style={styles.callingCode}>
                    +{getCallingCodeFromCountry(countryCode)}
                  </Text>
                  <Icon name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange('phone', text.replace(/[^0-9]/g, ''))}
                  placeholder={t('Enter phone number')}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
            
            {/* Country Picker Modal */}
            <CountryPicker
              countryCode={countryCode}
              withFilter
              withFlag
              withCallingCode
              withEmoji
              withCountryNameButton
              withAlphaFilter
              onSelect={(country) => {
                console.log('=== Country Selected ===');
                console.log('Country CCA2:', country.cca2);
                
                // Get calling code from our mapping
                const newCallingCode = getCallingCodeFromCountry(country.cca2);
                console.log('New calling code from mapping:', newCallingCode);
                
                // Update states
                setCountryCode(country.cca2);
                setCallingCode(newCallingCode);
                setSelectedCountry(country);
                
                // Re-validate phone
                if (formData.phone && formData.phone.trim() !== '') {
                  const phoneValidation = validatePhoneNumber(formData.phone, country.cca2);
                  if (!phoneValidation.isValid) {
                    setErrors(prev => ({ ...prev, phone: phoneValidation.message }));
                  } else {
                    setErrors(prev => ({ ...prev, phone: null }));
                  }
                }
                
                setCountryPickerVisible(false);
                console.log('Updated! New code:', newCallingCode);
              }}
              onClose={() => {
                console.log('Country picker closed');
                setCountryPickerVisible(false);
              }}
              visible={countryPickerVisible}
              containerButtonStyle={{ display: 'none' }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Store Address')}</Text>
            
            <InputField
              label="Address*"
              value={formData.address}
              onChangeText={useCallback((text) => handleInputChange('address', text), [handleInputChange])}
              placeholder="Enter store address"
              error={errors.address}
              icon="map-pin"
              multiline
              numberOfLines={3}
              key="address"
            />
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]} key="cityContainer">
                <Text style={styles.label}>City*</Text>
                <View style={[styles.inputWrapper, errors.city && styles.inputError]}>
                  <Icon name="map-pin" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.city}
                    onChangeText={useCallback((text) => handleInputChange('city', text), [handleInputChange])}
                    placeholder="Enter city"
                    placeholderTextColor="#9CA3AF"
                    key="cityInput"
                  />
                </View>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
              
              <View style={[styles.inputContainer, styles.halfWidth]} key="pincodeContainer">
                <Text style={styles.label}>Pincode*</Text>
                <View style={[styles.inputWrapper, errors.pincode && styles.inputError]}>
                  <Icon name="hash" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.pincode}
                    onChangeText={useCallback((text) => handleInputChange('pincode', text), [handleInputChange])}
                    placeholder="Pincode"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={6}
                    key="pincodeInput"
                  />
                </View>
                {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
              </View>
            </View>
            
            {/* Country Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('Country')}*</Text>
              <TouchableOpacity
                style={[styles.countrySelectButton, errors.country && styles.inputError]}
                onPress={() => setCountryPickerVisible(true)}
              >
                <View style={styles.countrySelectContent}>
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCountryNameButton={false}
                    withAlphaFilter
                    withCallingCode
                    onSelect={(country) => {
                      setCountryCode(country.cca2);
                      handleInputChange('country', country.name);
                      setCountryPickerVisible(false);
                    }}
                    visible={countryPickerVisible}
                    onClose={() => setCountryPickerVisible(false)}
                  />
                  <Text style={styles.countrySelectText}>
                    {formData.country || t('Select Country')}
                  </Text>
                </View>
                <Icon name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
              {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Documents')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('Upload required documents (Business registration, ID proof, etc.)')}
            </Text>
            
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickImage('document')}
              activeOpacity={0.7}
            >
              <Icon name="upload" size={20} color="#F97316" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>{t('Upload Documents')}</Text>
            </TouchableOpacity>
            
            {documents.length > 0 && (
              <View style={styles.documentsList}>
                {documents.map((doc, index) => (
                  <View key={index} style={styles.documentItem}>
                    <Icon name="file-text" size={20} color="#6B7280" />
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.name || `Document ${index + 1}`}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => removeDocument(index)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="x" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            {errors.documents && <Text style={styles.errorText}>{errors.documents}</Text>}
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{t('Create Store')}</Text>
            )}
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Success!')}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSuccessModal(false)}
              >
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.successIconContainer}>
                <Icon name="check-circle" size={60} color="#10B981" />
              </View>
              
              <Text style={styles.modalMessage}>
                {t('Your store has been created successfully!')}
              </Text>
              
              <Text style={styles.modalSubMessage}>
                {t('Your account is under verification. Please wait for 2-3 working days for your account to be verified. You will be able to access your dashboard after verification.')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.errorIconContainer}>
                <Icon name="alert-circle" size={60} color="#EF4444" />
              </View>
              
              <Text style={styles.modalMessage}>
                {errorModalData.title}
              </Text>
              
              <Text style={styles.modalSubMessage}>
                {errorModalData.message}
              </Text>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.errorButton]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.modalButtonText}>{t('OK')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoUploadButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    borderStyle: 'dashed',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#1F2937',
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  multilineInput: {
    height: 'auto',
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputIcon: {
    marginRight: 4,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  // Phone Input Styles
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    overflow: 'hidden',
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 4,
  },
  callingCode: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    color: '#1F2937',
    fontSize: 14,
    paddingHorizontal: 12,
  },
  // Country Select Styles
  countrySelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  countrySelectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countrySelectText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F97316',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFF7ED',
  },
  uploadButtonText: {
    color: '#F97316',
    fontWeight: '600',
    fontSize: 14,
  },
  documentsList: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentName: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    color: '#4B5563',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#F97316',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
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
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SellerStore;