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
  const imageUrl = item?.varients?.[0]?.image?.[0] || '';
  const price = item?.varients?.[0]?.selected?.[0]?.offerprice || 
                item?.varients?.[0]?.selected?.[0]?.price || 0;

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigate('ManufacturerProductDetail', { productId: item?._id })}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item?.name}
        </Text>
        <Text style={styles.productPrice}>
          {Currency} {price.toFixed(2)}
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
});
