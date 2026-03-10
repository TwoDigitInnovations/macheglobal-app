import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GetApi } from '../../Assets/Helpers/Service';
import { useTranslation } from 'react-i18next';
import DriverHeader from '../../Assets/Component/DriverHeader';

const COLORS = {
  primary: '#FF7000',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9CA3AF',
  lightGray: '#F3F4F6',
  darkGray: '#4B5563',
  red: '#EF4444',
  green: '#10B981',
  yellow: '#F59E0B',
  blue: '#3B82F6',
};

const { width } = Dimensions.get('window');

const ProductDetails = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef(null);
  
  // Extract images from product data
  const images = useMemo(() => {
    if (!product) return [];
    
    // For simple products
    if (product.productType === 'simple' && product?.simpleProduct?.images?.length > 0) {
      return product.simpleProduct.images;
    }
    
    // For variable products - check varients[0].image
    if (product?.varients?.[0]?.image?.length > 0) {
      return product.varients[0].image;
    }
    
    // Alternative structure - variants[0].images
    if (product?.variants?.[0]?.images?.length > 0) {
      return product.variants[0].images;
    }
    
    return [];
  }, [product]);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await GetApi(`product/getProductById/${productId}`);
      if (response?.status && response.data) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  // FlatList carousel handlers
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const renderImageItem = ({ item }) => (
    <View style={styles.imageSlide}>
      <Image 
        source={{ uri: item }} 
        style={styles.productImage} 
        resizeMode="contain"
      />
    </View>
  );

  const renderImages = () => {
    if (!images.length) {
      return (
        <View style={styles.imageContainer}>
          <View style={styles.placeholderImageContainer}>
            <Text style={styles.placeholderText}>No Product Image</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
        
        {images.length > 1 && (
          <View style={styles.imagePagination}>
            {images.map((_, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => {
                  flatListRef.current?.scrollToIndex({ index, animated: true });
                }}
                style={[
                  styles.paginationDot, 
                  index === currentImageIndex && styles.activeDot
                ]} 
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text>{t('Product not found')}</Text>
      </View>
    );
  }
  
  const { 
    name, 
    categoryName, 
    subCategoryName, 
    pieces,
    sold_pieces,
    long_description,
    short_description,
    createdAt,
    updatedAt,
    varients = [],
    productType,
    simpleProduct
  } = product;
  
  // Get display price
  const getDisplayPrice = () => {
    if (productType === 'simple' && simpleProduct) {
      return {
        price: parseFloat(simpleProduct.price) || 0,
        offerPrice: parseFloat(simpleProduct.offerPrice || simpleProduct.offerprice) || parseFloat(simpleProduct.price) || 0
      };
    }
    
    if (varients?.[0]?.selected?.[0]) {
      const selected = varients[0].selected[0];
      return {
        price: parseFloat(selected.price) || 0,
        offerPrice: parseFloat(selected.offerprice || selected.offerPrice) || parseFloat(selected.price) || 0
      };
    }
    
    return { price: 0, offerPrice: 0 };
  };
  
  const { price: displayPrice, offerPrice } = getDisplayPrice();
  const hasDiscount = displayPrice > offerPrice && offerPrice > 0;

  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('Product Details')} showback={true} />

      <ScrollView style={styles.content}>
        {renderImages()}

        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{name}</Text>
            <View style={styles.priceContainer}>
              {hasDiscount && (
                <Text style={styles.originalPrice}>${displayPrice.toFixed(2)}</Text>
              )}
              <Text style={styles.price}>${offerPrice.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('Category')}:</Text>
            <Text style={styles.detailValue}>{categoryName || t('N/A')}</Text>
          </View>
          {subCategoryName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('Subcategory')}:</Text>
              <Text style={styles.detailValue}>{subCategoryName}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('Available Stock')}:</Text>
            <Text style={[styles.stockText, { color: pieces > 0 ? COLORS.green : COLORS.red }]}>
              {pieces} {pieces === 1 ? t('piece') : t('pieces')}
            </Text>
          </View>
          {sold_pieces > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('Sold')}:</Text>
              <Text style={styles.detailValue}>{sold_pieces} {sold_pieces === 1 ? t('piece') : t('pieces')}</Text>
            </View>
          )}

          {(long_description || short_description) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('Description')}</Text>
              {long_description ? (
                <Text style={styles.description}>
                  {long_description.replace(/<[^>]*>?/gm, '')}
                </Text>
              ) : (
                <Text style={styles.description}>
                  {short_description}
                </Text>
              )}
            </View>
          )}

          {/* Show all variants if product has multiple variants */}
          {varients && varients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('Available Variants')} ({varients.length})</Text>
              {varients.map((variant, index) => {
                const selected = variant.selected?.[0];
                const variantPrice = parseFloat(selected?.price) || 0;
                const variantOfferPrice = parseFloat(selected?.offerprice || selected?.offerPrice) || variantPrice;
                const variantHasDiscount = variantPrice > variantOfferPrice && variantOfferPrice > 0;
                
                let variantImageUrl = null;
                if (variant.image && Array.isArray(variant.image) && variant.image.length > 0) {
                  variantImageUrl = typeof variant.image[0] === 'string' 
                    ? variant.image[0] 
                    : variant.image[0]?.url;
                }
                
                return (
                  <View key={index} style={styles.variantCard}>
                    {variantImageUrl ? (
                      <Image 
                        source={{ uri: variantImageUrl }} 
                        style={styles.variantImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.variantImagePlaceholder}>
                        <Text style={styles.placeholderText}>No Image</Text>
                      </View>
                    )}
                    
                    <View style={styles.variantHeader}>
                      <Text style={styles.variantTitle}>{t('Variant')} {index + 1}</Text>
                      {variant.color && (
                        <View style={styles.colorIndicator}>
                          <View style={[styles.colorBox, {backgroundColor: variant.color}]} />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.variantDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{t('Stock')}:</Text>
                        <Text style={styles.detailValue}>{selected?.qty || 0} {t('pieces')}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{t('Price')}:</Text>
                        <View style={styles.priceRow}>
                          {variantHasDiscount && (
                            <Text style={styles.strikethroughPrice}>${variantPrice.toFixed(2)}</Text>
                          )}
                          <Text style={[styles.detailValue, variantHasDiscount && styles.offerPriceText]}>
                            ${variantOfferPrice.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Product Information')}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('Added On')}:</Text>
              <Text style={styles.detailValue}>
                {new Date(createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('Last Updated')}:</Text>
              <Text style={styles.detailValue}>
                {new Date(updatedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.8,
    backgroundColor: '#f8f8f8',
  },
  imageSlide: {
    width: width,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 16,
  },
  detailsContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  stockText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  variantCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  variantTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variantImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: COLORS.lightGray,
  },
  variantImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.gray,
    fontSize: 12,
  },
  variantDetails: {
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strikethroughPrice: {
    fontSize: 14,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
  },
  offerPriceText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductDetails;
