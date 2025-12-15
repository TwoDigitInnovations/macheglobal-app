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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BackIcon } from '../../../Theme';
import { CartContext } from '../../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export default function CartScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartContext = [], setCartContext] = useContext(CartContext) || [[], () => {}];
  const [selectedItems, setSelectedItems] = useState([]);

  // Refresh cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadCart = async () => {
        try {
          const savedCart = await AsyncStorage.getItem('cartdata');
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setCartContext(parsedCart);
          } else {
            setCartContext([]);
          }
        } catch (error) {
          console.error('Error loading cart:', error);
          setCartContext([]);
        }
      };
      
      loadCart();
    }, [])
  );

  useEffect(() => {
    console.log('Cart Context:', cartContext);
    
    if (!cartContext || !Array.isArray(cartContext) || cartContext.length === 0) {
      console.log('Cart is empty');
      setCartItems([]);
      setLoading(false);
      return;
    }

    const transformedItems = (cartContext || []).map((item, index) => ({
      id: item.productid || `item-${index}`,
      productName: item.productname || 'Product Name',
      originalIndex: index,
      variants: [{
        id: item.productid || `variant-${index}`,
        productId: item.productid,
        slug: item.slug,
        name: item.frenchName || item.productname || 'Product Variant',
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

  const updateQuantity = async (itemIndex, change) => {
    if (itemIndex === undefined) return;

    const newCart = [...cartContext];
    const currentQty = newCart[itemIndex].qty || 1;
    const newQty = currentQty + change;

    // If quantity becomes 0 or less, remove the item
    if (newQty <= 0) {
      removeItem(itemIndex);
      return;
    }

    // Update quantity
    newCart[itemIndex].qty = newQty;

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('cartdata', JSON.stringify(newCart));
      
      // Update cart context
      setCartContext(newCart);
      
      console.log(`Updated quantity for item ${itemIndex}: ${newQty}`);
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert(t('Failed to update quantity. Please try again.'));
    }
  };

  const removeItem = async (itemIndex) => {
    if (itemIndex === undefined) return;

    const newCart = [...cartContext];
    newCart.splice(itemIndex, 1);

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('cartdata', JSON.stringify(newCart));
      
      // Update cart context
      setCartContext(newCart);
      
      console.log('Item removed. New cart length:', newCart.length);
    } catch (error) {
      console.error('Error removing item:', error);
      alert(t('Failed to remove item. Please try again.'));
    }
  };

  const removeSelectedItems = async () => {
    if (selectedItems.length === 0) {
      alert(t('Please select items to remove'));
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
      alert(t('Failed to update cart. Please try again.'));
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
            {t('Cart')} {cartItems.length > 0 ? `(${cartItems.length})` : ''}
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
                {t('Remove')} ({selectedItems.length}) {selectedItems.length === 1 ? t('Item') : t('Items')}
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
              cartItems.map((item, itemIndex) => (
                <View key={item.id} style={styles.deliverySection}>
                  {itemIndex === 0 && (
                    <View style={styles.deliveryHeader}>
                      <Text style={styles.deliveryText}>{t('Estimated Delivery: ')}</Text>
                      <Text style={styles.deliveryPrice}>{t('3-5 Business Days')}</Text>
                    </View>
                  )}

                  {item.variants.map((variant) => (
                    <View key={`${item.id}-${variant.id}`} style={styles.variantCard}>
                      <TouchableOpacity 
                        style={styles.productImagePlaceholder}
                        onPress={() => navigation.navigate('Preview', variant.slug || variant.productId)}
                      >
                        <Image 
                          source={{ uri: variant.image }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                      
                      <View style={styles.variantInfo}>
                        <View style={styles.nameAndRemove}>
                          <Text style={styles.variantName} numberOfLines={2}>
                            {variant.name}
                          </Text>
                          <TouchableOpacity 
                            style={styles.removeIcon}
                            onPress={() => removeItem(item.originalIndex)}
                          >
                            <Text style={styles.removeIconText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        
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
                        
                        {/* Quantity Controls */}
                        <View style={styles.quantityControls}>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateQuantity(item.originalIndex, -1)}
                          >
                            <Text style={styles.quantityButtonText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.quantityValue}>{variant.qty || 1}</Text>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateQuantity(item.originalIndex, 1)}
                          >
                            <Text style={styles.quantityButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyCartContainer}>
                <Text style={styles.emptyCartText}>{t('Your cart is empty')}</Text>
                <TouchableOpacity 
                  style={styles.continueShoppingButton}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.continueShoppingText}>{t('Continue Shopping')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Checkout Section */}
          {cartItems.length > 0 && (
            <View style={styles.checkoutWrapper}>
              <View style={styles.checkoutContainer}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>{t('Total')}</Text>
                  <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.checkoutButton}
                  onPress={() => {
                    console.log('Proceed to checkout clicked!');
                    navigation.navigate('CheckoutOrder');
                  }}
                >
                  <Text style={styles.checkoutButtonText}>{t('Checkout')}</Text>
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
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  removeButton: {
    backgroundColor: '#FF7000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
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
    marginBottom: 8,
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

  variantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  nameAndRemove: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  removeIcon: {
    padding: 2,
    marginLeft: 4,
  },
  removeIconText: {
    color: '#374151',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 20,
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
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: '#FF7000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
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