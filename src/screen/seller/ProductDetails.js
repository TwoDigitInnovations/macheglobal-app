import React, { useState, useEffect, useMemo } from 'react';
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
  Share,
  PanResponder,
  Animated
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GetApi } from '../../Assets/Helpers/Service';

// Define colors directly since the colors helper is not available
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
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const pan = React.useRef(new Animated.ValueXY()).current;
  
  const images = useMemo(() => {
    return product?.varients?.[0]?.image || [];
  }, [product]);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  useEffect(() => {
    // Reset pan value when images change
    pan.setValue({ x: 0, y: 0 });
    setCurrentImageIndex(0);
  }, [images.length]);
  
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 3);
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        const SWIPE_THRESHOLD = 50;
        
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          // Calculate new index based on swipe direction
          const newIndex = dx > 0 
            ? Math.max(0, currentImageIndex - 1) // Swipe right
            : Math.min(images.length - 1, currentImageIndex + 1); // Swipe left
          
          // Only update if index changed
          if (newIndex !== currentImageIndex) {
            setCurrentImageIndex(newIndex);
          }
        }
        
        // Always animate back to center
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          tension: 100,
          friction: 10
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true
        }).start();
      },
    })
  ).current;

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await GetApi(`product/getProductById/${productId}`);
      console.log(response)
      if (response?.status && response.data) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };


 const renderImages = () => {
  if (!images.length) {
    return (
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/300' }} 
          style={styles.productImage} 
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={styles.imageContainer}>
      <Animated.View 
        style={[
          styles.imageWrapper,
          {
            transform: [{ translateX: pan.x }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Image 
          key={currentImageIndex}  // YE ADD KARO - IMPORTANT!
          source={{ uri: images[currentImageIndex] }} 
          style={styles.productImage} 
          resizeMode="contain"
        />
      </Animated.View>
      
      {images.length > 1 && (
        <View style={styles.imagePagination}>
          {images.map((_, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => setCurrentImageIndex(index)}
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
        <Text>Product not found</Text>
      </View>
    );
  }
  
  // Extract product details
  const { 
    name, 
    categoryName, 
    subCategoryName, 
    price,
    pieces,
    sold_pieces,
    long_description,
    short_description,
    createdAt,
    updatedAt,
    varients = []
  } = product;
  
  const variant = varients[0] || {};
  const selectedVariant = variant.selected?.[0] || {};

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Icon name="more-vert" size={24} color="#000" />
        </TouchableOpacity>
      </View> */}

      <ScrollView style={styles.content}>
        {renderImages()}

        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${selectedVariant.price || price || '0'}</Text>
              {selectedVariant.mrp && selectedVariant.mrp > (selectedVariant.price || price) && (
                <Text style={styles.originalPrice}>${selectedVariant.mrp}</Text>
              )}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{categoryName || 'N/A'}</Text>
          </View>
          {subCategoryName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subcategory:</Text>
              <Text style={styles.detailValue}>{subCategoryName}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Available Stock:</Text>
            <Text style={[styles.stockText, { color: pieces > 0 ? COLORS.green : COLORS.red }]}>
              {pieces} {pieces === 1 ? 'piece' : 'pieces'}
            </Text>
          </View>
          {sold_pieces > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sold:</Text>
              <Text style={styles.detailValue}>{sold_pieces} {sold_pieces === 1 ? 'piece' : 'pieces'}</Text>
            </View>
          )}

          {(long_description || short_description) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
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

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {Object.entries(product.specifications).map(([key, value]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specKey}>{key}:</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {selectedVariant && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Variant Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>${selectedVariant.price || price || '0'}</Text>
              </View>
              {selectedVariant.mrp && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>MRP:</Text>
                  <Text style={[styles.detailValue, {textDecorationLine: 'line-through'}]}>
                    ${selectedVariant.mrp}
                  </Text>
                </View>
              )}
              {selectedVariant.color && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Color:</Text>
                  <View style={[styles.colorBox, {backgroundColor: selectedVariant.color}]} />
                  <Text style={styles.detailValue}>{selectedVariant.color}</Text>
                </View>
              )}
              {selectedVariant.size && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size:</Text>
                  <Text style={styles.detailValue}>{selectedVariant.size}</Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Added On:</Text>
              <Text style={styles.detailValue}>
                {new Date(createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Updated:</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.8,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
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
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    color: '#666',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
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
  specRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  specKey: {
    fontWeight: '600',
    color: '#333',
    width: 120,
  },
  specValue: {
    flex: 1,
    color: '#666',
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  variantItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  variantText: {
    fontSize: 14,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
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
