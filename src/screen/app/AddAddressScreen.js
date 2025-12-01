import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CountryPicker from 'react-native-country-picker-modal';
import { Post, Put, GetApi } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddAddressScreen = ({ route }) => {
  const navigation = useNavigation();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countryCode, setCountryCode] = useState('HT');
  
  // Check if we're in edit mode
  const isEditMode = route.params?.editMode || false;
  const existingAddress = route.params?.existingAddress;
  const addressId = route.params?.addressId;
  
  const [formData, setFormData] = useState({
    country: 'Haiti',
    fullName: '',
    phoneNumber: '',
    address: '',
    streetAddress: '',
    building: '',
    state: '',
    city: '',
    postalCode: '',
  });

  // Populate form if editing
  useEffect(() => {
    if (isEditMode && existingAddress) {
      console.log('Edit mode - Loading existing address:', existingAddress);
      setFormData({
        country: existingAddress.country || 'Haiti',
        fullName: existingAddress.name || '',
        phoneNumber: existingAddress.phone || '',
        address: existingAddress.street || '',
        streetAddress: existingAddress.street || '',
        building: existingAddress.building || '',
        state: existingAddress.state || '',
        city: existingAddress.city || '',
        postalCode: existingAddress.postalCode || '',
      });
      setIsDefaultAddress(existingAddress.isDefault || false);
      
      // Show manual entry if address has details
      if (existingAddress.street || existingAddress.city) {
        setShowManualEntry(true);
      }
    }
  }, [isEditMode, existingAddress]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveAddress = async () => {
    if (!formData.fullName || !formData.phoneNumber || !formData.streetAddress || 
        !formData.city || !formData.state || !formData.postalCode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      // Check address limit only when creating new address (not editing)
      if (!isEditMode) {
        const addressesResponse = await GetApi('addresses');
        if (addressesResponse.success && addressesResponse.data) {
          if (addressesResponse.data.length >= 5) {
            Alert.alert(
              'Address Limit Reached',
              'You can only create up to 5 addresses. Please delete an old address to create a new one.',
              [{ text: 'OK' }]
            );
            setIsLoading(false);
            return;
          }
        }
      }
      
      // First, handle default address if needed
      if (isDefaultAddress) {
        try {
          // If setting as default, first update all other addresses to non-default
          await Put('addresses/set-default', {
            addressId: isEditMode ? addressId : null,
            isDefault: true
          });
        } catch (error) {
          console.warn('Could not set as default:', error);
          // Continue with saving the address even if setting default fails
        }
      }

      const addressData = {
        name: formData.fullName,
        phone: formData.phoneNumber,
        street: formData.streetAddress || formData.address,
        building: formData.building || '',
        city: formData.city,
        state: formData.state,
        country: formData.country || 'Haiti',
        postalCode: formData.postalCode,
        isDefault: isDefaultAddress,
      };
      
      let response;
      
      if (isEditMode && addressId) {
        // Update existing address
        response = await Put(`addresses/${addressId}`, addressData);
      } else {
        // Create new address
        response = await Post('addresses', addressData);
      }

      if (response.success) {
        const savedAddress = response.data || addressData;
        
        // If this is a new default address, update the local storage
        if (savedAddress.isDefault) {
          await AsyncStorage.setItem('lastUsedAddress', JSON.stringify(savedAddress));
        }
        
        // Navigate back based on where we came from
        if (route.params?.fromCheckout) {
          // If coming from checkout, go back to checkout with the new address
          navigation.navigate('CheckoutOrder', { 
            savedAddress: savedAddress
          });
        } else if (route.params?.fromAddressList || isEditMode) {
          // If from address list, refresh the list
          navigation.navigate('AddressListScreen', {
            refresh: true,
            message: isEditMode ? 'Address updated successfully' : 'Address added successfully'
          });
        } else {
          // Default navigation
          navigation.navigate('CheckoutOrder', { 
            savedAddress: savedAddress
          });
        }
      } else {
        throw new Error(response.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', error.message || 'Failed to save address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectCountry = (country) => {
    setCountryCode(country.cca2);
    setFormData({
      ...formData,
      country: country.name,
    });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#FF7000" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Address' : 'Add a new address'}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Country / Region */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Country / Region</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setCountryPickerVisible(true)}
            >
              <View style={styles.countryFlag}>
                <CountryPicker
                  countryCode={countryCode}
                  visible={countryPickerVisible}
                  onSelect={onSelectCountry}
                  onClose={() => setCountryPickerVisible(false)}
                  withFlag
                  withFilter
                  withCountryNameButton={false}
                  withAlphaFilter
                  withCallingCode
                  withEmoji
                  containerButtonStyle={styles.countryPickerButton}
                />
                <Text style={styles.dropdownText}>{formData.country}</Text>
              </View>
              <Icon name="keyboard-arrow-down" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name or company name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#CCCCCC"
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#CCCCCC"
              keyboardType="phone-pad"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
            />
          </View>

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TouchableOpacity 
              style={styles.addressInputContainer}
              onPress={() => {
                console.log('Navigating to SearchAddressScreen');
                navigation.navigate('SearchAddressScreen', {
                  onSelectAddress: (selectedAddress) => {
                    console.log('Selected address:', selectedAddress);
                    
                    const formattedDisplay = selectedAddress.formattedAddress || 
                      `${selectedAddress.street || ''}${selectedAddress.city ? ', ' + selectedAddress.city : ''}${selectedAddress.state ? ', ' + selectedAddress.state : ''}${selectedAddress.postalCode ? ' ' + selectedAddress.postalCode : ''}`;
                    
                    setFormData({
                      ...formData,
                      address: formattedDisplay,
                      streetAddress: selectedAddress.street || '',
                      city: selectedAddress.city || '',
                      state: selectedAddress.state || '',
                      country: selectedAddress.country || formData.country,
                      postalCode: selectedAddress.postalCode || '',
                      building: selectedAddress.building || '',
                    });
                    
                    if (selectedAddress.countryCode) {
                      setCountryCode(selectedAddress.countryCode);
                    }
                    if (selectedAddress.street || selectedAddress.city) {
                      setShowManualEntry(true);
                    }
                  }
                });
              }}
            >
              <Icon name="search" size={20} color="#999999" style={styles.searchIcon} />
              <Text 
                style={[
                  styles.addressInput, 
                  !formData.address && { color: '#CCCCCC' }
                ]}
                numberOfLines={2}
                pointerEvents="none"
              >
                {formData.address || 'Search by street address, or ZIP code'}
              </Text>
            </TouchableOpacity>
            
            {/* Enter Manually Button */}
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => setShowManualEntry(!showManualEntry)}
            >
              <Text style={styles.manualText}>Enter manually</Text>
              <Icon 
                name={showManualEntry ? "keyboard-arrow-up" : "keyboard-arrow-right"} 
                size={18} 
                color="#000000" 
              />
            </TouchableOpacity>
          </View>

          {/* Manual Entry Fields */}
          {showManualEntry && (
            <View style={styles.manualEntrySection}>
              {/* Street Address */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Street Address*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter street address"
                  placeholderTextColor="#CCCCCC"
                  value={formData.streetAddress}
                  onChangeText={(text) => setFormData({...formData, streetAddress: text})}
                />
              </View>

              {/* Building, Apt */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Building, Apt (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Building, Apartment, Suite, etc."
                  placeholderTextColor="#CCCCCC"
                  value={formData.building}
                  onChangeText={(text) => setFormData({...formData, building: text})}
                />
              </View>

              {/* State/Province */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>State/Province*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter state or province"
                  placeholderTextColor="#CCCCCC"
                  value={formData.state}
                  onChangeText={(text) => setFormData({...formData, state: text})}
                />
              </View>

              {/* City */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>City*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter city"
                  placeholderTextColor="#CCCCCC"
                  value={formData.city}
                  onChangeText={(text) => setFormData({...formData, city: text})}
                />
              </View>

              {/* Postal Code */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Postal Code*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter postal code"
                  placeholderTextColor="#CCCCCC"
                  keyboardType="number-pad"
                  value={formData.postalCode}
                  onChangeText={(text) => setFormData({...formData, postalCode: text})}
                />
                <Text style={styles.helperText}>
                  Provide the exact postal code of your address to ensure delivery to the correct location
                </Text>
              </View>
            </View>
          )}

          {/* Set as Default Checkbox */}
          <View style={styles.checkboxWrapper}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setIsDefaultAddress(!isDefaultAddress)}
            >
              <View style={styles.checkbox}>
                {isDefaultAddress && (
                  <Icon name="check" size={16} color="#000000" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Set as your default address</Text>
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            onPress={handleSaveAddress}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Update Address' : 'Save Address'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FF7000',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF7000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  countryFlag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryPickerButton: {
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 15,
    color: '#000000',
  },
  addressInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  addressInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    padding: 0,
    lineHeight: 20,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 12,
  },
  manualText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
    flex: 1,
    textDecorationLine: 'underline',
  },
  manualEntrySection: {
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    lineHeight: 16,
  },
  checkboxWrapper: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#FF7000',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  disabledButton: {
    backgroundColor: '#FFA366',
  },
  saveButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default AddAddressScreen;