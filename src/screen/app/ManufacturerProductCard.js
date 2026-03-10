import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { navigate } from '../../../navigationRef';

const ManufacturerProductCard = ({ item }) => {
  // Get product image
  const getProductImage = () => {
    // Check for variant images first
    if (item?.varients && Array.isArray(item.varients) && item.varients.length > 0) {
      const variant = item.varients[0];
      
      // Check variant.image array
      if (variant?.image && Array.isArray(variant.image) && variant.image.length > 0) {
        return typeof variant.image[0] === 'string' 
          ? variant.image[0] 
          : variant.image[0]?.url || variant.image[0];
      }
      
      // Check variant.images array
      if (variant?.images && Array.isArray(variant.images) && variant.images.length > 0) {
        return typeof variant.images[0] === 'string' 
          ? variant.images[0] 
          : variant.images[0]?.url;
      }
    }
    
    // Check for simple product images
    if (item?.simpleProduct?.images && Array.isArray(item.simpleProduct.images) && item.simpleProduct.images.length > 0) {
      return typeof item.simpleProduct.images[0] === 'string'
        ? item.simpleProduct.images[0]
        : item.simpleProduct.images[0]?.url;
    }
    
    // Check for variants array (alternative structure)
    if (item?.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      const variant = item.variants[0];
      if (variant?.images && Array.isArray(variant.images) && variant.images.length > 0) {
        return typeof variant.images[0] === 'string'
          ? variant.images[0]
          : variant.images[0]?.url;
      }
    }

    return 'https://via.placeholder.com/150';
  };

  // Get product price
  const getProductPrice = () => {
    try {
      // For variable products - check varients[0].selected[0]
      if (item?.varients?.[0]?.selected?.[0]) {
        const selected = item.varients[0].selected[0];
        const price = parseFloat(selected.price) || 0;
        const offerPrice = parseFloat(selected.offerprice || selected.offerPrice) || price;
        return offerPrice;
      }
      
      // For simple products - check simpleProduct
      if (item?.simpleProduct) {
        const price = parseFloat(item.simpleProduct.price) || 0;
        const offerPrice = parseFloat(item.simpleProduct.offerPrice || item.simpleProduct.offerprice) || price;
        return offerPrice;
      }
      
      // Check variants array (alternative structure)
      if (item?.variants?.[0]) {
        const variant = item.variants[0];
        const price = parseFloat(variant.price) || 0;
        const offerPrice = parseFloat(variant.offerPrice || variant.offerprice) || price;
        return offerPrice;
      }
      
      // Fallback to direct properties
      if (item?.price !== undefined) {
        const price = parseFloat(item.price) || 0;
        const offerPrice = parseFloat(item.offerPrice || item.offerprice) || price;
        return offerPrice;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting product price:', error);
      return 0;
    }
  };

  const imageUrl = getProductImage();
  const price = getProductPrice();

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigate('ManufacturerProductDetail', { productId: item?._id })}>
      <View style={styles.imageContainer}>
        {imageUrl && imageUrl !== 'https://via.placeholder.com/150' ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item?.name}
        </Text>
        <Text style={styles.productPrice}>
          {Currency} {price ? price.toFixed(2) : '0.00'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ManufacturerProductCard;

const styles = StyleSheet.create({
  productCard: {
    width: (Dimensions.get('window').width - 35) / 2,
    backgroundColor: Constants.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 5,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F9F9F9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 10,
    minHeight: 70,
  },
  productName: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    color: Constants.black,
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    color: Constants.saffron,
    marginTop: 2,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
  },
});
