import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GetApi, Delete, Put } from '../../Assets/Helpers/Service';
import { useTranslation } from 'react-i18next';

const AddressListScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  // State variables
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch addresses from API
  const fetchAddresses = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await GetApi('addresses');
      if (response.success) {
        // Sort addresses to show default address first
        const sortedAddresses = response.data ? [...response.data].sort((a, b) => 
          (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)
        ) : [];
        setAddresses(sortedAddresses);
      } else {
        throw new Error(response.message || 'Failed to fetch addresses');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', error.message || 'Failed to load addresses');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and refresh when focused
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
      
      // Show success message if coming from Add/Edit screen
      if (route.params?.message) {
        Alert.alert(t('Success'), route.params.message);
        // Clear the message from params
        navigation.setParams({ message: undefined });
      }
    }, [route.params?.message])
  );

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Handle address selection for checkout
  const handleSelectAddress = (address) => {
    console.log('Address selected:', address);
    
    if (route.params?.fromCheckout) {
      // If we have a callback, use it
      if (route.params.onSelectAddress) {
        console.log('Using callback to return address');
        route.params.onSelectAddress(address);
      } else {
        // If no callback, navigate back with the selected address
        console.log('Navigating back with address');
        navigation.navigate({
          name: 'CheckoutOrder',
          params: { 
            selectedAddress: address,
            timestamp: new Date().getTime() // Add timestamp to force re-render
          },
          merge: true
        });
      }
      // Go back to the previous screen (CheckoutOrder)
      navigation.goBack();
    } else {
      // If not from checkout, just navigate to checkout with the selected address
      console.log('Navigating to CheckoutOrder with address');
      navigation.navigate('CheckoutOrder', { 
        selectedAddress: address,
        timestamp: new Date().getTime() // Add timestamp to force re-render
      });
    }
  };

  // Navigate to edit address screen
  const handleEditAddress = (address) => {
    navigation.navigate('AddAddressScreen', {
      editMode: true,
      existingAddress: address,
      addressId: address._id,
      fromAddressList: true
    });
  };

  // Set address as default
  const handleSetDefault = async (addressId) => {
    try {
      const response = await Put(`addresses/${addressId}/set-default`, {});
      if (response.success) {
        // Update the addresses list to reflect the new default
        const updatedAddresses = addresses.map(addr => ({
          ...addr,
          isDefault: addr._id === addressId ? true : false
        }));
        setAddresses(updatedAddresses);
      } else {
        throw new Error(response.message || 'Failed to set default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert(t('Error'), error.message || t('Failed to set default address'));
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await Delete(`addresses/${addressId}`);
      if (response.success) {
        // Remove the deleted address from the list
        setAddresses(addresses.filter(addr => addr._id !== addressId));
      } else {
        throw new Error(response.message || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      Alert.alert(t('Error'), error.message || t('Failed to delete address'));
    }
  };
  // Show loading indicator if still loading
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7000" />
      </View>
    );
  }

  // Render the main content
  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#FF7000" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Icon name="location-on" size={24} color="#FFFFFF" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>{t('My Address')}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchAddresses}
              colors={['#FF7000']}
              tintColor="#FF7000"
            />
          }
        >
          {/* Add New Address Button */}
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => {
              if (addresses.length >= 5) {
                Alert.alert(
                  t('Address Limit Reached'),
                  t('You can only create up to 5 addresses. Please delete an old address to create a new one.'),
                  [{ text: t('OK') }]
                );
              } else {
                navigation.navigate('AddAddressScreen', { fromAddressList: true });
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.addNewContent}>
              <View style={styles.addNewIconContainer}>
                <Icon name="add-location" size={26} color="#FF7000" />
              </View>
              <View style={styles.addNewTextContainer}>
                <Text style={styles.addNewText}>{t('Add New Address')}</Text>
                <Text style={styles.addNewSubtext}>{t('Save a delivery location')}</Text>
              </View>
              <View style={styles.chevronContainer}>
                <Icon name="chevron-right" size={24} color="#FF7000" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Address List */}
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Icon name="location-off" size={70} color="#CCCCCC" />
              </View>
              <Text style={styles.emptyText}>No saved addresses</Text>
              <Text style={styles.emptySubtext}>
                Add your first delivery address to get started
              </Text>
            </View>
          ) : (
            addresses.map((address) => (
              <TouchableOpacity
                key={address._id}
                style={[
                  styles.addressCard,
                  address.isDefault && styles.defaultAddressCard
                ]}
                onPress={() => handleSelectAddress(address)}
                activeOpacity={route.params?.fromCheckout ? 0.7 : 1}
              >
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Icon name="verified" size={14} color="#FFFFFF" style={styles.badgeIcon} />
                    <Text style={styles.defaultText}>{t('Default')}</Text>
                  </View>
                )}

                {/* Location Icon Background */}
                <View style={styles.locationIconBg}>
                  <Icon name="place" size={24} color="#FF7000" />
                </View>

                {/* Address Details */}
                <View style={styles.addressDetails}>
                  <View style={styles.nameRow}>
                    <Icon name="person" size={16} color="#666666" />
                    <Text style={styles.addressName}>{address.name}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Icon name="phone" size={14} color="#999999" />
                    <Text style={styles.addressPhone}>{address.phone}</Text>
                  </View>
                  
                  <View style={styles.addressTextContainer}>
                    <Text style={styles.addressStreet}>{address.street}</Text>
                    <Text style={styles.addressCity}>
                      {address.city}, {address.state}
                    </Text>
                    <Text style={styles.addressCountry}>{address.country}</Text>
                    <View style={styles.postalRow}>
                      <Icon name="mail" size={13} color="#999999" />
                      <Text style={styles.addressPostal}>{address.postalCode}</Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {/* Edit Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditAddress(address)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconCircle}>
                      <Icon name="edit" size={18} color="#FF7000" />
                    </View>
                  </TouchableOpacity>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteAddress(address._id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconCircle, styles.deleteIconCircle]}>
                      <Icon name="delete-outline" size={18} color="#E74C3C" />
                    </View>
                  </TouchableOpacity>

                  {/* Set as Default Button */}
                  {!address.isDefault && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.defaultButton]}
                      onPress={() => handleSetDefault(address._id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconCircle, styles.defaultIconCircle]}>
                        <Icon name="check-circle" size={18} color="#27AE60" />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
          
          {/* {addresses.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Icon name="location-off" size={70} color="#CCCCCC" />
              </View>
              <Text style={styles.emptyText}>No saved addresses</Text>
              <Text style={styles.emptySubtext}>
                Add your first delivery address to get started
              </Text>
            </View>
          )} */}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#FF7000',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    backgroundColor: '#FF7000',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 22,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  addNewButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderWidth: 1.5,
    borderColor: '#FF7000',
    borderStyle: 'dashed',
  },
  addNewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  addNewIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addNewTextContainer: {
    flex: 1,
  },
  addNewText: {
    fontSize: 15,
    color: '#FF7000',
    fontWeight: '700',
    marginBottom: 1,
  },
  addNewSubtext: {
    fontSize: 11,
    color: '#FF8C33',
    fontWeight: '400',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  defaultAddressCard: {
    borderColor: '#FF7000',
    borderWidth: 1.5,
    elevation: 5,
    shadowColor: '#FF7000',
    shadowOpacity: 0.15,
  },
  defaultBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7000',
    elevation: 2,
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  badgeIcon: {
    marginRight: 3,
  },
  defaultText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  locationIconBg: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  addressDetails: {
    marginBottom: 10,
    paddingRight: 75,
    paddingLeft: 50,
    paddingTop: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  addressPhone: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginLeft: 5,
  },
  addressTextContainer: {
    paddingLeft: 2,
  },
  addressStreet: {
    fontSize: 12,
    color: '#333333',
    lineHeight: 17,
    marginBottom: 2,
    fontWeight: '500',
  },
  addressCity: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  addressCountry: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 3,
  },
  postalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressPostal: {
    fontSize: 11,
    color: '#999999',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 8,
    gap: 6,
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  actionButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  deleteIconCircle: {
    backgroundColor: '#FFEBEE',
  },
  defaultIconCircle: {
    backgroundColor: '#E8F5E9',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AddressListScreen;