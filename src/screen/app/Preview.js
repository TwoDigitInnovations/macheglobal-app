import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
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
import { isUserLoggedIn } from '../../Assets/Helpers/authHelper';
import { reset } from '../../../navigationRef';

// Helper function to convert AVIF to JPG for React Native compatibility
const convertAvifToJpg = (imageUrl) => {
  if (imageUrl && imageUrl.includes('.avif')) {
    return imageUrl.replace('.avif', '.jpg');
  }
  return imageUrl;
};

const ProductDetail = ({ route, navigation }) => {
  const { t } = useTranslation();
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null); // Track selected size within variant
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
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const hasAutoSelectedVariant = useRef(false); // Track if we've auto-selected variant
  
  // Reset auto-selection flag when user manually changes variant
  const handleVariantChange = (variantIndex, keepSize = null) => {
    // Prevent any auto-selection interference
    hasAutoSelectedVariant.current = true;
    
    // Immediately set the variant
    setSelectedVariant(variantIndex);
    
    // Reset selected size when variant changes, unless we want to keep a specific size
    if (keepSize) {
      setSelectedSize(keepSize);
    } else {
      setSelectedSize(null);
    }
  };
  
  // Memoize hasColorAttribute to prevent it from changing on re-renders
  const hasColorAttribute = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) {
      return false;
    }
    
    return product.variants.some(v => 
      v.attributes?.some(attr => attr.name.toLowerCase() === 'color')
    );
  }, [product?.variants]); // Only recalculate when variants array changes
  
  // If route.params is a string, use it as the slug, otherwise try to get slug from params object
  const slug = typeof route.params === 'string' ? route.params : (route.params?.slug || '');
  useEffect(() => {
    if (product && cartdetail) {
      const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
      const isVariableProduct = product.productType === 'variable' && product.variants?.length > 0;
      
      // Only auto-select variant from cart on initial product load, not on every cart/variant change
      if (isVariableProduct && !hasAutoSelectedVariant.current) {
        const cartItemForThisProduct = existingCart.find(f => f.productid === product._id);
        
        console.log('🔍 Auto-selection check:', {
          hasAutoSelectedVariant: hasAutoSelectedVariant.current,
          cartItemFound: !!cartItemForThisProduct,
          cartItemVariantIndex: cartItemForThisProduct?.variantIndex,
          cartItemAttributes: cartItemForThisProduct?.selectedAttributes,
          wishlistAttributes: cartItemForThisProduct?.wishlistVariantAttributes,
          currentSelectedVariant: selectedVariant
        });
        
        if (cartItemForThisProduct) {
          let correctVariantIndex = selectedVariant; // Default to current selection
          
          // Method 1: Use variantIndex if available and valid (not null)
          if (cartItemForThisProduct.variantIndex !== undefined && 
              cartItemForThisProduct.variantIndex !== null &&
              cartItemForThisProduct.variantIndex >= 0 &&
              cartItemForThisProduct.variantIndex < product.variants.length) {
            correctVariantIndex = cartItemForThisProduct.variantIndex;
          }
          // Method 2: Check for wishlistVariantAttributes (from Favorites screen) - PRIORITY
          else if (cartItemForThisProduct.wishlistVariantAttributes && cartItemForThisProduct.wishlistVariantAttributes.length > 0) {
            const matchingVariantIndex = product.variants.findIndex(variant => {
              const variantAttributes = variant.attributes || [];
              
              // Check if wishlist attributes match variant attributes
              return cartItemForThisProduct.wishlistVariantAttributes.every(wishlistAttr => 
                variantAttributes.some(variantAttr => 
                  variantAttr.name === wishlistAttr.name && variantAttr.value === wishlistAttr.value
                )
              );
            });
            
            if (matchingVariantIndex !== -1) {
              correctVariantIndex = matchingVariantIndex;
            }
          }
          // Method 3: Find variant by matching selectedAttributes
          else if (cartItemForThisProduct.selectedAttributes && cartItemForThisProduct.selectedAttributes.length > 0) {
            const matchingVariantIndex = product.variants.findIndex(variant => {
              const variantAttributes = variant.attributes || [];
              
              // Check if all cart attributes match variant attributes
              return cartItemForThisProduct.selectedAttributes.every(cartAttr => 
                variantAttributes.some(variantAttr => 
                  variantAttr.name === cartAttr.name && variantAttr.value === cartAttr.value
                )
              );
            });
            
            if (matchingVariantIndex !== -1) {
              correctVariantIndex = matchingVariantIndex;
            }
          }
          
          // Only change if we found a different variant
          if (correctVariantIndex !== selectedVariant) {
            console.log('🎯 Using cart variantIndex:', correctVariantIndex);
            setSelectedVariant(correctVariantIndex);
            
            // Also set selectedSize if cart item has a size attribute
            if (cartItemForThisProduct.selectedAttributes && Array.isArray(cartItemForThisProduct.selectedAttributes)) {
              const sizeAttr = cartItemForThisProduct.selectedAttributes.find(attr => attr.name.toLowerCase() === 'size');
              if (sizeAttr) {
                setSelectedSize(sizeAttr.value);
              }
            }
            
            hasAutoSelectedVariant.current = true; // Mark as auto-selected
            return; // Exit early, let the effect run again with new selectedVariant
          } else {
            console.log('✅ Current variant is already correct:', selectedVariant);
            
            // Even if variant is correct, set selectedSize if not already set
            if (!selectedSize && cartItemForThisProduct.selectedAttributes && Array.isArray(cartItemForThisProduct.selectedAttributes)) {
              const sizeAttr = cartItemForThisProduct.selectedAttributes.find(attr => attr.name.toLowerCase() === 'size');
              if (sizeAttr) {
                setSelectedSize(sizeAttr.value);
              }
            }
            
            hasAutoSelectedVariant.current = true; // Mark as processed to prevent further auto-selection
          }
        } else {
          console.log('⚠️ No cart item found, marking as processed');
          hasAutoSelectedVariant.current = true; // Mark as processed
        }
      } else {
        console.log('🔍 Skipping auto-selection:', {
          isVariableProduct,
          hasAutoSelectedVariant: hasAutoSelectedVariant.current
        });
      }
      
      let existingProduct;
      if (isVariableProduct && selectedVariant !== null && product.variants?.[selectedVariant]) {
        // For variable products, check by product ID AND selected variant attributes AND selected size
        const selectedAttributes = product.variants[selectedVariant]?.attributes || [];
        
        // If user has selected a specific size, we need to match that size
        let attributesToMatch = selectedAttributes;
        if (selectedSize) {
          // Filter to only match the selected size
          attributesToMatch = selectedAttributes.filter(attr => 
            attr.name.toLowerCase() === 'size' && attr.value === selectedSize
          );
          // Also include non-size attributes (like color)
          const nonSizeAttrs = selectedAttributes.filter(attr => attr.name.toLowerCase() !== 'size');
          attributesToMatch = [...nonSizeAttrs, ...attributesToMatch];
        }
        
        // Debug: Check if we need to look in old varients structure for attributes
        let variantAttributesForMatching = attributesToMatch;
        if (attributesToMatch.length === 0 && product.varients?.[selectedVariant]) {
          // Try old varients structure - check for color
          if (product.varients[selectedVariant].color) {
            variantAttributesForMatching = [{ name: 'Color', value: product.varients[selectedVariant].color }];
          }
        }
        
        existingProduct = existingCart.find(f => {
          if (f.productid !== product._id) return false;
          
          // If selectedSize is set, we need strict size matching
          if (selectedSize) {
            // Only match if the cart item has the exact size we're looking for
            if (!f.selectedAttributes || !Array.isArray(f.selectedAttributes)) {
              return false;
            }
            
            const cartItemSize = f.selectedAttributes.find(attr => attr.name.toLowerCase() === 'size');
            if (!cartItemSize || cartItemSize.value !== selectedSize) {
              return false;
            }
            
            // Also verify variant matches
            const variantMatches = (
              (f.variantIndex !== undefined && f.variantIndex === selectedVariant) ||
              (f.variantId && product.variants[selectedVariant]?._id === f.variantId)
            );
            
            if (variantMatches) {
              return true;
            }
            
            return false;
          }
          
          // Original matching logic when no size is selected
          // Handle multiple cases for attribute matching:
          // 1. Both have null selectedAttributes
          if (f.selectedAttributes === null && variantAttributesForMatching.length === 0) {
            return true;
          }
          // 2. Both have empty arrays
          if (Array.isArray(f.selectedAttributes) && f.selectedAttributes.length === 0 && variantAttributesForMatching.length === 0) {
            return true;
          }
          // 3. Check if cart item's variantIndex matches current selectedVariant
          if (f.variantIndex !== undefined && f.variantIndex !== null && f.variantIndex === selectedVariant) {
            return true;
          }
          // 4. Check if cart item's variantId matches current variant's ID
          if (f.variantId && product.variants[selectedVariant]?._id === f.variantId) {
            return true;
          }
          // 5. Check wishlist attributes match current variant (PRIORITY for Favorites)
          if (f.wishlistVariantAttributes && f.wishlistVariantAttributes.length > 0) {
            const wishlistMatch = f.wishlistVariantAttributes.every(wishlistAttr => 
              variantAttributesForMatching.some(variantAttr => 
                variantAttr.name === wishlistAttr.name && variantAttr.value === wishlistAttr.value
              )
            );
            if (wishlistMatch) {
              return true;
            }
          }
          // 6. Check selectedAttributes match current variant
          if (f.selectedAttributes && f.selectedAttributes.length > 0 && variantAttributesForMatching.length > 0) {
            const attributesMatch = f.selectedAttributes.every(cartAttr => 
              variantAttributesForMatching.some(variantAttr => 
                variantAttr.name === cartAttr.name && variantAttr.value === cartAttr.value
              )
            );
            if (attributesMatch) {
              return true;
            }
          }
          // 7. Exact attribute match (fallback)
          if (JSON.stringify(f.selectedAttributes) === JSON.stringify(variantAttributesForMatching)) {
            return true;
          }
          
          return false;
        });
      } else {
        // For simple products, check by product ID only
        existingProduct = existingCart.find(
          f => f.productid === product._id
        );
      }
      
      if (existingProduct && existingProduct.qty > 0) {
        setShowQuantityControls(true);
      } else {
        setShowQuantityControls(false);
      }
    }
  }, [product, cartdetail, isFocused, selectedVariant, selectedSize]);
  useEffect(() => {
  }, [route.params]);
  useEffect(() => {
    if (slug) {
      fetchProductDetails();
    } else {
      setLoading(false);
    }
  }, [slug, isFocused]);

  // Check wishlist after product is loaded AND when screen comes into focus AND when variant changes
  useEffect(() => {
    if (product && product._id && isFocused) {
      checkIfInWishlist();
    }
  }, [product, isFocused, selectedVariant, selectedSize]);

  // Update main image when selectedVariant changes
  useEffect(() => {
    if (product && selectedVariant !== null) {
      const isVariableProduct = product.productType === 'variable' && product.variants?.length > 0;
      
      if (isVariableProduct && product.variants?.[selectedVariant]) {
        // Update image for the selected variant
        const selectedVariantData = product.variants[selectedVariant];
        if (selectedVariantData?.images?.[0]) {
          setMainImage(convertAvifToJpg(selectedVariantData.images[0]));
          setActiveSlide(0);
        } else {
        }
      } else if (!isVariableProduct && product.simpleProduct?.images?.[0]) {
        // For simple products, use simpleProduct images
        setMainImage(convertAvifToJpg(product.simpleProduct.images[0]));
      }
    }
  }, [product, selectedVariant]);

  const checkIfInWishlist = async () => {
    try {
      const user = await AsyncStorage.getItem('userDetail');
      if (!user) {
        setIsInWishlist(false);
        setWishlistCount(0);
        return;
      }
      
      // Wait for product to be loaded first
      if (!product || !product._id) {
        return;
      }
      // Get all favorites and check if current product is in the list
      const response = await GetApi('user/getFavourite');
      
      // Get local variant wishlist count
      const localWishlist = await AsyncStorage.getItem('variantWishlist');
      const variantWishlistData = localWishlist ? JSON.parse(localWishlist) : [];
      const variantWishlistCount = variantWishlistData.length;
      
      if (response && response.status && response.data) {
        // Filter out null/deleted products and products without proper data
        const validFavorites = response.data.filter(fav => {
          const product = fav.product;
          
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
        
        // Set total wishlist count (backend + local variants)
        const totalCount = validFavorites.length + variantWishlistCount;
        setWishlistCount(totalCount);
        
        // Check if current product with current variant is in favorites
        const isVariableProduct = product.productType === 'variable' && product.variants?.length > 0;
        
        if (isVariableProduct && selectedVariant !== null && product.variants?.[selectedVariant]) {
          // For variable products, check local storage for variant-specific wishlist
          let selectedAttributes = product.variants[selectedVariant]?.attributes || [];
          
          // Add Color from old varients structure if not in attributes
          const hasColor = selectedAttributes.some(attr => attr.name.toLowerCase() === 'color');
          if (!hasColor && product.varients?.[selectedVariant]?.color) {
            selectedAttributes = [
              ...selectedAttributes,
              { name: 'Color', value: product.varients[selectedVariant].color }
            ];
          }
          
          // Filter by selectedSize if one is selected (same logic as cart detection)
          let attributesToMatch = selectedAttributes;
          if (selectedSize) {
            attributesToMatch = selectedAttributes.filter(attr => 
              attr.name.toLowerCase() === 'size' && attr.value === selectedSize
            );
            console.log('🔍 Wishlist check - filtering by size:', selectedSize, 'Attributes:', attributesToMatch);
          } else {
            console.log('🔍 Wishlist check - NO size selected, checking all attributes:', selectedAttributes);
          }
          
          const isVariantInWishlist = variantWishlistData.some(item => {
            if (item.productId !== product._id) return false;
            
            console.log('🔍 Comparing wishlist item:', {
              itemAttributes: item.attributes,
              selectedAttributes,
              selectedSize,
              match: false
            });
            
            // If we have a selected size, match only that size attribute
            if (selectedSize) {
              const itemSizeAttr = item.attributes.find(attr => attr.name.toLowerCase() === 'size');
              const matches = itemSizeAttr && itemSizeAttr.value === selectedSize;
              console.log('  Size match:', matches, 'Item size:', itemSizeAttr?.value, 'Selected size:', selectedSize);
              return matches;
            }
            
            // Otherwise match all attributes
            const matches = JSON.stringify(item.attributes) === JSON.stringify(selectedAttributes);
            console.log('  Full attributes match:', matches);
            return matches;
          });
          
          setIsInWishlist(isVariantInWishlist);
        } else {
          // For simple products, check backend API
          const isProductInFavorites = validFavorites.some(
            fav => fav.product?._id === product._id || fav.product === product._id
          );
          setIsInWishlist(isProductInFavorites);
        }
      } else {
        setIsInWishlist(false);
        setWishlistCount(variantWishlistCount); // Still show variant count
      }
    } catch (error) {
      console.error('❌ Error checking wishlist status:', error);
      setIsInWishlist(false);
      setWishlistCount(0);
    }
  };

  const toggleFavorite = async () => {
    
    try {
      setIsLoadingFavorite(true);
      
      // Check if user is logged in
      const loggedIn = await isUserLoggedIn();
      
      if (!loggedIn) {
        setIsLoadingFavorite(false);
        Alert.alert(
          t('Login Required'),
          t('Please login to add items to your wishlist'),
          [
            {
              text: t('Cancel'),
              style: 'cancel'
            },
            {
              text: t('Login'),
              onPress: () => reset('Auth')
            }
          ]
        );
        return;
      }

      const isVariableProduct = product.productType === 'variable' && product.variants?.length > 0;

      if (isInWishlist) {
        // Remove from wishlist
        
        if (isVariableProduct && selectedVariant !== null && product.variants?.[selectedVariant]) {
          // Remove variant from local storage
          const localWishlist = await AsyncStorage.getItem('variantWishlist');
          let variantWishlistData = localWishlist ? JSON.parse(localWishlist) : [];
          
          let selectedAttributes = product.variants[selectedVariant]?.attributes || [];
          
          // If user has selected a specific size, only match that size
          if (selectedSize) {
            selectedAttributes = selectedAttributes.filter(attr => {
              // Keep non-size attributes (like color)
              if (attr.name.toLowerCase() !== 'size') return true;
              // Only keep the selected size
              return attr.value === selectedSize;
            });
          }
          
          // Add Color from old varients structure if not in attributes
          const hasColor = selectedAttributes.some(attr => attr.name.toLowerCase() === 'color');
          if (!hasColor && product.varients?.[selectedVariant]?.color) {
            selectedAttributes = [
              ...selectedAttributes,
              { name: 'Color', value: product.varients[selectedVariant].color }
            ];
          }
          
          variantWishlistData = variantWishlistData.filter(
            item => !(item.productId === product._id && 
            JSON.stringify(item.attributes) === JSON.stringify(selectedAttributes))
          );
          
          await AsyncStorage.setItem('variantWishlist', JSON.stringify(variantWishlistData));
          setIsInWishlist(false);
          setWishlistCount(prev => Math.max(0, prev - 1));
          setToast(t('Removed from favorites'));
        } else {
          // Remove simple product from backend
          const response = await Post('user/addremovefavourite', { product: product._id });
          
          if (response && response.status) {
            setIsInWishlist(false);
            setWishlistCount(prev => Math.max(0, prev - 1));
            setToast(t('Removed from favorites'));
          } else {
          }
        }
      } else {
        // Add to wishlist
        
        if (isVariableProduct && selectedVariant !== null && product.variants?.[selectedVariant]) {
          // Add variant to local storage
          const localWishlist = await AsyncStorage.getItem('variantWishlist');
          let variantWishlistData = localWishlist ? JSON.parse(localWishlist) : [];
          
          const selectedVariantData = product.variants[selectedVariant];
          let selectedAttributes = selectedVariantData?.attributes || [];
          
          // If user has selected a specific size, only include that size in attributes
          if (selectedSize) {
            selectedAttributes = selectedAttributes.filter(attr => {
              // Keep non-size attributes (like color)
              if (attr.name.toLowerCase() !== 'size') return true;
              // Only keep the selected size
              return attr.value === selectedSize;
            });
          }
          
          // Add Color from old varients structure if not in attributes
          const hasColor = selectedAttributes.some(attr => attr.name.toLowerCase() === 'color');
          if (!hasColor && product.varients?.[selectedVariant]?.color) {
            selectedAttributes = [
              ...selectedAttributes,
              { name: 'Color', value: product.varients[selectedVariant].color }
            ];
          }
          
          // Check if already exists
          const exists = variantWishlistData.some(
            item => item.productId === product._id && 
            JSON.stringify(item.attributes) === JSON.stringify(selectedAttributes)
          );
          
          if (!exists) {
            console.log('💖 Adding to wishlist:', {
              selectedVariant,
              selectedSize,
              selectedAttributes,
              productName: product.name
            });
            
            variantWishlistData.push({
              productId: product._id,
              productName: product.name,
              slug: product.slug,
              attributes: selectedAttributes,
              image: selectedVariantData?.images?.[0] || '',
              price: selectedVariantData?.price || 0,
              offerPrice: selectedVariantData?.offerPrice || 0,
              stock: selectedVariantData?.stock || 0,
              addedAt: new Date().toISOString()
            });
            
            await AsyncStorage.setItem('variantWishlist', JSON.stringify(variantWishlistData));
            setIsInWishlist(true);
            setWishlistCount(prev => prev + 1);
            setToast(t('Added to favorites'));
            
            console.log('✅ Added to wishlist. Total items:', variantWishlistData.length);
          } else {
            console.log('⚠️ Already in wishlist');
          }
        } else {
          // Add simple product to backend
          const response = await Post('user/addremovefavourite', { product: product._id });
          
          if (response && response.status) {
            setIsInWishlist(true);
            setWishlistCount(prev => prev + 1);
            setToast(t('Added to favorites'));
          } else {
          }
        }
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      setToast(t('Failed to update favorites'));
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
    
      setLoading(true);
      setNotFound(false);
      setError(null);
      
     
      const res = await GetApi(`product/getProductByslug?slug=${slug}`);
      console.log('resss',res)
      if (res && res.status) {
        setProduct(res.data);
        hasAutoSelectedVariant.current = false; // Reset auto-selection flag for new product
        setError(null);
      } else {
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
        <Text style={styles.errorText}>{t('Product not found')}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t('Go Back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || t('Product not found')}</Text>
      </SafeAreaView>
    );
  }

  // Determine product type and set appropriate data
  const hasVariants = (product.variants?.length > 0) || (product.varients?.length > 0);
  const isVariableProduct = product.productType === 'variable' && hasVariants;
  
  // Set main image based on product type
  if (product && !mainImage) {
    // Try multiple sources for image
    if (isVariableProduct && product.variants?.[0]?.images?.[0]) {
      setMainImage(product.variants[0].images[0]);
    } else if (product.simpleProduct?.images?.[0]) {
      setMainImage(product.simpleProduct.images[0]);
    } else if (product.varients?.[0]?.image?.[0]) {
      // Fallback to old varients format
      setMainImage(product.varients[0].image[0]);
    } else {
    }
  }
  
  // Calculate prices based on product type
  let originalPrice = 0;
  let discountedPrice = 0;
  
  if (isFlashSale) {
    originalPrice = flashOriginalPrice;
    discountedPrice = flashSalePrice;
  } else if (isVariableProduct) {
    const selectedVariantData = product.variants?.[selectedVariant] || product.variants?.[0];
    originalPrice = parseFloat(selectedVariantData?.price) || 0;
    discountedPrice = parseFloat(selectedVariantData?.offerPrice) || originalPrice;
  } else {
    // Simple product pricing with fallback to old varients format
    originalPrice = parseFloat(product.simpleProduct?.price) || 
                   parseFloat(product.varients?.[0]?.selected?.[0]?.price) || 0;
    discountedPrice = parseFloat(product.simpleProduct?.offerPrice) || 
                     parseFloat(product.varients?.[0]?.selected?.[0]?.offerprice) ||
                     originalPrice;
  }
  
  const cartdata = async () => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
    
    // Check product type and get appropriate data
    const isVariableProduct = product.productType === 'variable' && product.variants?.length > 0;
    
    let variantPrice = 0;
    let variantOfferPrice = 0;
    let productImage = '';
    let availableStock = 0;
    let selectedAttributes = null;
    
    if (isVariableProduct) {
      // Variable product - get selected variant data
      const selectedVariantData = product.variants?.[selectedVariant] || product.variants?.[0];
      
      // Fallback to old varients structure if new variants not available
      const oldVarientData = product.varients?.[selectedVariant] || product.varients?.[0];
      
      variantPrice = parseFloat(selectedVariantData?.price) || 
                    parseFloat(oldVarientData?.selected?.[0]?.price) || 0;
      variantOfferPrice = parseFloat(selectedVariantData?.offerPrice) || 
                         parseFloat(oldVarientData?.selected?.[0]?.offerprice) || 
                         variantPrice;
      productImage = convertAvifToJpg(
        selectedVariantData?.images?.[0] || 
        oldVarientData?.image?.[0] || ''
      );
      availableStock = parseInt(selectedVariantData?.stock) || 
                      parseInt(oldVarientData?.selected?.[0]?.qty) || 0;
      selectedAttributes = selectedVariantData?.attributes || 
                          oldVarientData?.selected?.[0]?.attributes || [];
      
      // If user has selected a specific size, only include that size in attributes
      if (selectedSize) {
        selectedAttributes = selectedAttributes.filter(attr => {
          // Keep non-size attributes (like color)
          if (attr.name.toLowerCase() !== 'size') {
            return true;
          }
          // Only keep the selected size
          const keep = attr.value === selectedSize;
          return keep;
        });
        
        // Add Color from old varients structure if not already in attributes
        const hasColor = selectedAttributes.some(attr => attr.name.toLowerCase() === 'color');
        if (!hasColor && oldVarientData?.color) {
          selectedAttributes.push({ name: 'Color', value: oldVarientData.color });
        }
      } else {
        
        // Add Color from old varients structure if not already in attributes
        const hasColor = selectedAttributes.some(attr => attr.name.toLowerCase() === 'color');
        if (!hasColor && oldVarientData?.color) {
          selectedAttributes.push({ name: 'Color', value: oldVarientData.color });
        }
      }
    } else {
      // Simple product - get simple product data with fallback to varients and pieces
      variantPrice = parseFloat(product.simpleProduct?.price) || 
                     parseFloat(product.varients?.[0]?.selected?.[0]?.price) || 0;
      variantOfferPrice = parseFloat(product.simpleProduct?.offerPrice) || 
                         parseFloat(product.varients?.[0]?.selected?.[0]?.offerprice) || 
                         variantPrice;
      productImage = convertAvifToJpg(
        product.simpleProduct?.images?.[0] || 
        product.varients?.[0]?.image?.[0] || ''
      );
      
      // Stock priority: simpleProduct.stock > varients qty > pieces (old field)
      availableStock = parseInt(product.simpleProduct?.stock) || 
                      parseInt(product.varients?.[0]?.selected?.[0]?.qty) ||
                      parseInt(product.pieces) || 
                      parseInt(product.stock) || 0;
    }
    
    // Use flash sale price if available
    if (isFlashSale) {
      variantOfferPrice = flashSalePrice;
    }

    // Check stock availability
    if (availableStock <= 0) {
      Alert.alert(
        t('Out of Stock'),
        t('This product is currently out of stock'),
        [{ text: t('OK') }]
      );
      return;
    }

    // Find existing product in cart (for variable products, match by variant attributes)
    let existingProduct;
    if (isVariableProduct && selectedAttributes) {
      existingProduct = existingCart.find(f => {
        if (f.productid !== product._id) return false;
        
        // If selectedSize is set, we need strict size matching
        if (selectedSize) {
          // Only match if the cart item has the exact size we're looking for
          if (!f.selectedAttributes || !Array.isArray(f.selectedAttributes)) {
            return false;
          }
          
          const cartItemSize = f.selectedAttributes.find(attr => attr.name.toLowerCase() === 'size');
          if (!cartItemSize || cartItemSize.value !== selectedSize) {
            return false;
          }
          
          // Also verify variant matches
          const variantMatches = (
            (f.variantIndex !== undefined && f.variantIndex === selectedVariant) ||
            (f.variantId && product.variants[selectedVariant]?._id === f.variantId)
          );
          
          return variantMatches;
        }
        
        // Original matching logic when no size is selected
        // Enhanced matching logic for wishlist variants
        // 1. Check if cart item's variantIndex matches current selectedVariant
        if (f.variantIndex !== undefined && f.variantIndex === selectedVariant) {
          return true;
        }
        // 2. Check if cart item's variantId matches current variant's ID
        if (f.variantId && product.variants[selectedVariant]?._id === f.variantId) {
          return true;
        }
        // 3. Check wishlist attributes match current variant
        if (f.wishlistVariantAttributes && selectedAttributes.length > 0) {
          const wishlistMatch = f.wishlistVariantAttributes.every(wishlistAttr => 
            selectedAttributes.some(variantAttr => 
              variantAttr.name === wishlistAttr.name && variantAttr.value === wishlistAttr.value
            )
          );
          if (wishlistMatch) return true;
        }
        // 4. Exact attribute match
        if (JSON.stringify(f.selectedAttributes) === JSON.stringify(selectedAttributes)) {
          return true;
        }
        
        return false;
      });
    } else {
      existingProduct = existingCart.find(
        f => f.productid === product._id
      );
    }

    if (!existingProduct) {
      // Add new product to cart
      const newProduct = {
        productid: product._id,
        productname: product.name,
        frenchName: product?.frenchName,
        price: isFlashSale ? flashOriginalPrice : variantPrice,
        offer: variantOfferPrice,
        image: productImage,
        price_slot: product?.price_slot?.[0] || {},
        qty: 1,
        seller_id: product.SellerId,
        slug: product.slug,
        total: variantOfferPrice,
        BarCode: product.BarCode || '',
        productType: product.productType,
        selectedAttributes: isVariableProduct ? selectedAttributes : null,
        variantIndex: isVariableProduct ? selectedVariant : null, // Save current variant index
        variantId: isVariableProduct && product.variants?.[selectedVariant]?._id ? product.variants[selectedVariant]._id : null,
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
      // Check if adding more would exceed stock
      if (existingProduct.qty >= availableStock) {
        Alert.alert(
          t('Stock Limit Reached'),
          t('Only') + ' ' + availableStock + ' ' + t('items available in stock'),
          [{ text: t('OK') }]
        );
        return;
      }
      
      // Update quantity of existing product
      const updatedCart = existingCart.map(_i => {
        if (isVariableProduct && selectedAttributes) {
          // Enhanced matching logic for wishlist variants
          let isMatch = false;
          if (_i?.productid === product._id) {
            // 1. Check if cart item's variantIndex matches current selectedVariant
            if (_i.variantIndex !== undefined && _i.variantIndex === selectedVariant) {
              isMatch = true;
            }
            // 2. Check if cart item's variantId matches current variant's ID
            else if (_i.variantId && product.variants[selectedVariant]?._id === _i.variantId) {
              isMatch = true;
            }
            // 3. Check wishlist attributes match current variant
            else if (_i.wishlistVariantAttributes && selectedAttributes.length > 0) {
              const wishlistMatch = _i.wishlistVariantAttributes.every(wishlistAttr => 
                selectedAttributes.some(variantAttr => 
                  variantAttr.name === wishlistAttr.name && variantAttr.value === wishlistAttr.value
                )
              );
              if (wishlistMatch) isMatch = true;
            }
            // 4. Exact attribute match
            else if (JSON.stringify(_i.selectedAttributes) === JSON.stringify(selectedAttributes)) {
              isMatch = true;
            }
          }
          
          if (isMatch) {
            const newQty = _i.qty + 1;
            return { 
              ..._i, 
              qty: newQty,
              total: _i.offer * newQty 
            };
          }
        } else {
          if (_i?.productid === product._id) {
            const newQty = _i.qty + 1;
            return { 
              ..._i, 
              qty: newQty,
              total: _i.offer * newQty 
            };
          }
        }
        return _i;
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
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.name || t('Product Details')}
        </Text>
        <TouchableOpacity 
          style={styles.favoriteHeaderButton}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Icon name="heart" size={24} color="#FFFFFF" />
          {wishlistCount > 0 && (
            <View style={styles.wishlistBadge}>
              <Text style={styles.wishlistBadgeText}>
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.imageContainer}>
          {(() => {
            // Safety check - ensure product exists
            if (!product) {
              return (
                <View style={styles.imageWrapper}>
                  <View style={styles.imageShadowBox}>
                    <View style={styles.carouselSlide}>
                      <Text>Loading...</Text>
                    </View>
                  </View>
                </View>
              );
            }
            
            // Improved detection: Check if it's truly a variable product
            const hasVariants = (product.variants?.length > 0) || (product.varients?.length > 0);
            const isVariableProduct = product.productType === 'variable' && hasVariants;
            
            // Get images from multiple sources with proper fallbacks
            let images = [];
            
            // Convert AVIF to JPG for React Native compatibility
            const convertAvifToJpg = (imageUrl) => {
              if (imageUrl && imageUrl.includes('.avif')) {
                return imageUrl.replace('.avif', '.jpg');
              }
              return imageUrl;
            };
            
            if (isVariableProduct) {
              // Use selectedVariant to get the correct variant's images
              const currentVariant = product.variants?.[selectedVariant];
              images = currentVariant?.images || [];
              
              // Fallback to old varients structure if new variants don't have images
              if (images.length === 0 && product.varients?.[selectedVariant]) {
                images = product.varients[selectedVariant]?.image || [];
              }
              
              // Convert AVIF images
              images = images.map(convertAvifToJpg);
            } else {
              // For simple products, try multiple sources
              const simpleImages = product.simpleProduct?.images;
              const varientImages = product.varients?.[0]?.image;
              
              // Convert AVIF to JPG for React Native compatibility
              const convertAvifToJpg = (imageUrl) => {
                if (imageUrl && imageUrl.includes('.avif')) {
                  // Replace .avif with .jpg in Cloudinary URL
                  return imageUrl.replace('.avif', '.jpg');
                }
                return imageUrl;
              };
              
              images = simpleImages && simpleImages.length > 0 
                      ? simpleImages.map(convertAvifToJpg)
                      : (varientImages ? varientImages.map(convertAvifToJpg) : []);
            }
            
            // Ensure images is always an array
            if (!Array.isArray(images)) {
              images = [];
            }
            
            return images.length > 0 ? (
              <View style={styles.imageWrapper}>
                <View style={styles.imageShadowBox}>
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
                    {images.map((imageUri, index) => (
                      <View key={`image-${index}-${imageUri?.substring(imageUri.length - 20)}`} style={styles.carouselSlide}>
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.carouselImage}
                          resizeMode="contain"
                          onError={(error) => {
                            console.error('❌ Image failed to load:', imageUri, error.nativeEvent.error);
                          }}
                          onLoad={() => {
                          }}
                        />
                      </View>
                    ))}
                  </ScrollView>
                  <View style={styles.dotsContainer}>
                    {images.map((_, index) => (
                      <View
                        key={`dot-${index}`}
                        style={[
                          styles.dot,
                          index === activeSlide && styles.activeDot
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noImage}>
                <Text>{t('No Image Available')}</Text>
              </View>
            );
          })()}
        </View>
  
        <View style={styles.detailsContainer}>
          <View style={styles.productHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">{product.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, flexShrink: 0 }}>
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
              </TouchableOpacity>
              
              <View style={styles.quantityContainer}>
                {(() => {
                  // Calculate available stock
                  const isVariableProduct = product.productType === 'variable' && (product.variants?.length > 0 || product.varients?.length > 0);
                  let availableStock = 0;
                  
                  if (isVariableProduct) {
                    const selectedVariantData = product.variants?.[selectedVariant] || product.variants?.[0];
                    const oldVarientData = product.varients?.[selectedVariant] || product.varients?.[0];
                    availableStock = parseInt(selectedVariantData?.stock) || 
                                    parseInt(oldVarientData?.selected?.[0]?.qty) || 0;
                  } else {
                    availableStock = parseInt(product.simpleProduct?.stock) || 
                                    parseInt(product.varients?.[0]?.selected?.[0]?.qty) ||
                                    parseInt(product.pieces) || 0;
                  }
                  
                  const isOutOfStock = availableStock <= 0;
                  
                  return !showQuantityControls ? (
                    <TouchableOpacity 
                      style={[
                        styles.addToCartIcon,
                        isOutOfStock && styles.addToCartIconDisabled
                      ]}
                      onPress={async () => {
                        if (!isOutOfStock) {
                          await cartdata(); 
                          setShowQuantityControls(true);
                        }
                      }}
                      disabled={isOutOfStock}
                    >
                      <Text style={[
                        styles.plusIcon,
                        isOutOfStock && styles.plusIconDisabled
                      ]}>
                        {isOutOfStock ? '✕' : '+'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20, marginLeft: 10 }}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={async () => {
                        const existingCart = Array.isArray(cartdetail) ? [...cartdetail] : [];
                        const isVariableProduct = product.productType === 'variable' && product.variants?.length > 0;
                        
                        let existingProductIndex = -1;
                        if (isVariableProduct && selectedVariant !== null && product.variants?.[selectedVariant]) {
                          const selectedAttributes = product.variants[selectedVariant]?.attributes || [];
                          
                          // Use same logic - check old varients structure
                          let variantAttributesForMatching = selectedAttributes;
                          if (selectedAttributes.length === 0 && product.varients?.[selectedVariant]) {
                            if (product.varients[selectedVariant].color) {
                              variantAttributesForMatching = [{ name: 'Color', value: product.varients[selectedVariant].color }];
                            }
                          }
                          
                          existingProductIndex = existingCart.findIndex(f => {
                            if (f.productid !== product._id) return false;
                            
                            // If selectedSize is set, we need strict size matching
                            if (selectedSize) {
                              // Only match if the cart item has the exact size we're looking for
                              if (!f.selectedAttributes || !Array.isArray(f.selectedAttributes)) {
                                return false;
                              }
                              
                              const cartItemSize = f.selectedAttributes.find(attr => attr.name.toLowerCase() === 'size');
                              if (!cartItemSize || cartItemSize.value !== selectedSize) {
                                return false;
                              }
                              
                              // Also verify variant matches
                              const variantMatches = (
                                (f.variantIndex !== undefined && f.variantIndex !== null && f.variantIndex === selectedVariant) ||
                                (f.variantId && product.variants[selectedVariant]?._id === f.variantId)
                              );
                              
                              return variantMatches;
                            }
                            
                            // Original matching logic when no size is selected
                            // Enhanced matching logic for wishlist variants
                            // 1. Check if cart item's variantIndex matches current selectedVariant
                            if (f.variantIndex !== undefined && f.variantIndex !== null && f.variantIndex === selectedVariant) {
                              return true;
                            }
                            // 2. Check if cart item's variantId matches current variant's ID
                            if (f.variantId && product.variants[selectedVariant]?._id === f.variantId) {
                              return true;
                            }
                            // 3. Check wishlist attributes match current variant (PRIORITY)
                            if (f.wishlistVariantAttributes && f.wishlistVariantAttributes.length > 0) {
                              const wishlistMatch = f.wishlistVariantAttributes.every(wishlistAttr => 
                                variantAttributesForMatching.some(variantAttr => 
                                  variantAttr.name === wishlistAttr.name && variantAttr.value === wishlistAttr.value
                                )
                              );
                              if (wishlistMatch) return true;
                            }
                            // 4. Check selectedAttributes match
                            if (f.selectedAttributes && f.selectedAttributes.length > 0 && variantAttributesForMatching.length > 0) {
                              const attributesMatch = f.selectedAttributes.every(cartAttr => 
                                variantAttributesForMatching.some(variantAttr => 
                                  variantAttr.name === cartAttr.name && variantAttr.value === cartAttr.value
                                )
                              );
                              if (attributesMatch) return true;
                            }
                            // 5. Exact attribute match
                            if (JSON.stringify(f.selectedAttributes) === JSON.stringify(variantAttributesForMatching)) {
                              return true;
                            }
                            
                            return false;
                          });
                        } else {
                          existingProductIndex = existingCart.findIndex(
                            f => f.productid === product._id
                          );
                        }
  
                        if (existingProductIndex !== -1) {
                          if (existingCart[existingProductIndex].qty > 1) {
                            existingCart[existingProductIndex] = {
                              ...existingCart[existingProductIndex],
                              qty: existingCart[existingProductIndex].qty - 1,
                              total: existingCart[existingProductIndex].offer * (existingCart[existingProductIndex].qty - 1)
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
                        const isVariableProduct = product.productType === 'variable' && product.variants?.length > 0;
                        
                        let existingProduct;
                        if (isVariableProduct && selectedVariant !== null && product.variants?.[selectedVariant]) {
                          const selectedAttributes = product.variants[selectedVariant]?.attributes || [];
                          
                          // Use same logic as cart detection - check old varients structure
                          let variantAttributesForMatching = selectedAttributes;
                          if (selectedAttributes.length === 0 && product.varients?.[selectedVariant]) {
                            if (product.varients[selectedVariant].color) {
                              variantAttributesForMatching = [{ name: 'Color', value: product.varients[selectedVariant].color }];
                            }
                          }
                          
                          existingProduct = existingCart.find(f => {
                            if (f.productid !== product._id) return false;
                            
                            // Use same enhanced matching logic as cart detection
                            // 1. Both have null selectedAttributes
                            if (f.selectedAttributes === null && variantAttributesForMatching.length === 0) {
                              return true;
                            }
                            // 2. Both have empty arrays
                            if (Array.isArray(f.selectedAttributes) && f.selectedAttributes.length === 0 && variantAttributesForMatching.length === 0) {
                              return true;
                            }
                            // 3. Check if cart item's variantIndex matches current selectedVariant
                            if (f.variantIndex !== undefined && f.variantIndex !== null && f.variantIndex === selectedVariant) {
                              return true;
                            }
                            // 4. Check if cart item's variantId matches current variant's ID
                            if (f.variantId && product.variants[selectedVariant]?._id === f.variantId) {
                              return true;
                            }
                            // 5. Check wishlist attributes match current variant (PRIORITY)
                            if (f.wishlistVariantAttributes && f.wishlistVariantAttributes.length > 0) {
                              const wishlistMatch = f.wishlistVariantAttributes.every(wishlistAttr => 
                                variantAttributesForMatching.some(variantAttr => 
                                  variantAttr.name === wishlistAttr.name && variantAttr.value === wishlistAttr.value
                                )
                              );
                              if (wishlistMatch) return true;
                            }
                            // 6. Check selectedAttributes match
                            if (f.selectedAttributes && f.selectedAttributes.length > 0 && variantAttributesForMatching.length > 0) {
                              const attributesMatch = f.selectedAttributes.every(cartAttr => 
                                variantAttributesForMatching.some(variantAttr => 
                                  variantAttr.name === cartAttr.name && variantAttr.value === cartAttr.value
                                )
                              );
                              if (attributesMatch) return true;
                            }
                            // 7. Exact attribute match
                            if (JSON.stringify(f.selectedAttributes) === JSON.stringify(variantAttributesForMatching)) {
                              return true;
                            }
                            
                            return false;
                          });
                        } else {
                          existingProduct = existingCart.find(
                            f => f.productid === product._id
                          );
                        }
                        
                        const qty = existingProduct ? existingProduct.qty : 0;
                        return qty;
                      })()}
                    </Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={async () => {
                        const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
                        const isVariableProduct = product.productType === 'variable' && product.variants?.length > 0;
                        
                        let existingProduct;
                        if (isVariableProduct && selectedVariant !== null && product.variants?.[selectedVariant]) {
                          const selectedAttributes = product.variants[selectedVariant]?.attributes || [];
                          
                          // Use same logic - check old varients structure
                          let variantAttributesForMatching = selectedAttributes;
                          if (selectedAttributes.length === 0 && product.varients?.[selectedVariant]) {
                            if (product.varients[selectedVariant].color) {
                              variantAttributesForMatching = [{ name: 'Color', value: product.varients[selectedVariant].color }];
                            }
                          }
                          
                          existingProduct = existingCart.find(f => {
                            if (f.productid !== product._id) return false;
                            
                            // If selectedSize is set, we need strict size matching
                            if (selectedSize) {
                              // Only match if the cart item has the exact size we're looking for
                              if (!f.selectedAttributes || !Array.isArray(f.selectedAttributes)) {
                                return false;
                              }
                              
                              const cartItemSize = f.selectedAttributes.find(attr => attr.name.toLowerCase() === 'size');
                              if (!cartItemSize || cartItemSize.value !== selectedSize) {
                                return false;
                              }
                              
                              // Also verify variant matches
                              const variantMatches = (
                                (f.variantIndex !== undefined && f.variantIndex !== null && f.variantIndex === selectedVariant) ||
                                (f.variantId && product.variants[selectedVariant]?._id === f.variantId)
                              );
                              
                              return variantMatches;
                            }
                            
                            // Original matching logic when no size is selected
                            // Enhanced matching logic for wishlist variants
                            // 1. Check if cart item's variantIndex matches current selectedVariant
                            if (f.variantIndex !== undefined && f.variantIndex !== null && f.variantIndex === selectedVariant) {
                              return true;
                            }
                            // 2. Check if cart item's variantId matches current variant's ID
                            if (f.variantId && product.variants[selectedVariant]?._id === f.variantId) {
                              return true;
                            }
                            // 3. Check wishlist attributes match current variant (PRIORITY)
                            if (f.wishlistVariantAttributes && f.wishlistVariantAttributes.length > 0) {
                              const wishlistMatch = f.wishlistVariantAttributes.every(wishlistAttr => 
                                variantAttributesForMatching.some(variantAttr => 
                                  variantAttr.name === wishlistAttr.name && variantAttr.value === wishlistAttr.value
                                )
                              );
                              if (wishlistMatch) return true;
                            }
                            // 4. Check selectedAttributes match
                            if (f.selectedAttributes && f.selectedAttributes.length > 0 && variantAttributesForMatching.length > 0) {
                              const attributesMatch = f.selectedAttributes.every(cartAttr => 
                                variantAttributesForMatching.some(variantAttr => 
                                  variantAttr.name === cartAttr.name && variantAttr.value === cartAttr.value
                                )
                              );
                              if (attributesMatch) return true;
                            }
                            // 5. Exact attribute match
                            if (JSON.stringify(f.selectedAttributes) === JSON.stringify(variantAttributesForMatching)) {
                              return true;
                            }
                            
                            return false;
                          });
                        } else {
                          existingProduct = existingCart.find(
                            f => f.productid === product._id
                          );
                        }
                        
                        // Get available stock based on product type
                        let availableStock = 0;
                        
                        if (isVariableProduct) {
                          const selectedVariantData = product.variants?.[selectedVariant] || product.variants?.[0];
                          availableStock = parseInt(selectedVariantData?.stock) || 0;
                        } else {
                          availableStock = parseInt(product.simpleProduct?.stock) || 
                                          parseInt(product.varients?.[0]?.selected?.[0]?.qty) ||
                                          parseInt(product.pieces) || 0;
                        }
                        
                        // Check if adding more would exceed stock
                        const currentQty = existingProduct ? existingProduct.qty : 0;
                        
                        if (currentQty >= availableStock) {
                          Alert.alert(
                            t('Out of Stock'),
                            t('Only') + ' ' + availableStock + ' ' + t('items available in stock'),
                            [{ text: t('OK') }]
                          );
                          return;
                        }
  
                        if (existingProduct) {
                          const updatedCart = existingCart.map(_i => {
                            if (isVariableProduct && selectedVariant !== null && product.variants?.[selectedVariant]) {
                              const selectedAttributes = product.variants[selectedVariant]?.attributes || [];
                              
                              // Use same logic - check old varients structure
                              let variantAttributesForMatching = selectedAttributes;
                              if (selectedAttributes.length === 0 && product.varients?.[selectedVariant]) {
                                if (product.varients[selectedVariant].color) {
                                  variantAttributesForMatching = [{ name: 'Color', value: product.varients[selectedVariant].color }];
                                }
                              }
                              
                              // Enhanced matching logic for wishlist variants
                              let isMatch = false;
                              if (_i.productid === product._id) {
                                // 1. Check if cart item's variantIndex matches current selectedVariant
                                if (_i.variantIndex !== undefined && _i.variantIndex !== null && _i.variantIndex === selectedVariant) {
                                  isMatch = true;
                                }
                                // 2. Check if cart item's variantId matches current variant's ID
                                else if (_i.variantId && product.variants[selectedVariant]?._id === _i.variantId) {
                                  isMatch = true;
                                }
                                // 3. Check wishlist attributes match current variant (PRIORITY)
                                else if (_i.wishlistVariantAttributes && _i.wishlistVariantAttributes.length > 0) {
                                  const wishlistMatch = _i.wishlistVariantAttributes.every(wishlistAttr => 
                                    variantAttributesForMatching.some(variantAttr => 
                                      variantAttr.name === wishlistAttr.name && variantAttr.value === wishlistAttr.value
                                    )
                                  );
                                  if (wishlistMatch) isMatch = true;
                                }
                                // 4. Check selectedAttributes match
                                else if (_i.selectedAttributes && _i.selectedAttributes.length > 0 && variantAttributesForMatching.length > 0) {
                                  const attributesMatch = _i.selectedAttributes.every(cartAttr => 
                                    variantAttributesForMatching.some(variantAttr => 
                                      variantAttr.name === cartAttr.name && variantAttr.value === cartAttr.value
                                    )
                                  );
                                  if (attributesMatch) isMatch = true;
                                }
                                // 5. Exact attribute match
                                else if (JSON.stringify(_i.selectedAttributes) === JSON.stringify(variantAttributesForMatching)) {
                                  isMatch = true;
                                }
                              }
                              
                              if (isMatch) {
                                const newQty = _i.qty + 1;
                                return { ..._i, qty: newQty, total: _i.offer * newQty };
                              }
                            } else {
                              if (_i.productid === product._id) {
                                const newQty = _i.qty + 1;
                                return { ..._i, qty: newQty, total: _i.offer * newQty };
                              }
                            }
                            return _i;
                          });
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
                );
              })()}
              </View>
            </View>
          </View>
          
          <Text style={styles.category}>{product.categoryName} • {product.subCategoryName}</Text>
  
          {/* Variants - Only show for variable products */}
          {product.productType === 'variable' && product.variants?.length > 0 && (
            <View style={styles.variantsSection}>
              {(() => {
                if (hasColorAttribute) {
                  // Original logic for products with Color attribute
                  const colorOptions = [];
                  const currentVariantSizes = [];
                  
                  // Collect all unique colors
                  const uniqueColors = new Set();
                  product.variants.forEach((variant) => {
                    const colorAttr = variant.attributes?.find(attr => attr.name.toLowerCase() === 'color');
                    if (colorAttr) {
                      uniqueColors.add(colorAttr.value);
                    }
                  });
                  
                  if (uniqueColors.size > 0) {
                    colorOptions.push({
                      name: 'Color',
                      values: Array.from(uniqueColors)
                    });
                  }
                  
                  // Get sizes from selected variant
                  if (selectedVariant !== null && product.variants[selectedVariant]) {
                    const currentVariant = product.variants[selectedVariant];
                    const sizeAttributes = currentVariant.attributes?.filter(attr => 
                      attr.name.toLowerCase() === 'size'
                    ) || [];
                    
                    if (sizeAttributes.length > 0) {
                      const uniqueSizes = [...new Set(sizeAttributes.map(attr => attr.value))];
                      currentVariantSizes.push({
                        name: 'Size',
                        values: uniqueSizes
                      });
                    }
                  }
                  
                  const displayOptions = [...colorOptions, ...currentVariantSizes];
                  return displayOptions.map((option, optionIndex) => {
                    const isColorAttribute = option.name.toLowerCase() === 'color';
                    
                    return (
                      <View key={`option-${optionIndex}-${option.name}`} style={styles.variantGroup}>
                        <Text style={styles.variantGroupTitle}>
                          {t(option.name)}
                        </Text>
                        
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.variantScrollContent}
                        >
                          {option.values.map((value, valueIndex) => {
                          const isColorAttribute = option.name.toLowerCase() === 'color';
                          const isSizeAttribute = option.name.toLowerCase() === 'size';
                          
                          // Find variant with this attribute value
                          let variantIndex = -1;
                          
                          if (isColorAttribute) {
                            // For Color: Find the first variant with this color
                            variantIndex = product.variants.findIndex(v => 
                              v.attributes?.some(attr => 
                                attr.name.toLowerCase() === 'color' && attr.value === value
                              )
                            );
                          } else if (isSizeAttribute) {
                            // For Size: Find variant with SAME color as selected variant AND this size
                            const currentVariant = product.variants[selectedVariant];
                            const currentColor = currentVariant?.attributes?.find(attr => 
                              attr.name.toLowerCase() === 'color'
                            )?.value;
                            
                            // Find variant with same color and this size
                            variantIndex = product.variants.findIndex(v => {
                              const hasMatchingColor = v.attributes?.some(attr => 
                                attr.name.toLowerCase() === 'color' && attr.value === currentColor
                              );
                              const hasMatchingSize = v.attributes?.some(attr => 
                                attr.name.toLowerCase() === 'size' && attr.value === value
                              );
                              return hasMatchingColor && hasMatchingSize;
                            });
                            
                            // If not found, it means this size doesn't exist for current color
                            // Keep variantIndex as -1 to show as disabled
                          }
                          
                          // Get variant data
                          const variantWithValue = variantIndex >= 0 ? product.variants[variantIndex] : null;
                          
                          const isSelected = selectedVariant === variantIndex;
                          const isOutOfStock = !variantWithValue || variantWithValue.stock <= 0;
                          
                          // Create unique key
                          const uniqueKey = `${option.name}-${value}-${valueIndex}`;
                          
                          if (isColorAttribute) {
                            // Color circle
                            return (
                              <TouchableOpacity
                                key={uniqueKey}
                                style={[
                                  styles.colorCircle,
                                  isSelected && styles.colorCircleSelected
                                ]}
                                onPress={() => {
                                  if (!isOutOfStock) {
                                    handleVariantChange(variantIndex);
                                    setActiveSlide(0);
                                    if (variantWithValue?.images?.[0]) {
                                      const imageUrl = convertAvifToJpg(variantWithValue.images[0]);
                                      setMainImage(imageUrl);
                                    }
                                  }
                                }}
                                disabled={isOutOfStock}
                              >
                                <View 
                                  style={[
                                    styles.colorInner,
                                    { backgroundColor: value },
                                    isOutOfStock && styles.disabledColor
                                  ]}
                                />
                              </TouchableOpacity>
                            );
                          } else {
                            // Size/other attribute chip
                            return (
                              <TouchableOpacity
                                key={uniqueKey}
                                style={[
                                  styles.sizeChip,
                                  isSelected && styles.sizeChipSelected,
                                  isOutOfStock && styles.sizeChipDisabled
                                ]}
                                onPress={() => {
                                  if (!isOutOfStock) {
                                    handleVariantChange(variantIndex);
                                    setActiveSlide(0);
                                    if (variantWithValue?.images?.[0]) {
                                      const imageUrl = convertAvifToJpg(variantWithValue.images[0]);
                                      setMainImage(imageUrl);
                                    }
                                  }
                                }}
                                disabled={isOutOfStock}
                              >
                                <Text style={[
                                  styles.sizeChipText,
                                  isSelected && styles.sizeChipTextSelected,
                                  isOutOfStock && styles.sizeChipTextDisabled
                                ]}>
                                  {value}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        })}
                      </ScrollView>
                    </View>
                  );
                });
                } else {
                  // For products WITHOUT Color attribute - Group by image and show as colors
                  // Group variants by their first image
                  const variantsByImage = {};
                  product.variants.forEach((variant, index) => {
                    const imageKey = variant.images?.[0] || 'no-image';
                    if (!variantsByImage[imageKey]) {
                      variantsByImage[imageKey] = {
                        image: imageKey,
                        variantIndices: [],
                        sizes: new Set()
                      };
                    }
                    variantsByImage[imageKey].variantIndices.push(index);
                    
                    // Collect all sizes from this variant
                    variant.attributes?.forEach(attr => {
                      if (attr.name.toLowerCase() === 'size') {
                        variantsByImage[imageKey].sizes.add(attr.value);
                      }
                    });
                  });
                  
                  const imageGroups = Object.values(variantsByImage);
                  
                  // Find which image group the selected variant belongs to
                  const selectedImageGroup = imageGroups.find(group => 
                    group.variantIndices.includes(selectedVariant)
                  ) || imageGroups[0]; // Fallback to first group if not found
                  
                  console.log('🎨 Variant Display:', {
                    selectedVariant,
                    selectedSize,
                    totalImageGroups: imageGroups.length,
                    selectedImageGroup: selectedImageGroup ? {
                      image: selectedImageGroup.image,
                      variantIndices: selectedImageGroup.variantIndices,
                      sizes: Array.from(selectedImageGroup.sizes)
                    } : null
                  });
                  
                  // Safety check: if selectedVariant is invalid, reset to first variant
                  if (!imageGroups.some(group => group.variantIndices.includes(selectedVariant))) {
                    console.warn('⚠️ Invalid selectedVariant:', selectedVariant, 'Resetting to 0');
                    setSelectedVariant(0);
                    setSelectedSize(null);
                  }
                  
                  return (
                    <>
                      {/* Color Circles - Extract from old structure or attributes */}
                      {(() => {
                        // Try to get colors from old varients structure or new attributes
                        const uniqueColors = new Set();
                        const colorToVariantMap = {};
                        
                        product.variants.forEach((variant, index) => {
                          // Check new structure first
                          const colorAttr = variant.attributes?.find(attr => attr.name.toLowerCase() === 'color');
                          let colorValue = colorAttr?.value;
                          
                          // Fallback to old varients structure
                          if (!colorValue && product.varients?.[index]?.color) {
                            colorValue = product.varients[index].color;
                          }
                          
                          if (colorValue) {
                            uniqueColors.add(colorValue);
                            if (!colorToVariantMap[colorValue]) {
                              colorToVariantMap[colorValue] = [];
                            }
                            colorToVariantMap[colorValue].push(index);
                          }
                        });
                        
                        if (uniqueColors.size === 0) return null;
                        
                        const colors = Array.from(uniqueColors);
                        
                        // Find current selected color
                        const currentVariant = product.variants[selectedVariant];
                        const currentColorAttr = currentVariant?.attributes?.find(attr => attr.name.toLowerCase() === 'color');
                        let currentColor = currentColorAttr?.value;
                        
                        // Fallback to old varients structure - need to map by image since indices don't match
                        if (!currentColor && product.varients && currentVariant?.images?.[0]) {
                          const currentImage = currentVariant.images[0];
                          // Find which varient has this image
                          const matchingVarient = product.varients.find(v => 
                            v.image && Array.isArray(v.image) && v.image.includes(currentImage)
                          );
                          currentColor = matchingVarient?.color;
                        }
                        
                        // Fallback: find which color group this variant belongs to
                        if (!currentColor) {
                          for (const [color, variantIndices] of Object.entries(colorToVariantMap)) {
                            if (variantIndices.includes(selectedVariant)) {
                              currentColor = color;
                              break;
                            }
                          }
                        }
                        
                        return (
                          <View key="color-circles" style={styles.variantGroup}>
                            <Text style={styles.variantGroupTitle}>
                              {t('Color')}
                            </Text>
                            
                            <ScrollView 
                              horizontal 
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.variantScrollContent}
                            >
                              {colors.map((color, colorIndex) => {
                                const isSelected = currentColor === color;
                                const firstVariantWithColor = colorToVariantMap[color][0];
                                const isOutOfStock = product.variants[firstVariantWithColor]?.stock <= 0;
                                
                                return (
                                  <TouchableOpacity
                                    key={`color-circle-${colorIndex}`}
                                    style={[
                                      styles.colorCircle,
                                      isSelected && styles.colorCircleSelected
                                    ]}
                                    onPress={() => {
                                      if (!isOutOfStock) {
                                        handleVariantChange(firstVariantWithColor);
                                        setActiveSlide(0);
                                        const variantImage = product.variants[firstVariantWithColor]?.images?.[0];
                                        if (variantImage) {
                                          const imageUrl = convertAvifToJpg(variantImage);
                                          setMainImage(imageUrl);
                                        }
                                      }
                                    }}
                                    disabled={isOutOfStock}
                                  >
                                    <View 
                                      style={[
                                        styles.colorInner,
                                        { backgroundColor: color },
                                        isOutOfStock && styles.disabledColor
                                      ]}
                                    />
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        );
                      })()}
                      
                      {/* Variant Images Gallery */}
                      <View key="color-selector" style={styles.variantGroup}>
                        <Text style={styles.variantGroupTitle}>
                          {t('Variant')}
                        </Text>
                        
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.variantScrollContent}
                        >
                          {imageGroups.map((group, groupIndex) => {
                            // Check if current selectedVariant is in this group's variantIndices
                            const isSelected = group.variantIndices.includes(selectedVariant);
                            const firstVariantIndex = group.variantIndices[0];
                            const isOutOfStock = product.variants[firstVariantIndex]?.stock <= 0;
                            
                            return (
                              <TouchableOpacity
                                key={`color-${groupIndex}`}
                                style={[
                                  styles.variantImageButton,
                                  isSelected && styles.variantImageButtonSelected
                                ]}
                                onPress={() => {
                                  if (!isOutOfStock) {
                                    handleVariantChange(firstVariantIndex);
                                    setActiveSlide(0);
                                    if (group.image && group.image !== 'no-image') {
                                      const imageUrl = convertAvifToJpg(group.image);
                                      setMainImage(imageUrl);
                                    }
                                  }
                                }}
                                disabled={isOutOfStock}
                              >
                                {group.image && group.image !== 'no-image' ? (
                                  <Image 
                                    source={{ uri: group.image }}
                                    style={[
                                      styles.variantImagePreview,
                                      isOutOfStock && styles.disabledImage
                                    ]}
                                  />
                                ) : (
                                  <View style={[
                                    styles.variantImagePlaceholder,
                                    isOutOfStock && styles.disabledImage
                                  ]}>
                                    <Text style={styles.variantImagePlaceholderText}>
                                      {groupIndex + 1}
                                    </Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                      
                      {/* Size Selector - Show all sizes from selected color group */}
                      {selectedImageGroup && (() => {
                        const availableSizes = Array.from(selectedImageGroup.sizes);
                        
                        if (availableSizes.length === 0) return null;
                        
                        // Find which size is currently selected
                        const currentVariant = product.variants[selectedVariant];
                        const currentSize = currentVariant?.attributes?.find(attr => 
                          attr.name.toLowerCase() === 'size'
                        )?.value;
                        
                        return (
                          <View key="size-selector" style={styles.variantGroup}>
                            <Text style={styles.variantGroupTitle}>
                              {t('Size')}
                            </Text>
                            
                            <ScrollView 
                              horizontal 
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.variantScrollContent}
                            >
                              {availableSizes.map((size, sizeIndex) => {
                                // Find variant with this size in current image group
                                const variantWithSize = selectedImageGroup.variantIndices.find(vIndex => {
                                  const variant = product.variants[vIndex];
                                  const hasSize = variant?.attributes?.some(attr => 
                                    attr.name.toLowerCase() === 'size' && attr.value === size
                                  );
                                  return hasSize;
                                });
                                
                                const isSelected = selectedSize 
                                  ? (selectedSize === size) 
                                  : (currentSize && currentSize === size && selectedVariant === variantWithSize);
                                const isOutOfStock = variantWithSize !== undefined ? 
                                  product.variants[variantWithSize]?.stock <= 0 : true;
                                
                                console.log(`📏 Size ${size}:`, {
                                  variantWithSize,
                                  isSelected,
                                  selectedSize,
                                  currentSize,
                                  selectedVariant,
                                  isOutOfStock
                                });
                                
                                return (
                                  <TouchableOpacity
                                    key={`size-${sizeIndex}`}
                                    style={[
                                      styles.sizeChip,
                                      isSelected && styles.sizeChipSelected,
                                      isOutOfStock && styles.sizeChipDisabled
                                    ]}
                                    onPress={() => {
                                      if (!isOutOfStock && variantWithSize !== undefined) {
                                        handleVariantChange(variantWithSize);
                                        setSelectedSize(size); // Track the selected size
                                      } else {
                                      }
                                    }}
                                    disabled={isOutOfStock}
                                  >
                                    <Text style={[
                                      styles.sizeChipText,
                                      isSelected && styles.sizeChipTextSelected,
                                      isOutOfStock && styles.sizeChipTextDisabled
                                    ]}>
                                      {size}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        );
                      })()}
                    </>
                  );
                }
              })()}
            </View>
          )}
          
          {/* Simple Product Stock Info - Only show if stock is less than 5 */}
          {product.productType === 'simple' && (() => {
            const stock = product.simpleProduct?.stock || 
                         product.varients?.[0]?.selected?.[0]?.qty ||
                         product.pieces || 0;
            
            // Only show if stock is less than 5
            if (stock < 5) {
              return (
                <View style={styles.stockInfoContainer}>
                  <Text style={styles.stockLabel}>{t('Stock')}:</Text>
                  <Text style={[
                    styles.stockValue,
                    stock > 0 ? styles.inStock : styles.outOfStock
                  ]}>
                    {stock > 0 
                      ? `${stock} ${t('in stock')}`
                      : t('Out of stock')
                    }
                  </Text>
                </View>
              );
            }
            return null;
          })()}
  
          <View style={styles.priceContainer}>
            {isFlashSale && (
              <View style={styles.flashSaleBadge}>
                <Text style={styles.flashSaleBadgeText}>⚡ {t('FLASH SALE')}</Text>
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
              <Text style={styles.sectionTitle}>{t('Description')}</Text>
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
                <Text style={styles.chatWithSellerLinkText}>{t('Chat with Seller')}</Text>
              </TouchableOpacity>
            </View>
            
            {product.short_description && (
              <Text style={styles.shortDescription}>
                {product.short_description
                  .replace(/<[^>]*>/g, '')  
                  .replace(/&nbsp;/g, ' ')  
                }
              </Text>
            )}
            
            {product.long_description && (
              <Text style={[styles.description, product.short_description && { marginTop: 12 }]}>
                {product.long_description
                  .replace(/<[^>]*>/g, '')  
                  .replace(/&nbsp;/g, ' ')  
                }
              </Text>
            )}
            
            {!product.short_description && !product.long_description && (
              <Text style={styles.description}>{t('No description available')}</Text>
            )}
          </View>
  
          {/* Bulk Order Quotes */}
          {bulkOrders.length > 0 && (
            <View style={styles.bulkOrderContainer}>
              <Text style={styles.bulkOrderTitle}>{t('Bulk Order Pricing')}</Text>
              <View style={styles.bulkOrderRow}>
                {bulkOrders.map((order, index) => (
                  <View key={`bulk-${index}-${order.range}`} style={styles.bulkOrderItem}>
                    <Text style={styles.bulkQuantity}>{order.quantity}</Text>
                    <Text style={styles.bulkRange}>{order.range}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
  
          {/* Delivery Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Delivery Information')}</Text>
            <View style={styles.deliveryInfoRow}>
              <Text style={styles.infoLabel}>{t('Delivery')}:</Text>
              <Text style={styles.deliveryInfoValue}>{t('Standard delivery in 3-5 business days')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Return Policy')}:</Text>
              <Text style={styles.infoValue}>{t('30 days return policy')}</Text>
            </View>
          </View>
  
          {/* Reviews Section */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewSectionTitle}>{t('Customer Reviews')}</Text>
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
                      ({product.reviews?.length} {product.reviews?.length === 1 ? t('Review') : t('Reviews')})
                    </Text>
                  </View>
                </View>
              )}
            </View>
  
            {product.reviews?.length > 0 ? (
              <View style={styles.reviewsList}>
                {(showAllReviews ? product.reviews : product.reviews.slice(0, 6)).map((review, index, arr) => {
                  const isLastItem = index === arr.length - 1;
                  return (
                    <View 
                      key={`review-${review._id || index}-${index}`} 
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
                            {review.posted_by?.name || t('Anonymous User')}
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
                          {review.images.map((img, imgIndex) => {
                            // Handle both string URLs and object with url property
                            const imageUrl = typeof img === 'string' ? img : img.url;
                            return (
                              <View key={`review-img-${imgIndex}-${imageUrl?.substring(imageUrl.length - 15)}`} style={styles.imageWrapper}>
                                <Image 
                                  source={{ uri: imageUrl }}
                                  style={styles.reviewImage}
                                  resizeMode="cover"
                                />
                              </View>
                            );
                          })}
                        </ScrollView>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>{t('No Reviews Yet')}</Text>
                <Text style={styles.emptyStateText}>
                  {t('Be the first to share your thoughts about this product!')}
                </Text>
              </View>
            )}
          </View>
          
          {product.reviews?.length > 6 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllReviews(!showAllReviews)}
            >
              <Text style={styles.viewAllText}>
                {showAllReviews 
                  ? t('Hide Reviews') 
                  : `${t('See All')} ${product.reviews.length} ${t('Reviews')}`}
              </Text>
              <Text style={styles.viewAllIcon}>
                {showAllReviews ? '‹' : '›'}
              </Text>
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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FF7000',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 12,
  },
  favoriteHeaderButton: {
    padding: 4,
    position: 'relative',
  },
  wishlistBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  wishlistBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  favoriteBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    flex: 1,
    marginRight: 10,
    flexWrap: 'wrap',
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
  shortDescription: {
    color: '#333',
    lineHeight: 22,
    fontSize: 15,
    fontWeight: '500',
  },
  description: {
    color: '#555',
    lineHeight: 22,
  },
  variantsContainer: {
    marginTop: 10,
  },
  variantsSection: {
    marginVertical: 12,
  },
  variantGroup: {
    marginBottom: 16,
  },
  variantGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  variantScrollContent: {
    paddingRight: 16,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  colorCircleSelected: {
    borderColor: '#FF7000',
    borderWidth: 2.5,
  },
  colorInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  disabledColor: {
    opacity: 0.3,
  },
  sizeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  sizeChipSelected: {
    borderColor: '#FF7000',
    backgroundColor: '#FF7000',
  },
  sizeChipDisabled: {
    opacity: 0.4,
    backgroundColor: '#F3F4F6',
  },
  sizeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  sizeChipTextSelected: {
    color: '#FFF',
  },
  sizeChipTextDisabled: {
    color: '#9CA3AF',
  },
  variantImageButton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    overflow: 'hidden',
  },
  variantImageButtonSelected: {
    borderColor: '#FF7000',
    borderWidth: 3,
  },
  variantImagePreview: {
    width: '100%',
    height: '100%',
  },
  variantImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  variantImagePlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  disabledImage: {
    opacity: 0.4,
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
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  titleRow: {
    flex: 1,
    marginRight: 10,
  },
  addToCartIcon: {
    backgroundColor: '#FF7000',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartIconDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  plusIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  plusIconDisabled: {
    color: '#666666',
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
    alignItems: 'flex-start',
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
    marginTop:5
  },
  infoLabel: {
    fontSize: 14,
  
    color: Constants.customgrey,
    fontWeight: '500',
    marginRight: 6,
    
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: Constants.black,
  },
  deliveryInfoValue: {
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
  stockInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  stockLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  inStock: {
    color: '#10B981',
  },
  outOfStock: {
    color: '#EF4444',
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  imageWrapper: {
    width: '100%',
    height: 350,
  },
  imageShadowBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  carouselSlide: {
    width: Dimensions.get('window').width - 30,
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