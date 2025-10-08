import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from 'react-native-geolocation-service';

const GOOGLE_MAPS_API_KEY = 'AIzaSyB7uae9_UQGuFbdzHKJq1UXZJDufQUjyME';

const SearchAddressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { onSelectAddress } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState('');


  useEffect(() => {
    setSessionToken(generateSessionToken());
  }, []);

  
  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          
          if (!hasPermission) {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
          }
        } catch (err) {
          console.warn('Permission error:', err);
        }
      }
    };
    
    setTimeout(() => {
      requestPermission();
    }, 500);
  }, []);

  
  const generateSessionToken = () => {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => 
      Math.floor(Math.random() * 16).toString(16)
    );
  };

  
  const fetchPredictions = async (input) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&key=${GOOGLE_MAPS_API_KEY}&sessiontoken=${sessionToken}`
      );

      const data = await response.json();
      
      if (data.status === 'OK') {
        setPredictions(data.predictions || []);
      } else if (data.status === 'ZERO_RESULTS') {
        setPredictions([]);
      } else {
        console.error('API Error:', data.status);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      Alert.alert('Error', 'Failed to fetch address suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Get place details from place_id
  const getPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&sessiontoken=${sessionToken}&fields=address_components,formatted_address,geometry`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        return parseAddressComponents(data.result);
      } else {
        console.error('Place Details Error:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      Alert.alert('Error', 'Failed to fetch address details');
      return null;
    }
  };

  // Parse address components into structured format
  const parseAddressComponents = (place) => {
    const components = place.address_components || [];
    let addressData = {
      street: '',
      building: '',
      city: '',
      state: '',
      country: '',
      countryCode: '', 
      postalCode: '',
      formattedAddress: place.formatted_address || '',
      latitude: place.geometry?.location?.lat || null,
      longitude: place.geometry?.location?.lng || null,
    };

    components.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        addressData.building = component.long_name;
      }
      if (types.includes('route')) {
        addressData.street = component.long_name;
      }
      if (types.includes('locality') || types.includes('postal_town')) {
        addressData.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        addressData.state = component.long_name;
      }
      if (types.includes('country')) {
        addressData.country = component.long_name;
        addressData.countryCode = component.short_name; 
       
      }
      if (types.includes('postal_code')) {
        addressData.postalCode = component.long_name;
      }
    });

    // Combine street number and route for full street address
    if (addressData.building && addressData.street) {
      addressData.street = `${addressData.building} ${addressData.street}`;
      addressData.building = '';
    }

    return addressData;
  };

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    fetchPredictions(text);
  };

  // Handle address selection
  const handleSelectAddress = async (prediction) => {
    setLoading(true);
    const placeDetails = await getPlaceDetails(prediction.place_id);
    setLoading(false);

    if (placeDetails && onSelectAddress) {
      onSelectAddress(placeDetails);
      navigation.goBack();
      setSessionToken(generateSessionToken());
    }
  };

  // Handle use current location
  const handleUseCurrentLocation = async () => {
    
    
    try {
      if (Platform.OS === 'android') {
      
        
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (!hasPermission) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location to find your current address.',
              buttonPositive: 'OK',
              buttonNegative: 'Cancel',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
            return;
          }
        }
        
      }

      setLoading(true);
    
      
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
         
          
          try {
            const baseUrl = 'https://maps.googleapis.com';
            const geocodeUrl = `${baseUrl}/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
            
            
            const response = await fetch(geocodeUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
           
            
            if (data.status === 'OK' && data.results && data.results.length > 0) {
              const place = data.results[0];
              
              
              const addressData = parseAddressComponents(place);
              
              
              if (onSelectAddress) {
                onSelectAddress(addressData);
               
                navigation.goBack();
              }
            } else {
             
              Alert.alert('Error', `Could not fetch address: ${data.status}${data.error_message ? '\n' + data.error_message : ''}`);
            }
          } catch (error) {
           
            Alert.alert('Error', 'Failed to get address from location: ' + error.message);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setLoading(false);
         
          
          let errorMessage = 'Could not get your current location.';
          switch (error.code) {
            case 1:
              errorMessage = 'Location permission denied. Please enable location permissions in settings.';
              break;
            case 2:
              errorMessage = 'Location unavailable. Please check your GPS/Network settings.';
              break;
            case 3:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            case 5:
              errorMessage = 'Location services are disabled. Please enable them in settings.';
              break;
          }
          
          Alert.alert('Location Error', errorMessage);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 20000, 
          maximumAge: 10000,
          showLocationDialog: true,
          forceRequestLocation: true,
        }
      );
    } catch (error) {
      setLoading(false);
      console.error('🔴 Location permission error:', error);
      Alert.alert('Error', 'Failed to get location permission: ' + error.message);
    }
  };

  // Render prediction item
  const renderPredictionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handleSelectAddress(item)}
    >
      <Icon name="location-on" size={20} color="#FF7000" style={styles.locationIcon} />
      <View style={styles.predictionTextContainer}>
        <Text style={styles.predictionMain} numberOfLines={1}>
          {item.structured_formatting?.main_text || item.description}
        </Text>
        <Text style={styles.predictionSecondary} numberOfLines={1}>
          {item.structured_formatting?.secondary_text || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search or enter</Text>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="headset-outline" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.addressLabel}>Address</Text>
            <Text style={styles.asterisk}>*</Text>
          </View>

          <View style={styles.searchContainer}>
            <Icon name="search" size={24} color="#999999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by street, address, or ZIP code"
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus={true}
            />
            {loading && (
              <ActivityIndicator size="small" color="#FF7000" style={styles.loader} />
            )}
          </View>

          <TouchableOpacity 
            style={styles.locationButton}
            onPress={handleUseCurrentLocation}
          >
            <Icon name="my-location" size={22} color="#FF7000" />
            <Text style={styles.locationText}>Use my current location</Text>
          </TouchableOpacity>

          {predictions.length > 0 ? (
            <FlatList
              data={predictions}
              renderItem={renderPredictionItem}
              keyExtractor={(item) => item.place_id}
              style={styles.predictionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            searchQuery.length >= 3 && !loading && (
              <Text style={styles.noResultsText}>No addresses found</Text>
            )
          )}

          {predictions.length === 0 && searchQuery.length < 3 && (
            <Text style={styles.helperText}>
              Or start typing your address to search...
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  supportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  asterisk: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    padding: 0,
  },
  loader: {
    marginLeft: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationText: {
    fontSize: 15,
    color: '#000000',
    marginLeft: 12,
    fontWeight: '400',
  },
  predictionsList: {
    flex: 1,
    marginTop: 8,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  locationIcon: {
    marginRight: 12,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 4,
  },
  predictionSecondary: {
    fontSize: 13,
    color: '#666666',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 40,
  },
  helperText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 20,
  },
});

export default SearchAddressScreen;