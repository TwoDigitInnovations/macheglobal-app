import React, { createRef, useContext, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { CartContext, LoadContext, ToastContext } from '../../../App';
import { GetApi } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useNavigation } from '@react-navigation/native';
import {
  BackIcon,
  CartFilledIcon,
  SearchIcon,
} from '../../../Theme';

const { width } = Dimensions.get('window');

const Searchpage = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [productlist, setProductlist] = useState([]);
  const [searchkey, setSearchkey] = useState('');
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

  const getSearchProducts = async (p = 1, searchText = '') => {
    try {
      if (p === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      if (searchText.trim().length >= 2) {
        const res = await GetApi(`product/productSearch?page=${p}&key=${encodeURIComponent(searchText)}`);
        
        if (p === 1) {
          setLoading(false);
        } else {
          setIsLoadingMore(false);
        }
        
        if (res && res.status) {
          if (p === 1) {
            setProductlist(res.data || []);
          } else {
            setProductlist(prevProducts => [...prevProducts, ...(res.data || [])]);
          }
          
          if (res.pagination) {
            setPagination(res.pagination);
          }
        }
      } else if (p === 1) {
        setProductlist([]);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setIsLoadingMore(false);
      console.error('Error searching products:', err);
    }
  };

  const handleSearch = (text) => {
    setSearchkey(text);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (text.trim().length > 0) {
        getSearchProducts(1, text);
      } else {
        setProductlist([]);
      }
    }, 500);

    setSearchTimeout(timeout);
  };

  const cartdata = async (productdata) => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
    const existingProduct = existingCart.find(
      f => f.productid === productdata._id
    );

    if (!existingProduct) {
      const newProduct = {
        productid: productdata._id,
        productname: productdata.name,
        vietnamiesName: productdata?.vietnamiesName,
        price: productdata?.price_slot?.[0]?.other_price || 0,
        offer: productdata?.price_slot?.[0]?.our_price || 0,
        image: productdata.varients?.[0]?.image?.[0] || '',
        price_slot: productdata?.price_slot?.[0] || {},
        qty: 1,
        seller_id: productdata.userid,
        slug: productdata.slug,
      };

      const updatedCart = [...existingCart, newProduct];
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    } else {
      const updatedCart = cartdetail.map(item => 
        item.productid === productdata._id 
          ? { ...item, qty: (item.qty || 0) + 1 } 
          : item
      );
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    }
    setToast(t('Successfully added to cart.'));
  };

  const renderProductCard = ({ item, index }) => {
    const cartItem = Array.isArray(cartdetail)
      ? cartdetail.find(it => it?.productid === item?._id)
      : undefined;

    const displayName = i18n.language === 'vi' 
      ? (item?.vietnamiesName || item?.name) 
      : item?.name;

    const moq = item?.pieces || 0;
    const price = item?.price_slot?.[0]?.our_price || item?.price_slot?.[0]?.other_price || 0;
    const imageUrl = item?.varients?.[0]?.image?.[0] || '';

    return (
      <TouchableOpacity
        key={item._id || index.toString()}
        style={styles.productCard}
        onPress={() => navigation.navigate('Preview', item.slug)}
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon width={24} height={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <SearchIcon width={20} height={20} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={t('What are you looking for?')}
            placeholderTextColor="#999"
            value={searchkey}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Cart')}
          style={styles.cartButton}>
          <CartFilledIcon width={24} height={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {loading ? (
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
            if (pagination.currentPage < pagination.totalPages && !isLoadingMore) {
              getSearchProducts(pagination.currentPage + 1, searchkey);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Constants.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchkey ? t('No products found') : t('Search for products')}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Searchpage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#000',
    fontFamily: FONTS.Regular,
    padding: 0,
  },
  cartButton: {
    padding: 5,
    marginLeft: 10,
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
    alignItems: 'center',
    justifyContent: 'center',
    height: Dimensions.get('window').height - 200,
  },
  emptyText: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Medium,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});