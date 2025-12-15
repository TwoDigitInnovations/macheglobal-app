import React, { useContext, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
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

const Products = props => {
  const { t } = useTranslation();
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [productlist, setproductlist] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10
  });
  const IsFocused = useIsFocused();
  const data = props?.route?.params?.item;
  const catname = props?.route?.params?.name;
  const topsell = props?.route?.params?.type;
  const isSubcategory = props?.route?.params?.isSubcategory; // New parameter

  useEffect(() => {
    if (data) {
      getproduct(1);
    } else if (topsell === 'topselling') {
      getTopSoldProduct(1);
    } else {
      getproduct(1);
    }
  }, []);

  useEffect(() => {
    if (IsFocused) {
      setInitialRoute();
    }
  }, [IsFocused]);

  const setInitialRoute = async () => {
    const user = await AsyncStorage.getItem('userDetail');
  };

  const getproduct = async (p = 1, limit = 10) => {
    try {
      setPage(p);
      setLoading(true);
      
      let url = `product/getProduct?page=${p}&limit=${limit}`;
      
      if (data) {
        console.log('data', data);
        // Check if it's a subcategory or category
        if (isSubcategory) {
          url += `&subcategoryId=${data}`;
        } else {
          url += `&categoryId=${data}`;
        }
      }
      
      const res = await GetApi(url, {});
      
      setLoading(false);
      
      if (res && res.status) {
        if (p === 1) {
          setproductlist(res.data);
        } else {
          setproductlist(prevProducts => [...prevProducts, ...res.data]);
        }
        
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setLoading(false);
      console.error('Error fetching products:', err);
    }
  };

  const getTopSoldProduct = async (p = 1) => {
    setPage(p);
    setLoading(true);
    try {
      const res = await GetApi(`getTopSoldProduct?page=${p}`);
      console.log('stoooo',res)
      setLoading(false);
      if (res.status) {
        if (p === 1) {
          setproductlist(res.data);
        } else {
          setproductlist([...productlist, ...res.data]);
        }
      }
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };

  const cartdata = async productdata => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];

    const existingProduct = existingCart.find(
      f => f.productid === productdata._id
    );

    if (!existingProduct) {
      const newProduct = {
        productid: productdata._id,
        productname: productdata.name,
        frenchName: productdata?.frenchName,
        price: productdata?.price_slot?.[0]?.other_price || 0,
        offer: productdata?.price_slot?.[0]?.our_price || 0,
        image: productdata.varients?.[0]?.image?.[0] || '',
        price_slot: productdata?.price_slot?.[0] || {},
        qty: 1,
        seller_id: productdata.SellerId,
        slug: productdata.slug,
      };

      const updatedCart = [...existingCart, newProduct];
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    } else {
      let stringdata = cartdetail.map(_i => {
        if (_i?.productid === productdata._id) {
          return { ..._i, qty: _i?.qty + 1 };
        } else {
          return _i;
        }
      });
      setcartdetail(stringdata);
      await AsyncStorage.setItem('cartdata', JSON.stringify(stringdata));
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
        onPress={() => navigate('Preview', item.slug)}
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
      <DriverHeader item={t('Products')} showback={true} />
      
      {catname && (
        <Text style={styles.headtxt}>{catname}</Text>
      )}

      <FlatList
        data={productlist}
        renderItem={renderProductCard}
        keyExtractor={(item, index) => item._id || index.toString()}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('No Products')}</Text>
            </View>
          )
        }
        onEndReached={() => {
          if (page < pagination.totalPages) {
            if (topsell === 'topselling') {
              getTopSoldProduct(page + 1);
            } else {
              getproduct(page + 1);
            }
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

export default Products;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headtxt: {
    color: Constants.black,
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 12,
    fontFamily: FONTS.Bold,
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
  addButton: {
    backgroundColor: Constants.pink,
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F3F3',
    borderRadius: 8,
    overflow: 'hidden',
    height: 36,
  },
  quantityButton: {
    backgroundColor: Constants.pink,
    width: 32,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: FONTS.Bold,
    color: Constants.black,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 36,
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
  color:'#374151'
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
});