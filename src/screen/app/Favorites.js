import React, { useState, useEffect, useContext } from 'react';
import { CartContext, ToastContext } from '../../../App';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import { useIsFocused, useNavigation, CommonActions } from '@react-navigation/native';
import { syncWishlistWithLatestData } from '../../Assets/Helpers/cartSyncHelper';

// Helper function to convert AVIF to JPG for React Native compatibility
const convertAvifToJpg = (imageUrl) => {
  if (imageUrl && imageUrl.includes('.avif')) {
    return imageUrl.replace('.avif', '.jpg');
  }
  return imageUrl;
};

const Favorites = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [, setToast] = useContext(ToastContext);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
     
      fetchFavorites();
      
      /*
      fetchAndSyncFavorites();
      */
    }
  }, [isFocused]);

  const fetchAndSyncFavorites = async () => {
    try {
      setLoading(true);
      setSyncing(true);
      
      // Sync variant wishlist first
      const { changes: wishlistChanges } = await syncWishlistWithLatestData();
      
      // Show changes if any
      if (wishlistChanges.length > 0) {
        const removedCount = wishlistChanges.filter(c => 
          c.type === 'PRODUCT_DELETED' || c.type === 'VARIANT_DELETED'
        ).length;
        
        if (removedCount > 0) {
          Alert.alert(
            t('Wishlist Updated'),
            `${removedCount} item(s) removed (no longer available)`,
            [{ text: t('OK') }]
          );
        }
      }
      
      // Now fetch all favorites
      await fetchFavorites();
      
    } catch (err) {
      console.error('Error syncing favorites:', err);
      await fetchFavorites(); // Fallback to normal fetch
    } finally {
      setSyncing(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const user = await AsyncStorage.getItem('userDetail');
      if (!user) {
        setError('User not logged in');
        setLoading(false);
        return;
      }
      
      
      const response = await GetApi('user/getFavourite');
      console.log(response)
      let backendFavorites = [];
      
      if (response && response.status) {
        // Filter out invalid favorites - check for null products and valid product data
        backendFavorites = (response.data || []).filter(item => {
          const product = item.product || item;
          
          // Skip if product is null or undefined
          if (!product || !product._id || !product.name) {
            return false;
          }
          
          // Check if it's a simple product with simpleProduct data
          if (product.simpleProduct && product.simpleProduct.stock !== undefined) {
            return true;
          }
          
          // Check if it's a variant product with varients data
          if (product.varients && 
              product.varients.length > 0 &&
              product.varients[0].selected &&
              product.varients[0].selected.length > 0) {
            return true;
          }
          
          return false;
        });
      }
      
      // Fetch local variant wishlist
      const localWishlist = await AsyncStorage.getItem('variantWishlist');
      const variantWishlistData = localWishlist ? JSON.parse(localWishlist) : [];
      
      // Convert variant wishlist to favorites format
      const variantFavorites = variantWishlistData.map((item, index) => ({
        _id: `variant-${item.productId}-${index}`,
        isVariant: true,
        product: {
          _id: item.productId,
          name: item.productName,
          slug: item.slug,
          variantAttributes: item.attributes,
          variantImage: item.image,
          variantPrice: item.price,
          variantOfferPrice: item.offerPrice,
          variantStock: item.stock
        }
      }));
      
      // Combine both
      const allFavorites = [...variantFavorites, ...backendFavorites];
      setFavorites(allFavorites);
      setError(null);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('An error occurred while fetching favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId, isVariant = false) => {
    try {
      const user = await AsyncStorage.getItem('userDetail');
      if (!user) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please login to manage favorites',
          visibilityTime: 2000,
        });
        return;
      }
      
      if (isVariant) {
        // Remove from local variant wishlist
        const localWishlist = await AsyncStorage.getItem('variantWishlist');
        let variantWishlistData = localWishlist ? JSON.parse(localWishlist) : [];
        
        // Extract index from favoriteId (format: "variant-productId-index")
        const parts = favoriteId.split('-');
        const index = parseInt(parts[parts.length - 1]);
        
        variantWishlistData.splice(index, 1);
        await AsyncStorage.setItem('variantWishlist', JSON.stringify(variantWishlistData));
        
        setFavorites(prev => prev.filter(fav => fav._id !== favoriteId));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Removed from favorites',
          visibilityTime: 2000,
        });
      } else {
        // Remove from backend
        const userId = JSON.parse(user).id;
        const favoriteItem = favorites.find(fav => fav._id === favoriteId);
        const productId = favoriteItem?.product?._id || favoriteItem?.product;
        
        const response = await Post('user/addremovefavourite', { 
          product: productId,
          user_id: userId
        });
        
        if (response?.status) {
          setFavorites(prev => prev.filter(fav => fav._id !== favoriteId));
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Removed from favorites',
            visibilityTime: 2000,
          });
        }
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

  const getProductQuantity = (productId, variantAttributes = null) => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
    
    if (variantAttributes) {
      // For variant products, match by product ID AND attributes
      // Use order-independent attribute matching
      const product = existingCart.find(item => {
        if (item.productid !== productId) return false;
        
        if (!item.selectedAttributes || !Array.isArray(item.selectedAttributes)) {
          return false;
        }
        
        // Check if all variant attributes match (order-independent)
        const allMatch = variantAttributes.every(wishlistAttr => 
          item.selectedAttributes.some(cartAttr => 
            cartAttr.name === wishlistAttr.name && cartAttr.value === wishlistAttr.value
          )
        );
        
        // Also check reverse - cart shouldn't have extra attributes
        const noExtra = item.selectedAttributes.every(cartAttr =>
          variantAttributes.some(wishlistAttr =>
            wishlistAttr.name === cartAttr.name && wishlistAttr.value === cartAttr.value
          )
        );
        
        return allMatch && noExtra;
      });
      return product ? product.qty : 0;
    } else {
      // For simple products, match by product ID only
      const product = existingCart.find(item => item.productid === productId);
      return product ? product.qty : 0;
    }
  };

  const addToCart = async (item) => {
    const product = item.product || item;
    const isVariant = item.isVariant || false;
    const existingCart = Array.isArray(cartdetail) ? [...cartdetail] : [];
    
    let variantPrice, variantOfferPrice, productImage, selectedAttributes, variantIndex = 0, variantId = null;
    
    if (isVariant) {
      // Variant product from local wishlist - find the exact variant that was wishlisted
      variantPrice = product.variantPrice || 0;
      variantOfferPrice = product.variantOfferPrice || 0;
      productImage = product.variantImage || '';
      selectedAttributes = product.variantAttributes || [];
      
      // IMPORTANT: We need to store the wishlist attributes to find correct variant later
      // The variant index will be determined in Preview.js when the full product data is available
      console.log('🎯 Variant from wishlist with attributes:', product.variantAttributes);
      
      // For variant products from wishlist, we don't have the full product structure here
      // So we'll rely on wishlistVariantAttributes to find the correct variant in Preview.js
      variantIndex = null; // Will be determined in Preview.js
      variantId = null;
    } else {
      // Regular product from backend - prioritize variants over simpleProduct
      if (product.variants && product.variants.length > 0) {
        // New variants structure - find first available variant
        let selectedVariant = null;
        for (let i = 0; i < product.variants.length; i++) {
          const variant = product.variants[i];
          const stock = parseInt(variant.stock) || 0;
          if (stock > 0) {
            selectedVariant = variant;
            variantIndex = i;
            variantId = variant._id;
            break;
          }
        }
        
        // If no variant with stock found, use first variant
        if (!selectedVariant) {
          selectedVariant = product.variants[0];
          variantIndex = 0;
          variantId = selectedVariant._id;
        }
        
        variantPrice = parseFloat(selectedVariant?.price) || 0;
        variantOfferPrice = parseFloat(selectedVariant?.offerPrice) || variantPrice;
        productImage = selectedVariant?.images?.[0] || '';
        selectedAttributes = selectedVariant?.attributes || [];
      } else if (product.varients && product.varients.length > 0) {
        // Old varients structure - find first available variant
        let selectedVariant = null;
        for (let i = 0; i < product.varients.length; i++) {
          const variant = product.varients[i];
          const stock = parseInt(variant.selected?.[0]?.qty) || 0;
          if (stock > 0) {
            selectedVariant = variant;
            variantIndex = i;
            break;
          }
        }
        
        // If no variant with stock found, use first variant
        if (!selectedVariant) {
          selectedVariant = product.varients[0];
          variantIndex = 0;
        }
        
        variantPrice = parseFloat(selectedVariant?.selected?.[0]?.price) || 0;
        variantOfferPrice = parseFloat(selectedVariant?.selected?.[0]?.offerprice) || variantPrice;
        productImage = selectedVariant?.image?.[0] || '';
        
        // Save variant color as attribute if available
        if (selectedVariant?.color) {
          selectedAttributes = [{ name: 'Color', value: selectedVariant.color }];
        }
      } else if (product.simpleProduct) {
        // Fallback to simpleProduct
        variantPrice = parseFloat(product.simpleProduct.price) || 0;
        variantOfferPrice = parseFloat(product.simpleProduct.offerPrice) || variantPrice;
        productImage = product.simpleProduct.images?.[0] || '';
      }
      selectedAttributes = selectedAttributes || null;
    }

    const newProduct = {
      productid: product._id,
      productname: product.name,
      frenchName: product?.frenchName,
      price: variantPrice,
      offer: variantOfferPrice,
      image: productImage,
      price_slot: product?.price_slot?.[0] || {},
      qty: 1,
      seller_id: product.SellerId,
      slug: product.slug,
      total: variantOfferPrice,
      BarCode: product.BarCode || '',
      productType: product.productType || (isVariant ? 'variable' : 'simple'),
      selectedAttributes: selectedAttributes,
      variantIndex: variantIndex, // Save which variant was selected
      variantId: variantId, // Save variant ID for new structure
      // For variant products from wishlist, we need to store the attributes to find correct variant later
      wishlistVariantAttributes: isVariant ? product.variantAttributes : null,
      isShipmentAvailable: product.isShipmentAvailable !== false,
      isInStoreAvailable: product.isInStoreAvailable !== false,
      isCurbSidePickupAvailable: product.isCurbSidePickupAvailable !== false,
      isNextDayDeliveryAvailable: product.isNextDayDeliveryAvailable !== false,
    };

    const updatedCart = [...existingCart, newProduct];
    setcartdetail(updatedCart);
    await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    
    console.log('🛒 Added to cart from Favorites:', {
      productName: newProduct.productname,
      productId: newProduct.productid,
      variantIndex: newProduct.variantIndex,
      variantId: newProduct.variantId,
      selectedAttributes: newProduct.selectedAttributes,
      productType: newProduct.productType
    });
    
    setToast(t('Successfully added to cart.'));
  };

  const increaseQuantity = async (productId, product, variantAttributes = null) => {
    const existingCart = Array.isArray(cartdetail) ? [...cartdetail] : [];
    
    let existingProduct;
    if (variantAttributes) {
      // Use order-independent attribute matching
      existingProduct = existingCart.find(item => {
        if (item.productid !== productId) return false;
        
        if (!item.selectedAttributes || !Array.isArray(item.selectedAttributes)) {
          return false;
        }
        
        // Check if all variant attributes match (order-independent)
        const allMatch = variantAttributes.every(wishlistAttr => 
          item.selectedAttributes.some(cartAttr => 
            cartAttr.name === wishlistAttr.name && cartAttr.value === wishlistAttr.value
          )
        );
        
        const noExtra = item.selectedAttributes.every(cartAttr =>
          variantAttributes.some(wishlistAttr =>
            wishlistAttr.name === cartAttr.name && wishlistAttr.value === cartAttr.value
          )
        );
        
        return allMatch && noExtra;
      });
    } else {
      existingProduct = existingCart.find(f => f.productid === productId);
    }
    
    if (!existingProduct) return;
    
    // Check stock - handle both simpleProduct and varients structure
    let availableStock = 0;
    if (product?.simpleProduct) {
      availableStock = parseInt(product.simpleProduct.stock) || 0;
    } else if (product?.varients?.[0]?.selected?.[0]?.qty) {
      availableStock = parseInt(product.varients[0].selected[0].qty) || 0;
    } else {
      availableStock = product?.variantStock || 0;
    }
    if (existingProduct.qty >= availableStock) {
      Toast.show({
        type: 'error',
        text1: t('Out of Stock'),
        text2: t('Only') + ' ' + availableStock + ' ' + t('items available in stock'),
        visibilityTime: 2000,
      });
      return;
    }
    
    const updatedCart = existingCart.map(_i => {
      if (variantAttributes) {
        // Use order-independent attribute matching
        if (_i.productid === productId && _i.selectedAttributes && Array.isArray(_i.selectedAttributes)) {
          const allMatch = variantAttributes.every(wishlistAttr => 
            _i.selectedAttributes.some(cartAttr => 
              cartAttr.name === wishlistAttr.name && cartAttr.value === wishlistAttr.value
            )
          );
          
          const noExtra = _i.selectedAttributes.every(cartAttr =>
            variantAttributes.some(wishlistAttr =>
              wishlistAttr.name === cartAttr.name && wishlistAttr.value === cartAttr.value
            )
          );
          
          if (allMatch && noExtra) {
            const newQty = _i.qty + 1;
            return { ..._i, qty: newQty, total: _i.offer * newQty };
          }
        }
      } else {
        if (_i.productid === productId) {
          const newQty = _i.qty + 1;
          return { ..._i, qty: newQty, total: _i.offer * newQty };
        }
      }
      return _i;
    });
    
    setcartdetail(updatedCart);
    await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
  };

  const decreaseQuantity = async (productId, variantAttributes = null) => {
    const existingCart = Array.isArray(cartdetail) ? [...cartdetail] : [];
    
    let existingProductIndex;
    if (variantAttributes) {
      // Use order-independent attribute matching
      existingProductIndex = existingCart.findIndex(item => {
        if (item.productid !== productId) return false;
        
        if (!item.selectedAttributes || !Array.isArray(item.selectedAttributes)) {
          return false;
        }
        
        const allMatch = variantAttributes.every(wishlistAttr => 
          item.selectedAttributes.some(cartAttr => 
            cartAttr.name === wishlistAttr.name && cartAttr.value === wishlistAttr.value
          )
        );
        
        const noExtra = item.selectedAttributes.every(cartAttr =>
          variantAttributes.some(wishlistAttr =>
            wishlistAttr.name === cartAttr.name && wishlistAttr.value === cartAttr.value
          )
        );
        
        return allMatch && noExtra;
      });
    } else {
      existingProductIndex = existingCart.findIndex(f => f.productid === productId);
    }

    if (existingProductIndex === -1) return;

    if (existingCart[existingProductIndex].qty > 1) {
      const updatedCart = existingCart.map((_i, index) => {
        if (index === existingProductIndex) {
          const newQty = _i.qty - 1;
          return { ..._i, qty: newQty, total: _i.offer * newQty };
        }
        return _i;
      });
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    } else {
      const updatedCart = existingCart.filter((_, index) => index !== existingProductIndex);
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    }
  };

  const renderProduct = ({ item }) => {
    const product = item.product || item;
    const isVariant = item.isVariant || false;
    
    if (!product || !product._id || !product.name) {
      return null;
    }
    
    let price, originalPrice, image, availableStock, productName, variantDisplay;
    
    if (isVariant) {
      // Variant favorite
      price = product.variantOfferPrice || 0;
      originalPrice = product.variantPrice || 0;
      image = product.variantImage || 'https://via.placeholder.com/150';
      availableStock = product.variantStock || 0;
      productName = product.name;
      
      // Format variant attributes for display
      if (product.variantAttributes && product.variantAttributes.length > 0) {
        variantDisplay = product.variantAttributes.map(attr => {
          // Check if value is a color hex code
          if (attr.value && attr.value.startsWith('#')) {
            return {
              name: attr.name,
              value: attr.value,
              isColor: true
            };
          }
          return {
            name: attr.name,
            value: attr.value,
            isColor: false
          };
        });
      }
    } else {
      // Regular favorite - check for both simpleProduct and varients structure
      if (product.simpleProduct) {
        // New simpleProduct structure
        price = parseFloat(product.simpleProduct.offerPrice) || 0;
        originalPrice = parseFloat(product.simpleProduct.price) || 0;
        image = convertAvifToJpg(product.simpleProduct.images?.[0] || 'https://via.placeholder.com/150');
        availableStock = parseInt(product.simpleProduct.stock) || 0;
      } else {
        // Old varients structure
        price = product.varients?.[0]?.selected?.[0]?.offerprice || 0;
        originalPrice = product.varients?.[0]?.selected?.[0]?.price || 0;
        image = convertAvifToJpg(product.varients?.[0]?.image?.[0] || 'https://via.placeholder.com/150');
        availableStock = parseInt(product.varients?.[0]?.selected?.[0]?.qty) || 0;
      }
      productName = product.name;
    }
    
    const discount = originalPrice > price 
      ? Math.round(((originalPrice - price) / originalPrice) * 100) 
      : 0;
    
    // Get variant attributes for cart tracking
    const variantAttributes = isVariant ? product.variantAttributes : null;
    const quantity = getProductQuantity(product._id, variantAttributes);
    const isStockLimitReached = quantity >= availableStock;

    return (
      <View style={styles.productCard}>
        <View style={styles.productRow}>
          <TouchableOpacity 
            onPress={() => {
              const productSlug = product.slug || product._id;
              navigation.navigate('Preview', productSlug);
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
                {productName}
              </Text>
              <TouchableOpacity 
                onPress={() => handleRemoveFavorite(item._id, isVariant)}
                style={styles.favoriteButton}
              >
                <Icon name="heart" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
            
            {isVariant && variantDisplay && (
              <View style={styles.variantAttributesRow}>
                {variantDisplay.map((attr, index) => (
                  <View key={index} style={styles.variantAttributeItem}>
                    {attr.isColor ? (
                      <View style={styles.colorAttributeContainer}>
                        <View 
                          style={[
                            styles.colorCircleSmall,
                            { backgroundColor: attr.value }
                          ]} 
                        />
                        <Text style={styles.attributeLabel}>{attr.name}</Text>
                      </View>
                    ) : (
                      <View style={styles.textAttributeContainer}>
                        <Text style={styles.attributeLabel}>{attr.name}: </Text>
                        <Text style={styles.attributeValue}>{attr.value}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            
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
            
            <Text style={styles.stockInfo}>
              {availableStock} {t('in stock')}
            </Text>
            
            <View style={styles.cartControlsContainer}>
              {quantity === 0 ? (
                <TouchableOpacity 
                  style={[
                    styles.addToCartButton,
                    isStockLimitReached && styles.addToCartButtonDisabled
                  ]}
                  onPress={() => {
                    if (!isStockLimitReached) {
                      addToCart(item);
                    }
                  }}
                  disabled={isStockLimitReached}
                >
                  <Text style={[
                    styles.addToCartText,
                    isStockLimitReached && styles.addToCartTextDisabled
                  ]}>
                    {isStockLimitReached ? t('Out of Stock') : t('Add to Cart')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.quantityControlsWrapper}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => decreaseQuantity(product._id, variantAttributes)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      isStockLimitReached && styles.quantityButtonDisabled
                    ]}
                    onPress={() => increaseQuantity(product._id, product, variantAttributes)}
                    disabled={isStockLimitReached}
                  >
                    <Text style={[
                      styles.quantityButtonText,
                      isStockLimitReached && styles.quantityButtonTextDisabled
                    ]}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#FF7000" />
          {syncing && <Text style={styles.syncingText}>{t('Syncing wishlist...')}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchFavorites}
          >
            <Text style={styles.retryButtonText}>{t('Retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{t('No Favorites Yet')}</Text>
      <Text style={styles.emptyMessage}>
        {t('Start adding products to your favorites list')}
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => {
          // Navigate to Home tab in the parent tab navigator
          navigation.getParent()?.navigate('Home');
        }}
      >
        <Text style={styles.shopButtonText}>{t('Continue Shopping')}</Text>
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
  syncingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
  variantAttributesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  variantAttributeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorAttributeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  colorCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  textAttributeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attributeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  attributeValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  variantBadge: {
    backgroundColor: '#FFF8F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FF7000',
  },
  variantBadgeText: {
    fontSize: 11,
    color: '#FF7000',
    fontWeight: '600',
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
  stockInfo: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    marginBottom: 8,
    fontWeight: '500',
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
  addToCartButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addToCartTextDisabled: {
    color: '#666666',
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
  quantityButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.5,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityButtonTextDisabled: {
    color: '#999',
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
