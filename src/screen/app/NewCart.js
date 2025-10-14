import React, { useCallback, useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Platform,
  SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BackIcon } from '../../../Theme';
import { CartContext } from '../../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen() {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartContext = [], setCartContext] = useContext(CartContext) || [[], () => {}];
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    console.log('Cart Context:', cartContext);
    
    if (!cartContext || !Array.isArray(cartContext) || cartContext.length === 0) {
      console.log('No items in cart, adding sample data for testing');
      const sampleItems = [{
        id: 'test1',
        productName: 'Red Dress',
        variants: [{
          id: 'test1-var',
          name: 'Red Dress',
          price: 400,
          offerPrice: 299,
          image: 'https://via.placeholder.com/200',
          qty: 1
        }],
        deliveryBy: '$50',
        freeShipping: ''
      }];
      setCartItems(sampleItems);
      setLoading(false);
      return;
    }

    const transformedItems = (cartContext || []).map((item, index) => ({
      id: item.productid || `item-${index}`,
      productName: item.productname || 'Product Name',
      originalIndex: index,
      variants: [{
        id: item.productid || `variant-${index}`,
        name: item.vietnamiesName || item.productname || 'Product Variant',
        price: item.price || 0,
        offerPrice: item.offer || item.price || 0,
        image: item.image || 'https://via.placeholder.com/200',
        qty: item.qty || 1
      }],
      deliveryBy: item.isFreeShipping ? 'Free' : '$50',
      freeShipping: item.isFreeShipping ? 'Free Shipping' : ''
    }));
    
    console.log('Transformed Items:', transformedItems);
    setCartItems(transformedItems);
    setLoading(false);
  }, [cartContext]);

  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems(prevSelectedItems => {
      if (prevSelectedItems.includes(itemId)) {
        return prevSelectedItems.filter(id => id !== itemId);
      } else {
        return [...prevSelectedItems, itemId];
      }
    });
  }, []);

  const removeSelectedItems = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to remove');
      return;
    }

    // Get indices of items to remove
    const indicesToRemove = cartItems
      .filter(item => selectedItems.includes(item.id))
      .map(item => item.originalIndex)
      .sort((a, b) => b - a); // Sort in descending order

    // Create new cart array without selected items
    const newCart = [...cartContext];
    indicesToRemove.forEach(index => {
      if (index !== undefined) {
        newCart.splice(index, 1);
      }
    });

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('cartdata', JSON.stringify(newCart));
      
      // Update cart context
      setCartContext(newCart);
      setSelectedItems([]);
      
      console.log('Removed items. New cart length:', newCart.length);
    } catch (error) {
      console.error('Error saving cart data:', error);
      alert('Failed to update cart. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>

        <ActivityIndicator size="large" color="#FF7000" />
      </SafeAreaView>
    );
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.variants[0]?.offerPrice || item.variants[0]?.price || 0;
      const itemQty = item.variants[0]?.qty || 1;
      return total + (itemPrice * itemQty);
    }, 0);
  };

  const totalAmount = calculateTotal();

  console.log('Rendering Cart. Items count:', cartItems.length);
  console.log('Selected items:', selectedItems.length);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Cart {cartItems.length > 0 ? `(${cartItems.length})` : ''}
          </Text>
        </View>

        {/* Remove Button - Show when items are selected */}
        {selectedItems.length > 0 && (
          <View style={styles.removeButtonContainer}>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={removeSelectedItems}
            >
              <Text style={styles.removeButtonText}>
                Remove ({selectedItems.length}) {selectedItems.length === 1 ? 'Item' : 'Items'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cart Items with Flex Layout */}
        <View style={styles.contentWrapper}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <View key={item.id} style={styles.deliverySection}>
                  <View style={styles.deliveryHeader}>
                    <Text style={styles.deliveryText}>Delivery by </Text>
                    <Text style={styles.deliveryPrice}>{item.deliveryBy}</Text>
                    {item.freeShipping && (
                      <Text style={styles.freeShipping}> {item.freeShipping}</Text>
                    )}
                  </View>

                  <Text style={styles.productName}>{item.productName}</Text>

                  {item.variants.map((variant) => (
                    <View key={`${item.id}-${variant.id}`} style={styles.variantCard}>
                      {/* Checkbox */}
                      <TouchableOpacity 
                        style={styles.checkboxContainer}
                        onPress={() => toggleItemSelection(item.id)}
                      >
                        <View style={[
                          styles.checkbox,
                          selectedItems.includes(item.id) && styles.checkboxSelected
                        ]}>
                          {selectedItems.includes(item.id) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      <View style={styles.productImagePlaceholder}>
                        <Image 
                          source={{ uri: variant.image }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.variantInfo}>
                        <Text style={styles.variantName} numberOfLines={2}>
                          {variant.name}
                        </Text>
                        <View style={styles.priceContainer}>
                          {variant.offerPrice && variant.offerPrice !== variant.price ? (
                            <>
                              <Text style={styles.originalPrice}>${variant.price}</Text>
                              <Text style={styles.variantPrice}> ${variant.offerPrice}</Text>
                            </>
                          ) : (
                            <Text style={styles.variantPrice}>${variant.price}</Text>
                          )}
                        </View>
                        <Text style={styles.quantityText}>Qty: {variant.qty || 1}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyCartContainer}>
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
                <TouchableOpacity 
                  style={styles.continueShoppingButton}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.continueShoppingText}>Continue Shopping</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Checkout Section */}
          {cartItems.length > 0 && (
            <View style={styles.checkoutWrapper}>
              <View style={styles.checkoutContainer}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.checkoutButton}
                  onPress={() => {
                    console.log('Proceed to checkout clicked!');
                    navigation.navigate('CheckoutOrder');
                  }}
                >
                  <Text style={styles.checkoutButtonText}>Checkout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FF7000',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  continueShoppingButton: {
    backgroundColor: '#FF7000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
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
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'left',
    flex: 1,
  },
  removeButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  removeButton: {
    backgroundColor: '#FF7000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 16,
    paddingBottom: 180,
  },
  deliverySection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  deliveryPrice: {
    fontSize: 14,
    color: '#666',
  },
  freeShipping: {
    fontSize: 14,
    color: '#FF7000',
    fontWeight: '500',
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  variantCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 12,
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF7000',
    borderColor: '#FF7000',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  checkoutWrapper: {
    backgroundColor: '#fff',
    paddingBottom: 70,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  checkoutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  checkoutButton: {
    backgroundColor: '#FF7000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});