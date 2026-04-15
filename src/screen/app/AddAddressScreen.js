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
import { useTranslation } from 'react-i18next';
import { requireAuth } from '../../Assets/Helpers/authHelper';

const AddAddressScreen = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await requireAuth('AddAddressScreen');
      if (!isAuthenticated) {
        // User will be redirected to SignIn
        return;
      }
    };
    checkAuth();
  }, []);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countryCode, setCountryCode] = useState('HT');
  const [callingCode, setCallingCode] = useState('509'); // Haiti default
  
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

  // Country name to code mapping
  const getCountryCode = (countryName) => {
    const countryMap = {
      'Haiti': 'HT',
      'United States': 'US',
      'Canada': 'CA',
      'Mexico': 'MX',
      'Dominican Republic': 'DO',
      'Jamaica': 'JM',
      'Cuba': 'CU',
      'Puerto Rico': 'PR',
      'India': 'IN',
      'United Kingdom': 'GB',
      'France': 'FR',
      'Germany': 'DE',
      'China': 'CN',
      'Japan': 'JP',
      'Australia': 'AU',
      'Brazil': 'BR',
      // Add more countries as needed
    };
    return countryMap[countryName] || 'HT'; // Default to Haiti if not found
  };

  // Populate form if editing
  useEffect(() => {
    if (isEditMode && existingAddress) {
      console.log('Edit mode - Loading existing address:', existingAddress);
      
      const savedCountry = existingAddress.country || 'Haiti';
      const savedCountryCode = getCountryCode(savedCountry);
      
      console.log('Setting country:', savedCountry, 'with code:', savedCountryCode);
      
      setFormData({
        country: savedCountry,
        fullName: existingAddress.name || '',
        phoneNumber: existingAddress.phone || '',
        address: existingAddress.street || '',
        streetAddress: existingAddress.street || '',
        building: existingAddress.building || '',
        state: existingAddress.state || '',
        city: existingAddress.city || '',
        postalCode: existingAddress.postalCode || '',
      });
      
      // Set the correct country code for the flag
      setCountryCode(savedCountryCode);
      setIsDefaultAddress(existingAddress.isDefault || false);
      
      // Show manual entry if address has details
      if (existingAddress.street || existingAddress.city) {
        setShowManualEntry(true);
      }
    }
  }, [isEditMode, existingAddress]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveAddress = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.phoneNumber || !formData.streetAddress || 
        !formData.city || !formData.state || !formData.postalCode) {
      Alert.alert(t('Error'), t('Please fill in all required fields'));
      return;
    }

    // Validate postal code (3-10 characters, alphanumeric with spaces/hyphens)
    const postalCodeRegex = /^[a-zA-Z0-9\s-]{3,10}$/;
    if (!postalCodeRegex.test(formData.postalCode)) {
      Alert.alert(
        t('Invalid Postal Code'), 
        t('Postal code must be 3-10 characters (letters, numbers, spaces, or hyphens)')
      );
      return;
    }

    // Validate phone number (7-15 digits)
    const phoneRegex = /^[0-9]{7,15}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      Alert.alert(
        t('Invalid Phone Number'), 
        t('Phone number must be 7-15 digits')
      );
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
              t('Address Limit Reached'),
              t('You can only create up to 5 addresses. Please delete an old address to create a new one.'),
              [{ text: t('OK') }]
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
            message: isEditMode ? t('Address updated successfully') : t('Address added successfully')
          });
        } else {
          // Default navigation
          navigation.navigate('CheckoutOrder', { 
            savedAddress: savedAddress
          });
        }
      } else {
        throw new Error(response.message || t('Something went wrong'));
      }
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert(t('Error'), error.message || t('Failed to save address. Please try again.'));
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
            {isEditMode ? t('Edit Address') : t('Add a new address')}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Country / Region */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('Country / Region')}</Text>
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
            <Text style={styles.label}>{t('Full Name or company name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('Full Name')}
              placeholderTextColor="#CCCCCC"
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('Phone Number')}</Text>
            <View style={styles.phoneInputWrapper}>
              <TouchableOpacity
                style={styles.countryCodeButton}
                onPress={() => setCountryPickerVisible(true)}
              >
                <Text style={styles.flagEmoji}>{getCountryFlag(countryCode)}</Text>
                <Text style={styles.callingCodeText}>+{getCallingCodeFromCountry(countryCode)}</Text>
                <Icon name="keyboard-arrow-down" size={16} color="#666666" />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                placeholder={t('Phone Number')}
                placeholderTextColor="#CCCCCC"
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({...formData, phoneNumber: text.replace(/[^0-9]/g, '')})}
                maxLength={15}
              />
            </View>
          </View>

          {/* Country Picker Modal */}
          <CountryPicker
            countryCode={countryCode}
            withFilter
            withFlag
            withCallingCode
            withEmoji
            onSelect={(country) => {
              console.log('Country selected:', country);
              setCountryCode(country.cca2);
              setCallingCode(country.callingCode[0]);
              setFormData({
                ...formData,
                country: country.name,
              });
            }}
            visible={countryPickerVisible}
            onClose={() => setCountryPickerVisible(false)}
            containerButtonStyle={{ display: 'none' }}
          />

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('Address')}</Text>
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
                {formData.address || t('Search by street address, or ZIP code')}
              </Text>
            </TouchableOpacity>
            
            {/* Enter Manually Button */}
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => setShowManualEntry(!showManualEntry)}
            >
              <Text style={styles.manualText}>{t('Enter manually')}</Text>
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
                <Text style={styles.label}>{t('Street Address*')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter street address')}
                  placeholderTextColor="#CCCCCC"
                  value={formData.streetAddress}
                  onChangeText={(text) => setFormData({...formData, streetAddress: text})}
                />
              </View>

              {/* Building, Apt */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('Building, Apt (optional)')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Building, Apartment, Suite, etc.')}
                  placeholderTextColor="#CCCCCC"
                  value={formData.building}
                  onChangeText={(text) => setFormData({...formData, building: text})}
                />
              </View>

              {/* State/Province */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('State/Province*')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter state or province')}
                  placeholderTextColor="#CCCCCC"
                  value={formData.state}
                  onChangeText={(text) => setFormData({...formData, state: text})}
                />
              </View>

              {/* City */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('City*')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter city')}
                  placeholderTextColor="#CCCCCC"
                  value={formData.city}
                  onChangeText={(text) => setFormData({...formData, city: text})}
                />
              </View>

              {/* Postal Code */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('Postal Code*')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter postal code')}
                  placeholderTextColor="#CCCCCC"
                  value={formData.postalCode}
                  onChangeText={(text) => {
                    // Allow alphanumeric, spaces, and hyphens only
                    const cleaned = text.replace(/[^a-zA-Z0-9\s-]/g, '').toUpperCase();
                    setFormData({...formData, postalCode: cleaned});
                  }}
                  maxLength={10}
                  autoCapitalize="characters"
                />
                <Text style={styles.helperText}>
                  {t('Provide the exact postal code of your address to ensure delivery to the correct location')}
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
              <Text style={styles.checkboxLabel}>{t('Set as your default address')}</Text>
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
                {isEditMode ? t('Update Address') : t('Save Address')}
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
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    backgroundColor: '#F9FAFB',
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 4,
  },
  callingCodeText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000000',
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