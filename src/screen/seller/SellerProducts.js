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
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GetApi, Delete } from '../../Assets/Helpers/Service';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const SellerProducts = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      // Get seller ID from AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const userDetail = await AsyncStorage.getItem('userDetail');
      const user = userDetail ? JSON.parse(userDetail) : null;
      const sellerId = user?.user?._id || user?._id;
      
      console.log('Fetching products for seller:', sellerId);
      
      // Add SellerId parameter to filter products
      const response = await GetApi(`product/getProduct?SellerId=${sellerId}&page=1&limit=100`);
      console.log('Products API Response:', response);
      
      if (response?.status && Array.isArray(response?.data)) {
        setProducts(response.data);
      } else {
        setError(t('Failed to load products'));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(t('An error occurred while loading products'));
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
    // Helper to convert AVIF to JPG
    const convertAvifToJpg = (imageUrl) => {
      if (imageUrl && imageUrl.includes('.avif')) {
        return imageUrl.replace('.avif', '.jpg');
      }
      return imageUrl;
    };
    
    // Check for variant images first (this is where your product images are)
    if (item?.varients && Array.isArray(item.varients) && item.varients.length > 0) {
      const variant = item.varients[0];
      
      // Check variant.image array (your data structure uses this)
      if (variant?.image && Array.isArray(variant.image) && variant.image.length > 0) {
        const imageUrl = typeof variant.image[0] === 'string' 
          ? variant.image[0] 
          : variant.image[0]?.url || variant.image[0];
        return convertAvifToJpg(imageUrl);
      }
      
      // Check variant.images array (alternative structure)
      if (variant?.images && Array.isArray(variant.images) && variant.images.length > 0) {
        const imageUrl = typeof variant.images[0] === 'string' 
          ? variant.images[0] 
          : variant.images[0]?.url;
        return convertAvifToJpg(imageUrl);
      }
    }
    
    // Check for simple product images
    if (item?.simpleProduct?.images && Array.isArray(item.simpleProduct.images) && item.simpleProduct.images.length > 0) {
      const imageUrl = typeof item.simpleProduct.images[0] === 'string'
        ? item.simpleProduct.images[0]
        : item.simpleProduct.images[0]?.url;
      return convertAvifToJpg(imageUrl);
    }
    
    // Check for variants array (alternative structure)
    if (item?.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      const variant = item.variants[0];
      if (variant?.images && Array.isArray(variant.images) && variant.images.length > 0) {
        const imageUrl = typeof variant.images[0] === 'string'
          ? variant.images[0]
          : variant.images[0]?.url;
        return convertAvifToJpg(imageUrl);
      }
    }

    // Only use placeholder if no product images found - DO NOT use category image
    return 'https://via.placeholder.com/150';
  };

  const getProductPrice = (item) => {
    try {
      // For variable products - check varients[0].selected[0]
      if (item?.varients?.[0]?.selected?.[0]) {
        const selected = item.varients[0].selected[0];
        const price = parseFloat(selected.price) || 0;
        const offerPrice = parseFloat(selected.offerprice || selected.offerPrice) || price;
        return {
          originalPrice: price,
          offerPrice: offerPrice
        };
      }
      
      // For simple products - check simpleProduct
      if (item?.simpleProduct) {
        const price = parseFloat(item.simpleProduct.price) || 0;
        const offerPrice = parseFloat(item.simpleProduct.offerPrice || item.simpleProduct.offerprice) || price;
        return {
          originalPrice: price,
          offerPrice: offerPrice
        };
      }
      
      // Check variants array (alternative structure)
      if (item?.variants?.[0]) {
        const variant = item.variants[0];
        const price = parseFloat(variant.price) || 0;
        const offerPrice = parseFloat(variant.offerPrice || variant.offerprice) || price;
        return {
          originalPrice: price,
          offerPrice: offerPrice
        };
      }
      
      // Fallback to direct properties
      if (item?.price !== undefined) {
        const price = parseFloat(item.price) || 0;
        const offerPrice = parseFloat(item.offerPrice || item.offerprice) || price;
        return {
          originalPrice: price,
          offerPrice: offerPrice
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

  const navigateToProductDetails = (product) => {
    navigation.navigate('ProductDetails', { productId: product._id });
  };

  const handleDeleteProduct = (productId) => {
    console.log('Delete button clicked for product:', productId);
    setProductToDelete(productId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      console.log('Delete confirmed');
      deleteProduct(productToDelete);
      setDeleteModalVisible(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    console.log('Delete cancelled');
    setDeleteModalVisible(false);
    setProductToDelete(null);
  };

  const deleteProduct = async (productId) => {
    try {
      console.log('Starting delete for product:', productId);
      setLoading(true);
      
  
      const response = await Delete(`product/deleteProduct/${productId}`, {});
      console.log('Delete response:', response);
      
      if (response?.status === true || response?.success === true) {
       
        setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
        Alert.alert(t('Success'), t('Product deleted successfully'));
        // Refresh the list
        fetchProducts(false);
      } else {
        throw new Error(response?.message || t('Failed to delete product'));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert(t('Error'), error.message || t('An error occurred while deleting the product'));
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const imageUrl = getProductImage(item);
    const { originalPrice, offerPrice } = getProductPrice(item);
    const stock = getProductStock(item);
    const hasDiscount = originalPrice > offerPrice;

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => navigateToProductDetails(item)}
      >
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
              {item.name || t('Unnamed Product')}
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
            {/* <TouchableOpacity style={styles.iconButton}>
              <Icon name="edit" size={18} color="#3B82F6" />
            </TouchableOpacity> */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => handleDeleteProduct(item._id)}
            >
              <Icon name="delete-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>{t('My Products')}</Text>
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
          <Text style={styles.headerTitle}>{t('My Products')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <Icon name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchProducts()}
          >
            <Text style={styles.retryButtonText}>{t('Retry')}</Text>
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
        <Text style={styles.headerTitle}>{t('My Products')}</Text>
        {/* <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.addButtonText}>+ Add Product</Text>
        </TouchableOpacity> */}
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
            <Text style={styles.emptyText}>{t('No products found')}</Text>
            <Text style={styles.emptySubtext}>
              {t('Tap + Add Product to get started')}
            </Text>
          </View>
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Icon name="delete-outline" size={48} color="#EF4444" />
            </View>
            
            <Text style={styles.modalTitle}>{t('Delete Product')}</Text>
            <Text style={styles.modalMessage}>
              {t('Are you sure you want to delete this product? This action cannot be undone.')}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>{t('Delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width - 60,
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SellerProducts;