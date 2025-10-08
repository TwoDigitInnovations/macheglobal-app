import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CartContext } from '../../../App';
import { Post } from '../../Assets/Helpers/Service';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderSuccess from '../../components/OrderSuccess';

const CheckoutOrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [cartContext, setCartContext] = useContext(CartContext) || [];
  const [cartItems, setCartItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    
    const getUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        console.log('User data from AsyncStorage:', userData); 
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log('Parsed user data:', parsedUser);
          setUser(parsedUser.user || parsedUser); 
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    
    getUser();
    
    console.log('Checkout - Cart Context:', cartContext);
    
    if (!cartContext || cartContext.length === 0) {
      console.log('No items in checkout');
      setCartItems([]);
      return;
    }

    const transformedItems = cartContext.map((item, index) => ({
      id: item.productid || `item-${index}`,
      name: item.vietnamiesName || item.productname || 'Product Variant Name',
      price: item.offer || item.price || 0,
      originalPrice: item.price || 0,
      image: item.image || 'https://via.placeholder.com/200',
      qty: item.qty || 1,
      deliveryBy: item.deliveryBy || '20th, Sep 2025',
      isFreeShipping: item.isFreeShipping || false
    }));
    
    console.log('Checkout - Transformed Items:', transformedItems);
    setCartItems(transformedItems);
  }, [cartContext]);

  
  const loadLastUsedAddress = async () => {
    try {
      // First check if we have a newly selected address from navigation params
      if (route.params?.selectedAddress) {
        console.log('Using newly selected address from params');
        setDeliveryAddress(route.params.selectedAddress);
        // Save this as last used address
        await AsyncStorage.setItem('lastUsedAddress', JSON.stringify(route.params.selectedAddress));
        return;
      }
      
      // Then check for saved address from navigation params (for backward compatibility)
      if (route.params?.savedAddress) {
        console.log('Using saved address from navigation params');
        setDeliveryAddress(route.params.savedAddress);
        return;
      }
      
      // Finally, try to load from AsyncStorage
      const lastUsedAddress = await AsyncStorage.getItem('lastUsedAddress');
      if (lastUsedAddress) {
        console.log('Loaded last used address from storage');
        setDeliveryAddress(JSON.parse(lastUsedAddress));
      }
    } catch (error) {
      console.warn('Error loading last used address:', error);
    }
  };

  
  // Handle address updates when params change
  useEffect(() => {
    console.log('Route params changed:', route.params);
    
    const loadAddress = async () => {
      try {
        // If we have a selected address in params, use it
        if (route.params?.selectedAddress) {
          console.log('Setting address from params:', route.params.selectedAddress);
          setDeliveryAddress(route.params.selectedAddress);
          // Save to AsyncStorage for persistence
          await AsyncStorage.setItem('lastUsedAddress', JSON.stringify(route.params.selectedAddress));
          return;
        }
        
        // Otherwise load from storage
        await loadLastUsedAddress();
      } catch (error) {
        console.warn('Error handling address update:', error);
      }
    };
    
    loadAddress();
    
    // Set up focus listener
    const unsubscribe = navigation.addListener('focus', loadLastUsedAddress);
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [route.params?.selectedAddress, route.params?.timestamp]); // Add timestamp to dependencies

  
  const groupItemsByDelivery = () => {
    const groups = {};
    
    cartItems.forEach(item => {
      const deliveryKey = item.deliveryBy;
      if (!groups[deliveryKey]) {
        groups[deliveryKey] = {
          deliveryDate: deliveryKey,
          isFreeShipping: item.isFreeShipping,
          items: []
        };
      }
      groups[deliveryKey].items.push(item);
    });
    
    return Object.values(groups);
  };

  const deliveryGroups = groupItemsByDelivery();

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.qty);
    }, 0);
  };

  const handleChangeAddress = () => {
    console.log('Change address clicked - navigating to AddressListScreen');
    // Navigate to address list screen and wait for the result
    navigation.navigate('AddressListScreen', { 
      fromCheckout: true,
      onSelectAddress: (selectedAddress) => {
        console.log('Selected address in Checkout:', selectedAddress);
        setDeliveryAddress(selectedAddress);
        // Also save to AsyncStorage for persistence
        AsyncStorage.setItem('lastUsedAddress', JSON.stringify(selectedAddress));
      }
    });
  };

  const handleAddAddress = () => {
    console.log('Add address clicked - navigating to AddAddressScreen');
    // Navigate directly to add address screen
    navigation.navigate('AddAddressScreen', {
      fromCheckout: true
    });
  };

  const setAsDefaultAddress = async (addressId) => {
    try {
      const response = await Post(`addresses/${addressId}/set-default`, {});
      if (!response.success) {
        throw new Error('Failed to set default address');
      }
      return true;
    } catch (error) {
      console.warn('Error setting default address:', error);
      return false;
    }
  };

  // Save the selected address to AsyncStorage
  const saveLastUsedAddress = async (address) => {
    try {
      await AsyncStorage.setItem('lastUsedAddress', JSON.stringify(address));
    } catch (error) {
      console.warn('Failed to save last used address:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }
    
    // Save the selected address for future use
    await saveLastUsedAddress(deliveryAddress);
    
    // Set the selected address as default before placing the order
    if (!deliveryAddress.isDefault) {
      const isSetDefault = await setAsDefaultAddress(deliveryAddress._id);
      if (!isSetDefault) {
        console.warn('Could not set address as default');
      }
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    
    // Get user ID from the delivery address
    const userId = deliveryAddress.user;
    if (!userId) {
      Alert.alert('Error', 'Unable to process order. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare order data
      console.log('Current user object:', user); // Debug log
      
      // Use the user ID from the delivery address
      const orderData = {
        user: deliveryAddress.user,
        orderItems: cartItems.map(item => ({
          product: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          image: item.image,
        })),
        shippingAddress: {
          address: deliveryAddress.street || '',
          city: deliveryAddress.city || '',
          postalCode: deliveryAddress.postalCode || '',
          country: deliveryAddress.country || '',
          phone: deliveryAddress.phone || '',
          name: deliveryAddress.name || '',
        },
        paymentMethod: selectedPayment,
        itemsPrice: calculateTotal(),
        taxPrice: 0, // You can calculate tax if needed
        shippingPrice: 0, // Free shipping for now
        totalPrice: calculateTotal(),
      };

      
      
     
      const response = await Post('orders', orderData);
      console.log('Order API Response:', response);
      
      if (response.success) {
        // Clear the cart first
        setCartContext([]);
        
        // Navigate to success screen with order details
        navigation.replace('OrderSuccess', {
          orderNumber: response.data._id || 'ORD' + Math.floor(100000 + Math.random() * 900000),
          totalAmount: response.data.totalPrice || calculateTotal()
        });
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      Alert.alert('Error', error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{flex: 1}}>
      <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FF7000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <StatusBar barStyle="light-content" backgroundColor="#FF7000" />
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Delivery Info */}
          <View style={styles.deliverySection}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryLabel}>Delivering to:</Text>
              {deliveryAddress && (
                <TouchableOpacity 
                  onPress={handleChangeAddress}
                  style={styles.changeButton}
                >
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {deliveryAddress ? (
              // Show saved address
              <View style={styles.addressContainer}>
                <View style={styles.addressTextContainer}>
                  <Text style={styles.userName}>{deliveryAddress.name}</Text>
                  <Text style={styles.phone}>{deliveryAddress.phone}</Text>
                  <Text style={styles.address}>
                    {deliveryAddress.street}
                  </Text>
                  <Text style={styles.addressDetail}>
                    {deliveryAddress.city}, {deliveryAddress.state}, {deliveryAddress.country}
                  </Text>
                </View>
              </View>
            ) : (
              // Show Add Address button
              <TouchableOpacity 
                style={styles.addAddressButton}
                onPress={handleAddAddress}
              >
                <View style={styles.addAddressContent}>
                  <Icon name="add-location" size={24} color="#FF7000" />
                  <Text style={styles.addAddressText}>Add Delivery Address</Text>
                </View>
                <Icon name="chevron-right" size={28} color="#CCCCCC" />
              </TouchableOpacity>
            )}
          </View>

          {/* Dynamic Delivery Groups */}
          {cartItems.length > 0 ? (
            deliveryGroups.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.deliveryGroup}>
                <View style={styles.deliveryDateHeader}>
                  <Text style={styles.deliveryDate}>
                    Delivery by {group.deliveryDate}
                  </Text>
                  {group.isFreeShipping && (
                    <Text style={styles.freeShipping}> Free Shipping</Text>
                  )}
                </View>
                
                <View style={styles.productsRow}>
                  {group.items.map((item, itemIndex) => (
                    itemIndex % 2 === 0 && (
                      <React.Fragment key={item.id}>
                        <View style={styles.productCard}>
                          <Image 
                            source={{ uri: item.image }} 
                            style={styles.productImage} 
                          />
                          <Text style={styles.productName} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <View style={styles.priceRow}>
                            {item.originalPrice !== item.price && (
                              <Text style={styles.originalPrice}>
                                ${item.originalPrice}
                              </Text>
                            )}
                            <Text style={styles.productPrice}>
                              ${item.price}
                            </Text>
                          </View>
                          {item.qty > 1 && (
                            <Text style={styles.qtyText}>Qty: {item.qty}</Text>
                          )}
                        </View>

                        {group.items[itemIndex + 1] && (
                          <View style={styles.productCard}>
                            <Image 
                              source={{ uri: group.items[itemIndex + 1].image }} 
                              style={styles.productImage} 
                            />
                            <Text style={styles.productName} numberOfLines={2}>
                              {group.items[itemIndex + 1].name}
                            </Text>
                            <View style={styles.priceRow}>
                              {group.items[itemIndex + 1].originalPrice !== group.items[itemIndex + 1].price && (
                                <Text style={styles.originalPrice}>
                                  ${group.items[itemIndex + 1].originalPrice}
                                </Text>
                              )}
                              <Text style={styles.productPrice}>
                                ${group.items[itemIndex + 1].price}
                              </Text>
                            </View>
                            {group.items[itemIndex + 1].qty > 1 && (
                              <Text style={styles.qtyText}>
                                Qty: {group.items[itemIndex + 1].qty}
                              </Text>
                            )}
                          </View>
                        )}
                      </React.Fragment>
                    )
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items in cart</Text>
            </View>
          )}

          {/* Payment Method */}
          {cartItems.length > 0 && (
            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Select Payment Method:</Text>
              
              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => setSelectedPayment('card')}
              >
                <View style={styles.radioButton}>
                  {selectedPayment === 'card' && <View style={styles.radioButtonSelected} />}
                </View>
                <View style={styles.cardIcon}>
                  <Ionicons name="card-outline" size={18} color="#666666" />
                </View>
                <Text style={styles.paymentText}>Add a new card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => setSelectedPayment('wallet')}
              >
                <View style={styles.radioButton}>
                  {selectedPayment === 'wallet' && <View style={styles.radioButtonSelected} />}
                </View>
                <View style={styles.walletIcon}>
                  <Ionicons name="wallet-outline" size={20} color="#666666" />
                </View>
                <Text style={styles.paymentText}>Wallet</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Price Summary */}
          {cartItems.length > 0 && (
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>${calculateTotal().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery:</Text>
                <Text style={styles.summaryValueFree}>Free</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Place Order Button */}
        {cartItems.length > 0 && (
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity 
              style={styles.placeOrderButton}
              onPress={handlePlaceOrder}
              disabled={!deliveryAddress || cartItems.length === 0 || isLoading}
            >
              <Text style={styles.placeOrderText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FF7000',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: 'white',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'left',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  deliverySection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryLabel: {
    fontSize: 13,
    color: '#666666',
  },
  changeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeText: {
    fontSize: 14,
    color: '#FF7000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  placeOrderButton: {
    backgroundColor: '#FF7000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    opacity: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  phone: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  addressDetail: {
    fontSize: 13,
    color: '#666666',
  },
  addAddressButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addAddressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addAddressText: {
    fontSize: 15,
    color: '#FF7000',
    fontWeight: '600',
    marginLeft: 12,
  },
  deliveryGroup: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 12,
  },
  deliveryDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  deliveryDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  freeShipping: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  productsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  productImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginBottom: 8,
  },
  productName: {
    fontSize: 13,
    color: '#000000',
    marginBottom: 4,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  qtyText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  paymentSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000000',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
  },
  cardIcon: {
    width: 40,
    height: 28,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 14,
    color: '#000000',
  },
  walletIcon: {
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  summaryValueFree: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  bottomButtonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  placeOrderButton: {
    backgroundColor: '#FF7000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default CheckoutOrderScreen;