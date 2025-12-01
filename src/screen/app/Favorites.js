import React, { useState, useEffect, useContext } from 'react';
import { CartContext, ToastContext } from '../../../App';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { navigate } from '../../../navigationRef';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';

const Favorites = ({ navigation }) => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [toast, setToast] = useContext(ToastContext);
  const [showQuantityControls, setShowQuantityControls] = useState({});

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (favorites && cartdetail) {
      const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
      const newShowQuantityControls = {};
      
      favorites.forEach(item => {
        const product = item.product || item;
        const existingProduct = existingCart.find(
          f => f.productid === product._id
        );
        
        if (existingProduct && existingProduct.qty > 0) {
          newShowQuantityControls[product._id] = true;
        } else {
          newShowQuantityControls[product._id] = false;
        }
      });
      
      setShowQuantityControls(newShowQuantityControls);
    }
  }, [favorites, cartdetail]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const user = await AsyncStorage.getItem('userDetail');
      if (!user) {
        setError('User not logged in');
        setLoading(false);
        return;
      }
      
      const response = await GetApi('user/getFavourite', {
        params: {
          user_id: JSON.parse(user).id
        }
      });
      console.log('response', response);
      if (response && response.status) {
        setFavorites(response.data || []);
        setError(null);
      } else {
        setError(response?.message || 'Failed to fetch favorites');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('An error occurred while fetching favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      console.log('Attempting to remove from favorites...');
      
      const user = await AsyncStorage.getItem('userDetail');
      if (!user) {
        console.log('User not logged in');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please login to manage favorites',
          visibilityTime: 2000,
        });
        return;
      }
      
      const userId = JSON.parse(user).id;
      
      // Find the product ID from favorites array
      const favoriteItem = favorites.find(fav => fav._id === favoriteId);
      const productId = favoriteItem?.product?._id || favoriteItem?.product;
      
      console.log('Removing favorite for user:', userId, 'product:', productId);
      
      const response = await Post('user/addremovefavourite', { 
        product: productId,  // Product ki ID pass karein
        user_id: userId
      });
      
      console.log('Remove from favorites response:', response);
      
      if (response?.status) {
        console.log('Successfully removed from favorites');
        await fetchFavorites();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Removed from favorites',
          visibilityTime: 2000,
        });
      } else {
        console.log('Failed to remove from favorites:', response?.message || 'Unknown error');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response?.message || 'Failed to remove from favorites',
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove from favorites',
        visibilityTime: 2000,
      });
    }
  };

  const cartdata = async (item) => {
    const product = item.product || item;
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
    
    // Get the selected variant or first variant
    const selectedVariant = product.varients?.[0];
    const variantPrice = parseFloat(selectedVariant?.selected?.[0]?.price) || 0;
    const variantOfferPrice = parseFloat(selectedVariant?.selected?.[0]?.offerprice) || variantPrice;

    // Find existing product in cart
    const existingProduct = existingCart.find(
      f => f.productid === product._id
    );

    if (!existingProduct) {
      // Add new product to cart
      const newProduct = {
        productid: product._id,
        productname: product.name,
        vietnamiesName: product?.vietnamiesName,
        price: variantPrice,
        offer: variantOfferPrice,
        image: selectedVariant?.image?.[0] || '',
        price_slot: product?.price_slot?.[0] || {},
        qty: 1,
        seller_id: product.SellerId,
        slug: product.slug,
        total: variantOfferPrice,
        BarCode: product.BarCode || '',
        isShipmentAvailable: product.isShipmentAvailable !== false,
        isInStoreAvailable: product.isInStoreAvailable !== false,
        isCurbSidePickupAvailable: product.isCurbSidePickupAvailable !== false,
        isNextDayDeliveryAvailable: product.isNextDayDeliveryAvailable !== false,
      };

      const updatedCart = [...existingCart, newProduct];
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
      setToast(t('Successfully added to cart.'));
      setShowQuantityControls(prev => ({ ...prev, [product._id]: true }));
    } else {
      // Update quantity of existing product
      const updatedCart = existingCart.map(_i => {
        if (_i?.productid === product._id) {
          const newQty = _i.qty + 1;
          return { 
            ..._i, 
            qty: newQty,
            total: _i.offer * newQty 
          };
        } else {
          return _i;
        }
      });
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
      setToast(t('Successfully added to cart.'));
    }
  };

  // Render product item
  const renderProduct = ({ item }) => {
    const product = item.product || item;
    const price = product.varients?.[0]?.selected?.[0]?.offerprice || 0;
    const originalPrice = product.varients?.[0]?.selected?.[0]?.price || 0;
    const discount = originalPrice > price 
      ? Math.round(((originalPrice - price) / originalPrice) * 100) 
      : 0;
    const image = product.varients?.[0]?.image?.[0] || 'https://via.placeholder.com/150';
  
    return (
      <View style={styles.productCard}>
        <View style={styles.productRow}>
          <TouchableOpacity 
            onPress={() => {
              // Navigate to product detail using slug or _id
              const productSlug = product.slug || product._id;
              console.log('Navigating to product:', productSlug);
              navigate('Preview', productSlug);
            }}
          >
            <Image 
              source={{ uri: image }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View style={styles.productInfo}>
            <View style={styles.headerRow}>
              <Text 
                style={styles.productName}
                numberOfLines={2}
              >
                {product.name}
              </Text>
              <TouchableOpacity 
                onPress={() => handleRemoveFavorite(item._id)}
                style={styles.favoriteButton}
              >
                <Icon name="heart" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                ${Math.round(price)}
              </Text>
              {originalPrice > price && (
                <Text style={styles.originalPrice}>
                  ${Math.round(originalPrice)}
                </Text>
              )}
              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              )}
            </View>
            
            <View style={styles.cartControlsContainer}>
              {!showQuantityControls[product._id] ? (
                <TouchableOpacity 
                  style={styles.addToCartButton}
                  onPress={async () => {
                    await cartdata(item); 
                  }}
                >
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.quantityControlsWrapper}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={async () => {
                      const existingCart = Array.isArray(cartdetail) ? [...cartdetail] : [];
                      const existingProductIndex = existingCart.findIndex(
                        f => f.productid === product._id
                      );

                      if (existingProductIndex !== -1) {
                        if (existingCart[existingProductIndex].qty > 1) {
                          existingCart[existingProductIndex] = {
                            ...existingCart[existingProductIndex],
                            qty: existingCart[existingProductIndex].qty - 1
                          };
                        } else {
                          existingCart.splice(existingProductIndex, 1);
                          setShowQuantityControls(prev => ({ ...prev, [product._id]: false }));
                        }
                        setcartdetail(existingCart);
                        await AsyncStorage.setItem('cartdata', JSON.stringify(existingCart));
                      }
                    }}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>
                    {(() => {
                      const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
                      const existingProduct = existingCart.find(
                        (f) => f.productid === product._id
                      );
                      return existingProduct ? existingProduct.qty : 0;
                    })()}
                  </Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={async () => {
                      const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
                      const existingProduct = existingCart.find(
                        f => f.productid === product._id
                      );

                      if (existingProduct) {
                        const updatedCart = existingCart.map(_i =>
                          _i.productid === product._id ? { ..._i, qty: _i.qty + 1 } : _i
                        );
                        setcartdetail(updatedCart);
                        await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
                      } else {
                        await cartdata(item);
                      }
                    }}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#FF7000" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchFavorites}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptyMessage}>
        Start adding products to your favorites list
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
      >
        <Text style={styles.shopButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <DriverHeader item={t('My Favorites')} showback={true} />
        
        <FlatList
          data={favorites}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchFavorites}
          refreshing={loading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = {
  safeContainer: {
    flex: 1,
    backgroundColor: '#FF7000',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  listContent: {
    paddingVertical: 16,
    paddingBottom: 90,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  productRow: {
    flexDirection: 'row',
  },
  productImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discountBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 12,
    color: '#dc2626',
  },
  cartControlsContainer: {
    marginTop: 12,
  },
  addToCartButton: {
    backgroundColor: '#FF7000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quantityControlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: '#FF7000',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: 'white',
    fontWeight: '500',
  },
};

export default Favorites;