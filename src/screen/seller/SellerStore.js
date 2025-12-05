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
    country: '',
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
    
    if (errors[field]) {
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
    } else if (!/^[0-9]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      console.log('Validation failed: Invalid phone number format');
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
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
          console.log(`Added ${key}:`, formData[key]);
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
        throw new Error(responseData.message || `Server error: ${response.status}`);
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
    
      if (error.message && error.message.includes('already have a store')) {
        errorMessage = 'You already have a store. You cannot create another one.';
        
     
        Alert.alert(
          'Store Exists',
          errorMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                // Always navigate to 'App' screen
                navigation.navigate('App');
              }
            }
          ]
        );
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Show error toast if not already shown an alert
      if (!error.message || !error.message.includes('already have a store')) {
        toast.show(errorMessage, {
          type: 'danger',
          placement: 'bottom',
          duration: 4000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('App')}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Your Store</Text>
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
        <Text style={styles.uploadText}>Upload Store Logo</Text>
      </View>
    )}
  </TouchableOpacity>
  {errors.logo && <Text style={styles.errorText}>{errors.logo}</Text>}
</View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store Information</Text>
            
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
            
            <InputField
              label="Phone Number*"
              value={formData.phone}
              onChangeText={useCallback((text) => handleInputChange('phone', text), [handleInputChange])}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              error={errors.phone}
              icon="phone"
              key="phone"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store Address</Text>
            
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
            
            <InputField
              label="Country*"
              value={formData.country}
              onChangeText={useCallback((text) => handleInputChange('country', text), [handleInputChange])}
              placeholder="Enter country"
              error={errors.country}
              icon="globe"
              key="country"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <Text style={styles.sectionSubtitle}>
              Upload required documents (Business registration, ID proof, etc.)
            </Text>
            
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickImage('document')}
              activeOpacity={0.7}
            >
              <Icon name="upload" size={20} color="#F97316" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>Upload Documents</Text>
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
              <Text style={styles.submitButtonText}>Create Store</Text>
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
              <Text style={styles.modalTitle}>Success!</Text>
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
                Your store has been created successfully!
              </Text>
              
              <Text style={styles.modalSubMessage}>
                Your account is under verification. Please wait for 2-3 working days for your account to be verified.
                You will be able to access your dashboard after verification.
              </Text>
              
              {/* <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'SellerDashboard' }],
                  });
                }}
              >
                <Text style={styles.modalButtonText}>Continue to Dashboard</Text>
              </TouchableOpacity> */}
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
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SellerStore;