import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BackIcon } from '../../../Theme';
import { MinusIcon, Plus2Icon, PlusIcon } from '../../../Theme';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { CartContext, LoadContext, ToastContext } from '../../../App';
import { GetApi } from '../../Assets/Helpers/Service';
import { navigate } from '../../../navigationRef';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const SubcategoryProducts = props => {
  const { t } = useTranslation();
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [productlist, setProductlist] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10
  });
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const subcategoryId = props?.route?.params?.item;
  const subcategoryName = props?.route?.params?.name;

  useEffect(() => {
    if (isFocused && subcategoryId) {
      getProducts(1);
    }
  }, [isFocused, subcategoryId]);

  const getProducts = async (p = 1, limit = 10) => {
    try {
      if (p === 1) {
        setLoading(true);
        setProductlist([]);
      }

     
      const url = `product/getProduct?page=${p}&limit=100`; 
      
      
      const res = await GetApi(url, {});
     

      if (res?.status) {
      
        let products = Array.isArray(res.data) ? res.data : [];
        console.log('Total products from API:', products.length);
        console.log('Filtering by subcategoryId:', subcategoryId);
        
        if (subcategoryId) {
          products = products.filter(product => {
            // Check if subcategoryId matches subcategory field
            if (product.subcategory === subcategoryId) {
              console.log('Match found - subcategory:', product.name);
              return true;
            }
            
            // Check if subcategoryId matches category field (for products without subcategory)
            if (product.category === subcategoryId || product.category?._id === subcategoryId) {
              console.log('Match found - category:', product.name);
              return true;
            }
            
            // Check if subcategoryId is in category's Subcategory array
            if (product.category?.Subcategory?.some(sub => sub._id === subcategoryId)) {
              console.log('Match found - category subcategory:', product.name);
              return true;
            }
            
            return false;
          });
          console.log('Filtered products count:', products.length);
        }
        
        
        
        if (p === 1) {
          setProductlist(products);
        } else {
          setProductlist(prev => [...prev, ...products]);
        }
        
        // Update pagination
        setPagination({
          totalPages: Math.ceil(products.length / limit),
          currentPage: p,
          itemsPerPage: limit
        });
      } else {
        console.log('No products found', res?.message || 'No products available');
        if (p === 1) {
          setProductlist([]);
        }
        setToast(res?.message || 'No products found for this category');
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      if (p === 1) {
        setProductlist([]);
        setToast('Failed to load products. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cartdata = async productdata => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
    const existingProduct = existingCart.find(item => item.productid === productdata._id);

    if (existingProduct) {
      const updatedCart = existingCart.map(item =>
        item.productid === productdata._id
          ? { ...item, qty: (item.qty || 1) + 1 }
          : item
      );
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    } else {
      const newCart = [
        ...existingCart,
        {
          productid: productdata._id,
          name: productdata.name,
          frenchName: productdata.frenchName,
          price: productdata.price_slot?.[0]?.our_price || 0,
          image: productdata.varients?.[0]?.image?.[0] || '',
          qty: 1,
          moq: productdata.pieces || 1,
          unit: productdata.price_slot?.[0]?.unit || '',
          value: productdata.price_slot?.[0]?.value || ''
        }
      ];
      setcartdetail(newCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(newCart));
    }
    setToast(t('Successfully added to cart.'));
  };

  const renderProductCard = ({ item, index }) => {
    const cartItem = Array.isArray(cartdetail)
      ? cartdetail.find(it => it?.productid === item?._id)
      : undefined;

    const displayName = i18n.language === 'fr' 
      ? (item?.frenchName || item?.name) 
      : item?.name;

    const moq = item?.pieces || 0;
    const price = item?.price_slot?.[0]?.our_price || item?.price_slot?.[0]?.other_price || 0;
    const imageUrl = item?.varients?.[0]?.image?.[0] || '';

    return (
      <TouchableOpacity
        key={item._id || index.toString()}
        style={styles.productCard}
        onPress={() => navigate('Preview', { slug: item.slug })}
        activeOpacity={0.8}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Product Name */}
          <Text style={styles.productName} numberOfLines={2}>
            {displayName}
          </Text>

          {/* Category/Subcategory */}
          {item?.categoryName && (
            <Text style={styles.categoryText} numberOfLines={1}>
              {item.categoryName}
            </Text>
          )}

          {/* MOQ */}
          <Text style={styles.moqText}>
            MOQ: {moq}
          </Text>

          {/* Price & Add to Cart */}
          <View style={styles.bottomRow}>
            <View style={styles.priceContainer}>
              {price > 0 && (
                <Text style={styles.priceText}>
                  {price} HTG
                </Text>
              )}
            </View>
          </View>

          {/* Fast Delivery Badge */}
          <View style={styles.deliveryBadge}>
            <Text style={styles.deliveryText}>Fast Delivery</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const numColumns = Dimensions.get('window').width >= 600 ? 3 : 2;

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <BackIcon width={24} height={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {subcategoryName ? t(subcategoryName) : t('Products')}

      </Text>
      <View style={styles.headerRight} />
    </View>
  );

  if (loading && productlist.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {renderHeader()}
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Constants.primaryColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (productlist.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {renderHeader()}
        <View style={styles.centerContent}>
          <Text style={styles.noProductsText}>{t('No products found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.primary} />
        </View>
      ) : productlist.length > 0 ? (
        <FlatList
          data={productlist}
          renderItem={renderProductCard}
          keyExtractor={(item, index) => item._id || index.toString()}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
          onEndReached={() => {
            if (pagination.currentPage < pagination.totalPages && !loading) {
              getProducts(pagination.currentPage + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Constants.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('No products found')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noProductsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#000',
    marginLeft: 8,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    maxWidth: Dimensions.get('window').width / 2 - 24,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F3F3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  productInfo: {
    padding: 8,
    paddingTop: 6,
  },
  productName: {
    fontSize: 16,
    fontFamily: FONTS.Black,
    fontWeight: '700',
    color: Constants.black,
    marginBottom: -2,
    minHeight: 32,
    lineHeight: 20,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    color: '#666',
    marginTop: -2,
    marginBottom: 0,
    lineHeight: 16,
  },
  moqText: {
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
    color: Constants.black,
    marginTop: 0,
    marginBottom: 2,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    color: Constants.black,
  },
  deliveryBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  deliveryText: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    color: '#374151'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.Medium,
    fontSize: 16,
    color: '#666',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SubcategoryProducts;