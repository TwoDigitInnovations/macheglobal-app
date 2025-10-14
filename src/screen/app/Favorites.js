import React, { useState, useEffect, useContext } from 'react';
import { CartContext } from '../../../App';
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

const Favorites = () => {
  const [quantities, setQuantities] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartdetail, setcartdetail] = useContext(CartContext);

  useEffect(() => {
    fetchFavorites();
  }, []);

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

  const handleAddToCart = async (item) => {
    try {
      console.log('Starting add to cart process...');
      const user = await AsyncStorage.getItem('userDetail');
      
      if (!user) {
        console.log('User not logged in');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please login to add items to cart',
          visibilityTime: 2000,
        });
        return;
      }

      const product = item.product || item;
      console.log('Product data:', JSON.stringify(product, null, 2));
      
      const variant = product.varients?.[0]?.selected?.[0];
      console.log('Selected variant:', variant);
      
      if (!variant) {
        const errorMsg = 'No variant available for this product';
        console.log(errorMsg);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMsg,
          visibilityTime: 2000,
        });
        return;
      }

      // Get existing cart from context
      const existingCart = Array.isArray(cartdetail) ? [...cartdetail] : [];
      
      // Find if product already exists in cart
      const existingProductIndex = existingCart.findIndex(
        cartItem => cartItem.productid === product._id
      );

      if (existingProductIndex === -1) {
        // Product not in cart, add new item
        const newItem = {
          productid: product._id,
          productname: product.name,
          product_image: product.varients?.[0]?.image?.[0] || '',
          price: variant.price || 0,
          offerprice: variant.offerprice || variant.price || 0,
          qty: 1,
          total: variant.offerprice || variant.price || 0,
          variant_id: variant._id,
          variant_name: variant.name || 'Default',
          user_id: JSON.parse(user).id,
          isNextDayDeliveryAvailable: product.isNextDayDeliveryAvailable !== false,
        };
        
        existingCart.push(newItem);
      } else {
        // Product exists, update quantity
        const existingItem = existingCart[existingProductIndex];
        const newQty = (existingItem.qty || 0) + 1;
        
        existingCart[existingProductIndex] = {
          ...existingItem,
          qty: newQty,
          total: (variant.offerprice || variant.price || 0) * newQty
        };
      }

      // Update context and local storage
      setcartdetail(existingCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(existingCart));
      
      // Update local quantities state
      setQuantities(prev => ({
        ...prev,
        [product._id]: (prev[product._id] || 0) + 1
      }));
      
      console.log('Cart updated successfully');
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Added to cart',
        visibilityTime: 2000,
      });
      
    } catch (error) {
      console.error('Error in handleAddToCart:', {
        message: error.message,
        stack: error.stack
      });
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add to cart. Please try again.',
        visibilityTime: 3000,
      });
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
          <Image 
            source={{ uri: image }} 
            style={styles.productImage}
            resizeMode="cover"
          />
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
            
            {quantities[item._id] === undefined || quantities[item._id] === 0 ? (
              <TouchableOpacity
                onPress={() => handleAddToCart(item)}
                style={styles.addToCartButton}
              >
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityContainer}>
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    onPress={() => setQuantities(prev => ({ 
                      ...prev, 
                      [item._id]: Math.max(0, (prev[item._id] || 1) - 1) 
                    }))}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantities[item._id] || 0}</Text>
                  <TouchableOpacity
                    onPress={() => setQuantities(prev => ({ 
                      ...prev, 
                      [item._id]: Math.min(10, (prev[item._id] || 1) + 1) 
                    }))}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Favorites</Text>
        </View>
        
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
  addToCartButton: {
    marginTop: 12,
    backgroundColor: '#FF7000',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addToCartText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  quantityContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
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