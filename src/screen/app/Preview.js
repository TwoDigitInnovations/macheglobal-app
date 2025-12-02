import React, { useState, useEffect, useContext } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
// import Carousel from 'react-native-snap-carousel'
import Constants, { FONTS, Currency } from '../../Assets/Helpers/constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import { GetApi, Post, Delete } from '../../Assets/Helpers/Service';
import { useIsFocused } from '@react-navigation/native';
import { CartContext, ToastContext } from '../../../App';
import Icon from 'react-native-vector-icons/FontAwesome';

const ProductDetail = ({ route, navigation }) => {
  const { t } = useTranslation();
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showQuantityControls, setShowQuantityControls] = useState(false);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [toast, setToast] = useContext(ToastContext);
  const isFlashSale = route.params?.flashSalePrice !== undefined;
const flashSalePrice = route.params?.flashSalePrice || 0;
const flashOriginalPrice = route.params?.originalPrice || 0;
const flashDiscount = route.params?.discount || 0;
  const isFocused = useIsFocused();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  // If route.params is a string, use it as the slug, otherwise try to get slug from params object
  const slug = typeof route.params === 'string' ? route.params : (route.params?.slug || '');
  useEffect(() => {
    if (product && cartdetail) {
      const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
      const existingProduct = existingCart.find(
        f => f.productid === product._id
      );
      
      if (existingProduct && existingProduct.qty > 0) {
        setShowQuantityControls(true);
      } else {
        setShowQuantityControls(false);
      }
    }
  }, [product, cartdetail]);
  useEffect(() => {
    console.log('📦 Route params received:', {
      isFlashSale: route.params?.flashSalePrice !== undefined,
      flashSalePrice: route.params?.flashSalePrice,
      originalPrice: route.params?.originalPrice,
      slug: route.params?.slug
    });
  }, [route.params]);
  useEffect(() => {
    if (slug) {
      fetchProductDetails();
      checkIfInWishlist();
    } else {
      setLoading(false);
    }
  }, [slug, isFocused]);

  const checkIfInWishlist = async () => {
    try {
      const user = await AsyncStorage.getItem('userDetail');
      if (!user) return;
      
      const response = await GetApi('wishlist/check', null, { productId: slug });
      if (response && response.status) {
        setIsInWishlist(response.isInWishlist || false);
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleFavorite = async () => {
    console.log('🔵 Toggle favorite called. Current isInWishlist:', isInWishlist);
    console.log('🔵 Product ID:', product?._id);
    
    try {
      setIsLoadingFavorite(true);
      
      // Get user details
      const user = await AsyncStorage.getItem('userDetail');
      console.log('🔵 User found in AsyncStorage:', !!user);
      
      if (!user) {
        console.log('🔴 No user found, redirecting to login');
        navigation.navigate('Login');
        return;
      }

      if (isInWishlist) {
        // Remove from wishlist
        console.log('🟡 Attempting to remove from wishlist...');
        const response = await Post('user/addremovefavourite', { product: product._id });
        console.log('🟣 Remove from wishlist response:', response);
        
        if (response) {
          console.log('🔵 Remove API Response Status:', response.status);
          console.log('🔵 Response Data:', response.data);
          
          if (response.status) {
            console.log('🟢 Successfully removed from wishlist');
            setIsInWishlist(false);
            setToast({
              show: true,
              message: 'Removed from favorites',
              type: 'success'
            });
          } else {
            console.log('🔴 Failed to remove from wishlist:', response.message || 'Unknown error');
          }
        } else {
          console.log('🔴 No response received from remove wishlist API');
        }
      } else {
        // Add to wishlist
        console.log('🟡 Attempting to add to wishlist...');
        const response = await Post('user/addremovefavourite', { product: product._id });
        console.log('🟣 Add to wishlist response:', response);
        
        if (response) {
          console.log('🔵 Add API Response Status:', response.status);
          console.log('🔵 Response Data:', response.data);
          
          if (response.status) {
            console.log('🟢 Successfully added to wishlist');
            setIsInWishlist(true);
            setToast({
              show: true,
              message: 'Added to favorites',
              type: 'success'
            });
          } else {
            console.log('🔴 Failed to add to wishlist:', response.message || 'Unknown error');
          }
        } else {
          console.log('🔴 No response received from add to wishlist API');
        }
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      setToast({
        show: true,
        message: 'Failed to update favorites',
        type: 'error'
      });
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const renderCarouselItem = ({ item, index }) => {
    return (
      <View style={styles.carouselSlide}>
        <Image
          source={{ uri: item }}
          style={styles.carouselImage}
          resizeMode="contain"
        />
      </View>
    );
  };

  const fetchProductDetails = async () => {
    try {

      console.log('Full API URL:', `${Constants.baseUrl}product/getProductByslug?slug=${slug}`);
    
      setLoading(true);
      setNotFound(false);
      setError(null);
      
     
      const res = await GetApi(`product/getProductByslug?slug=${slug}`);
      
      console.log('API response:', res);
      if (res && res.status) {
        console.log('Product data received:', res.data);
        setProduct(res.data);
        setError(null);
      } else {
        console.log('API returned false status');
        if (res?.message?.includes('Cannot read properties of null')) {
          setNotFound(true);
          setError('Product not found');
        } else {
          setError(res?.message || 'Failed to load product details');
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Error loading product. Please try again.');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Constants.pink} />
      </SafeAreaView>
    );
  }

  // Render not found state
  if (notFound) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
      </SafeAreaView>
    );
  }

  
  if (product && !mainImage && product.varients?.[0]?.image?.[0]) {
    setMainImage(product.varients[0].image[0]);
  }
  const originalPrice = isFlashSale 
  ? flashOriginalPrice 
  : (parseFloat(product?.varients?.[0]?.selected?.[0]?.price) || 0);
  
const discountedPrice = isFlashSale 
  ? flashSalePrice 
  : (parseFloat(product?.varients?.[0]?.selected?.[0]?.offerprice) || originalPrice);

console.log('Final Prices:', { 
  isFlashSale, 
  originalPrice, 
  discountedPrice 
});
  
  const cartdata = async () => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
    
    // Get the selected variant or first variant
    const selectedVariant = product.varients?.[selectedVariant] || product.varients?.[0];
    const variantPrice = parseFloat(selectedVariant?.selected?.[0]?.price) || 0;
    let variantOfferPrice = parseFloat(selectedVariant?.selected?.[0]?.offerprice) || variantPrice;
    
    // Use flash sale price if available
    if (isFlashSale) {
      variantOfferPrice = flashSalePrice;
    }
    
    console.log('Adding to cart - Price:', variantPrice, 'Offer Price:', variantOfferPrice, 'Is Flash Sale:', isFlashSale);

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
        price: isFlashSale ? flashOriginalPrice : variantPrice,
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
  
  // Process variants if available
  const variants = product.varients?.map((variant, index) => ({
    id: variant._id || index,
    name: variant.selected?.[0]?.attributes?.[0]?.value || `Variant ${index + 1}`,
    price: variant.selected?.[0]?.price,
    offerPrice: variant.selected?.[0]?.offerprice,
    inStock: parseInt(variant.selected?.[0]?.qty) > 0,
    stock: variant.selected?.[0]?.qty,
    image: variant.image?.[0] || '',
    colorCode: variant.color_code || '#000000'
  })) || [];
  
  
  const bulkOrders = product?.price_slot?.map(slot => ({
    quantity: `${Currency} ${slot.our_price}`,
    range: `${slot.value} ${slot.unit}`
  })) || [];

  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={product.name || t('Product Details')} showback={true} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.imageContainer}>
          {product.varients?.[selectedVariant]?.image?.length > 0 ? (
            <View style={{ width: '100%', height: 390 }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const slideIndex = Math.round(
                    event.nativeEvent.contentOffset.x / Dimensions.get('window').width
                  );
                  setActiveSlide(slideIndex);
                }}
                scrollEventThrottle={16}
              >
                {product.varients[selectedVariant].image.map((imageUri, index) => (
                  <View key={index} style={styles.carouselSlide}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.carouselImage}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </ScrollView>
              <View style={styles.dotsContainer}>
                {product.varients[selectedVariant].image.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === activeSlide && styles.activeDot
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.noImage}>
              <Text>No Image Available</Text>
            </View>
          )}
        </View>
  
        <View style={styles.detailsContainer}>
          <View style={styles.productHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <TouchableOpacity 
                onPress={toggleFavorite}
                style={[styles.wishlistButton, isInWishlist && styles.wishlistButtonActive]}
                disabled={isLoadingFavorite}
              >
                <Icon 
                  name={isInWishlist ? 'heart' : 'heart-o'} 
                  size={28} 
                  color={isInWishlist ? '#FF0000' : '#333'} 
                />
                {isLoadingFavorite && (
                  <ActivityIndicator size="small" color="#000" style={styles.loader} />
                )}
              </TouchableOpacity>
              
              <View style={styles.quantityContainer}>
                {!showQuantityControls ? (
                  <TouchableOpacity 
                    style={styles.addToCartIcon}
                    onPress={async () => {
                      await cartdata(); 
                      setShowQuantityControls(true);
                    }}
                  >
                    <Text style={styles.plusIcon}>+</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20, marginLeft: 10 }}>
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
                            setShowQuantityControls(false); 
                          }
                          setcartdetail(existingCart);
                          await AsyncStorage.setItem('cartdata', JSON.stringify(existingCart));
                        }
                      }}
                    >
                      <Text style={styles.quantityText}>-</Text>
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
                          await cartdata();
                        }
                      }}
                    >
                      <Text style={styles.quantityText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <Text style={styles.category}>{product.categoryName} • {product.subCategoryName}</Text>
  
          {/* Variants */}
          {product.varients?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Available Variants</Text>
              <View style={styles.variantsContainer}>
                {product.varients.map((variant, index) => {
                  const variantName = variant.selected?.[0]?.attributes?.[0]?.value;
                  
                  return (
                    <TouchableOpacity 
                      key={index}
                      style={[
                        styles.variantItem,
                        selectedVariant === index && styles.selectedVariant
                      ]}
                      onPress={() => {
                        setSelectedVariant(index);
                        setActiveSlide(0); 
                        if (variant.image?.[0]) {
                          setMainImage(variant.image[0]);
                        }
                      }}
                    >
                      {variant.image?.[0] && (
                        <Image 
                          source={{ uri: variant.image[0] }}
                          style={styles.variantItemImage}
                          resizeMode="cover"
                        />
                      )}
                      
                      <Text style={styles.variantText}>
                        {variantName && variantName.trim() !== '' ? variantName : `Variant ${index + 1}`}
                      </Text>
                      <Text style={styles.variantPrice}>
                        {Currency} {variant.selected?.[0]?.offerprice || variant.selected?.[0]?.price}
                      </Text>
                      <Text style={styles.variantStock}>
                        {variant.selected?.[0]?.qty} in stock
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
  
          <View style={styles.priceContainer}>
            {isFlashSale && (
              <View style={styles.flashSaleBadge}>
                <Text style={styles.flashSaleBadgeText}>⚡ FLASH SALE</Text>
              </View>
            )}
            <Text style={styles.price}>{Currency} {discountedPrice.toFixed(2)}</Text>
            {originalPrice > discountedPrice && (
              <Text style={styles.originalPrice}>{Currency} {originalPrice.toFixed(2)}</Text>
            )}
            {originalPrice > discountedPrice && (
              <Text style={styles.discount}>
                {isFlashSale ? flashDiscount : Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}% OFF
              </Text>
            )}
          </View>
  
          <View style={{ marginBottom: 20 }}>
            <View style={styles.descriptionHeader}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TouchableOpacity 
                style={styles.chatWithSellerLink}
                onPress={async () => {
                  const userDetail = await AsyncStorage.getItem('userDetail');
                  if (!userDetail) {
                    navigation.navigate('Login');
                    return;
                  }
                  
                  navigation.navigate('ChatRoom', {
                    sellerId: product.SellerId,
                    sellerName: product.sellerName || 'Seller',
                    sellerImage: product.sellerImage || '',
                    productId: product._id,
                    productName: product.name
                  });
                }}
              >
                <Icon name="comments" size={16} color="#FF7000" style={{ marginRight: 4 }} />
                <Text style={styles.chatWithSellerLinkText}>Chat with Seller</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.description}>
              {(product.long_description || product.short_description || 'No description available')
                .replace(/<[^>]*>/g, '')  
                .replace(/&nbsp;/g, ' ')  
              }
            </Text>
          </View>
  
          {/* Bulk Order Quotes */}
          {bulkOrders.length > 0 && (
            <View style={styles.bulkOrderContainer}>
              <Text style={styles.bulkOrderTitle}>Bulk Order Pricing</Text>
              <View style={styles.bulkOrderRow}>
                {bulkOrders.map((order, index) => (
                  <View key={index} style={styles.bulkOrderItem}>
                    <Text style={styles.bulkQuantity}>{order.quantity}</Text>
                    <Text style={styles.bulkRange}>{order.range}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
  
          {/* Delivery Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivery:</Text>
              <Text style={styles.infoValue}>Standard delivery in 3-5 business days</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Return Policy:</Text>
              <Text style={styles.infoValue}>30 days return policy</Text>
            </View>
          </View>
  
          {/* Reviews Section */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewSectionTitle}>Customer Reviews</Text>
              {product.reviews?.length > 0 && (
                <View style={styles.ratingSummary}>
                  <Text style={styles.averageRating}>{product.rating?.toFixed(1)}</Text>
                  <View style={styles.ratingBreakdown}>
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Text 
                          key={star} 
                          style={[
                            styles.ratingStar,
                            star <= Math.round(product.rating) ? styles.filledStar : styles.emptyStar
                          ]}
                        >
                          ★
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.reviewCount}>
                      ({product.reviews?.length} {product.reviews?.length === 1 ? 'Review' : 'Reviews'})
                    </Text>
                  </View>
                </View>
              )}
            </View>
  
            {product.reviews?.length > 0 ? (
              <View style={styles.reviewsList}>
                {product.reviews.slice(0, 2).map((review, index, arr) => {
                  const isLastItem = index === arr.length - 1;
                  return (
                    <View 
                      key={review._id || index} 
                      style={[
                        styles.reviewItem,
                        isLastItem && styles.lastReviewItem
                      ]}
                    >
                      <View style={styles.reviewerContainer}>
                        <View style={styles.reviewerAvatar}>
                          <Text style={styles.avatarText}>
                            {review.posted_by?.name?.charAt(0).toUpperCase() || 'U'}
                          </Text>
                        </View>
                        <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>
                            {review.posted_by?.name || 'Anonymous User'}
                          </Text>
                          <View style={styles.reviewMeta}>
                            <View style={styles.reviewStars}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Text 
                                  key={star} 
                                  style={[
                                    styles.star,
                                    star <= (review.rating || 0) ? styles.filledStar : styles.emptyStar
                                  ]}
                                >
                                  ★
                                </Text>
                              ))}
                            </View>
                            <Text style={styles.reviewDate}>
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : ''}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {review.description && (
                        <Text style={styles.reviewContent} numberOfLines={3}>
                          {review.description}
                        </Text>
                      )}
                      
                      {review.images?.length > 0 && (
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.reviewGallery}
                          contentContainerStyle={styles.galleryContent}
                        >
                          {review.images.map((img, imgIndex) => (
                            <View key={imgIndex} style={styles.imageWrapper}>
                              <Image 
                                source={{ uri: img.url }}
                                style={styles.reviewImage}
                                resizeMode="cover"
                              />
                            </View>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No Reviews Yet</Text>
                <Text style={styles.emptyStateText}>
                  Be the first to share your thoughts about this product!
                </Text>
              </View>
            )}
          </View>
          
          {product.reviews?.length > 0 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => {
                // Navigate to all reviews screen
                // navigation.navigate('AllReviews', { productId: product._id });
              }}
            >
              <Text style={styles.viewAllText}>View All {product.reviews.length} Reviews</Text>
              <Text style={styles.viewAllIcon}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Set navigation options to hide the default header
ProductDetail.navigationOptions = {
  headerShown: false,
};

export default ProductDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
  },
  imageContainer: {
    width: '100%',
    height: 390, 
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  variantItemImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  detailsContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  category: {
    color: '#666',
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discount: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  chatWithSellerLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatWithSellerLinkText: {
    fontSize: 14,
    color: '#FF7000',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  description: {
    color: '#555',
    lineHeight: 22,
  },
  variantsContainer: {
    marginTop: 10,
  },
  variantItem: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedVariant: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  variantText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#000000',
  },
  variantPrice: {
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  variantStock: {
    color: '#4CAF50',
    fontSize: 14,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  addToCartIcon: {
    backgroundColor: '#FF7000',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent', 
    borderRadius: 20,
    overflow: 'visible', 
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF7000',
  },
  quantityButtonActive: {
    backgroundColor: '#FF7000',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  plusIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Constants.pink,
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#FF7000',
  },
  infoSection: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: Constants.black,
    flex: 1,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 16,
    color: Constants.customgrey,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Constants.black,
    marginRight: 4,
  },
  starText: {
    fontSize: 14,
    color: '#F59E0B',
  },
  section: {
    marginBottom: 20,
  },
  // carouselSlide: {
  //   width: '100%',
  //   height: 390,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   backgroundColor: 'white',
  // },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Constants.black,
  },
  descriptionText: {
    fontSize: 15,
    color: Constants.customgrey,
    lineHeight: 22,
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    gap: 15,
  },
  variantCard: {
    width: '30%',
    margin: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedVariantCard: {
    borderColor: Constants.pink,
    backgroundColor: '#FFF0F0',
  },
  flashSaleBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  flashSaleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  variantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  variantText: {
    fontSize: 12,
    color: Constants.black,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Constants.black,
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountText: {
    color: Constants.pink,
    fontSize: 14,
    fontWeight: '600',
  },
  bulkOrderContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  bulkOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Constants.black,
    marginBottom: 8,
  },
  bulkOrderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  bulkOrderItem: {
    width: '50%',
    padding: 6,
  },
  bulkOrderText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  writeReviewButton: {
    backgroundColor: Constants.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  writeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: Constants.customgrey,
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: Constants.black,
  },

  /* Enhanced Review Section Styles */
  reviewSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  ratingBreakdown: {
    marginLeft: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingStar: {
    fontSize: 16,
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewsList: {
    marginTop: 8,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    marginBottom: 12,
  },
  lastReviewItem: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  reviewerContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF7000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewStars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  star: {
    fontSize: 14,
    marginRight: 2,
  },
  filledStar: {
    color: '#FF7000',
  },
  emptyStar: {
    color: '#E5E7EB',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewContent: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4B5563',
    marginTop: 8,
    marginBottom: 8,
  },
  reviewGallery: {
    marginBottom: 12,
  },
  galleryContent: {
    paddingRight: 16,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  reviewImage: {
    width: '100%',
    height: '100%',
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: '80%',
  },
  primaryButton: {
    backgroundColor: '#FF7000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
    backgroundColor: '#FFF8F2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE5D5',
  },
  viewAllText: {
    color: '#FF7000',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
  },
  viewAllIcon: {
    color: '#FF7000',
    fontSize: 18,
    lineHeight: 18,
    marginTop: -2,
  },
  imageContainer: {
    width: '100%',
    height: 390,
    backgroundColor: 'white',
    marginBottom: 10,
    position: 'relative',
  },
  carouselSlide: {
    width: Dimensions.get('window').width,
    // width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    width: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FF7000',
    width: 20,
  },
  chatWithSellerButton: {
    flexDirection: 'row',
    backgroundColor: '#FF7000',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#FF7000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  chatWithSellerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});