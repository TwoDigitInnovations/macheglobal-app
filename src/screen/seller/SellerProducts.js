import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Dimensions,
  StatusBar
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GetApi } from '../../Assets/Helpers/Service';

const { width } = Dimensions.get('window');

const SellerProducts = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      const response = await GetApi('product/getProduct');
      console.log('Products API Response:', response);
      
      if (response?.status && Array.isArray(response?.data)) {
        setProducts(response.data);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('An error occurred while loading products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
    }, [])
  );

  const onRefresh = () => {
    fetchProducts(false);
  };

  const getProductImage = (item) => {
    if (item?.varients && Array.isArray(item.varients) && item.varients.length > 0) {
      const variant = item.varients[0];
      if (variant?.images && Array.isArray(variant.images) && variant.images.length > 0) {
        return variant.images[0]?.url || variant.images[0];
      }
    }
    if (item?.category?.image?.url) {
      return item.category.image.url;
    }
    return null;
  };

  const getProductPrice = (item) => {
    try {
      // Try to get from varients[0].selected[0] (your data structure)
      if (item?.varients?.[0]?.selected?.[0] !== undefined) {
        const selected = item.varients[0].selected[0];
        return {
          originalPrice: parseFloat(selected.price) || 0,
          offerPrice: parseFloat(selected.offerprice || selected.price) || 0
        };
      }
      
      // Fallback to direct properties in case the structure is different
      if (item?.price !== undefined) {
        return {
          originalPrice: parseFloat(item.price) || 0,
          offerPrice: parseFloat(item.offerprice || item.price) || 0
        };
      }
      
      // Last resort, check pieces as price (some APIs use this)
      if (item?.pieces !== undefined) {
        const price = parseFloat(item.pieces) || 0;
        return {
          originalPrice: price,
          offerPrice: price
        };
      }
      
      return { originalPrice: 0, offerPrice: 0 };
    } catch (error) {
      console.error('Error getting product price:', error, item);
      return { originalPrice: 0, offerPrice: 0 };
    }
  };

  const getProductStock = (item) => {
    return item?.pieces || 0;
  };

  const renderItem = ({ item }) => {
    const imageUrl = getProductImage(item);
    const { originalPrice, offerPrice } = getProductPrice(item);
    const stock = getProductStock(item);
    const hasDiscount = originalPrice > offerPrice;

    return (
      <View style={styles.productCard}>
        <View style={styles.cardContent}>
          {/* Product Image */}
          <View style={styles.imageWrapper}>
            {imageUrl ? (
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Icon name="image" size={28} color="#D1D5DB" />
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name || 'Unnamed Product'}
            </Text>
            <Text style={styles.categoryName} numberOfLines={1}>
              {item.categoryName}
            </Text>
            <View style={styles.priceStockRow}>
              <View>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>${originalPrice.toFixed(2)}</Text>
                )}
                <Text style={[
                  styles.productPrice,
                  hasDiscount && styles.discountedPrice
                ]}>
                  ${offerPrice.toFixed(2)}
                </Text>
              </View>
              <View style={styles.stockContainer}>
                <Icon name="inventory-2" size={14} color="#6B7280" />
                <Text style={styles.stockText}>{stock}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="edit" size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="delete-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Products</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Products</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <Icon name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchProducts()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.addButtonText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={item => item._id || Math.random().toString()}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inventory-2" size={64} color="#E5E7EB" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>
              Tap + Add Product to get started
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  productsList: {
    padding: 12,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  categoryName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  priceStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  discountedPrice: {
    color: '#FF7000',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default SellerProducts;