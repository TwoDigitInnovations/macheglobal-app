/* eslint-disable react-native/no-inline-styles */
import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MinusIcon, Plus2Icon, PlusIcon } from '../../../Theme';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Currency } from '../../Assets/Helpers/constant';
import { navigate } from '../../../navigationRef';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { BlurView } from "@react-native-community/blur";
import i18n from 'i18next';

const ProductCard = ({
  item,
  cartItem,
  cartdata,
  setcartdetail,
  cartdetail,
  currentSale,
  salePrice = null,
  saleVarient = {}
}) => {
  const { t } = useTranslation();
  if (!item) {
    return null;
  }

  useEffect(() => {
    console.log(item)
  }, [item])

  return (
    <Pressable
      disabled={item.Quantity <= 0}
      onPress={() => navigate('Preview', item.slug)}
      style={[styles.card]}>
      <Image
        source={{
          uri: item?.varients?.[0]?.image?.[0] || '',
        }}
        style={styles.cardimg}
      />
      <View style={styles.cardContent}>
        <Text style={styles.proname} numberOfLines={2}>
          {i18n.language === 'vi' ? (item?.vietnamiesName || item?.name) : item?.name}
        </Text>
        {!saleVarient?.value && item?.price_slot?.[0]?.value && (
          <Text style={styles.weight}>
            {item.price_slot[0].value || ''}{' '}
            {item.price_slot[0].unit || ''}
          </Text>
        )}
        {saleVarient?.value && (
          <Text style={styles.weight}>
            {saleVarient.value || ''}{' '}
            {saleVarient.unit || ''}
          </Text>
        )}

        {currentSale && currentSale?.status !== 'expired' && (
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: Constants.saffron,
              }}>
              {currentSale?.status === 'active'
                ? 'Sale end in'
                : 'sale start soon'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: Constants.saffron,
                }}>
                {currentSale?.days || 0}d
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: Constants.saffron,
                }}>
                :
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: Constants.saffron,
                }}>
                {currentSale?.hours || 0}h
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: Constants.saffron,
                }}>
                :
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: Constants.saffron,
                }}>
                {currentSale?.minutes || 0}m
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: Constants.saffron,
                }}>
                :
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: Constants.saffron,
                }}>
                {currentSale?.seconds || 0}s
              </Text>
            </View>
          </View>
        )}

        <View style={styles.cardContent2}>
          <View
            style={{
              flexShrink: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}>
            {item?.price_slot?.[0]?.other_price && (
              <Text style={styles.maintxt}>
                {Currency}
                {item.price_slot[0].other_price || ''}
              </Text>
            )}
            {salePrice !== null && (
              <Text style={styles.maintxt}>
                {Currency}
                {saleVarient?.our_price || ''}
              </Text>
            )}
            {(salePrice !== null
              ? !!salePrice
              : !!item?.price_slot?.[0]?.our_price) && (
                <Text style={styles.disctxt}>
                  {Currency}
                  {salePrice !== null
                    ? salePrice || ''
                    : item?.price_slot?.[0]?.our_price || ''}
                </Text>
              )}
          </View>

          <View>
            {cartItem ? (
              <View
                style={[
                  styles.addcov,
                  { width: 90, height: 30, alignItems: 'center' },
                ]}>
                <TouchableOpacity
                  style={styles.minus}
                  onPress={() => {
                    const updatedCart = cartdetail
                      .map(_i =>
                        _i.productid === item._id
                          ? { ..._i, qty: _i.qty - 1 }
                          : _i,
                      )
                      .filter(_i => _i.qty > 0);

                    setcartdetail(updatedCart);
                    AsyncStorage.setItem(
                      'cartdata',
                      JSON.stringify(updatedCart),
                    );
                  }}>
                  <MinusIcon color={Constants.white} height={16} width={16} />
                </TouchableOpacity>

                <Text style={styles.qtyText}>{cartItem.qty}</Text>

                <TouchableOpacity
                  style={styles.plus3}
                  onPress={() => {
                    const updatedCart = cartdetail.map(_i =>
                      _i.productid === item._id ? { ..._i, qty: _i.qty + 1 } : _i,
                    );
                    setcartdetail(updatedCart);
                    AsyncStorage.setItem(
                      'cartdata',
                      JSON.stringify(updatedCart),
                    );
                  }}>
                  <Plus2Icon color={Constants.white} height={16} width={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                disabled={item.Quantity <= 0}
                style={styles.pluscov}
                onPress={() => {
                  const itemQuantity = Number(item?.Quantity ?? 0);

                  if (itemQuantity <= 0) {
                    Toast.show({
                      type: 'error',
                      text1: t('This item is currently out of stock.'),
                    });
                    return;
                  }
                  console.log(item);

                  if (salePrice !== null && salePrice !== undefined) {
                    cartdata({ ...item, salePrice });
                  } else {
                    cartdata(item);
                  }
                }}>
                {/* {item.Quantity > 0 && <View style={{ backgroundColor: Constants.green, padding: 5, borderRadius: 5 }}> */}
                {item.Quantity <= 0 && <Text style={{ color: Constants.white, fontWeight: '700', fontSize: 16, paddingHorizontal: 10 }}>Out of stock</Text>}
                {/* </View>} */}
                {item.Quantity > 0 && <PlusIcon height={20} width={20} color="#fff" />}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {/* {item.Quantity > 0 && <BlurView
        style={styles.absolute}
        blurType="light"
        blurAmount={0}
        reducedTransparencyFallbackColor="#ffffff80"
      />} */}
      {/* {item.Quantity <= 0 && <View style={{ position: 'absolute', backgroundColor: Constants.green, padding: 5, left: -10, top: 30, borderRadius: 10, transform: [{ rotate: "-45deg" }], }}>
        <Text style={{ color: Constants.white, fontWeight: '700', fontSize: 16 }}>Out of stock</Text>
      </View>} */}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Constants.white,
    shadowColor: Constants.black,
    position: 'relative',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    shadowRadius: 3.84,
  },
  cardimg: {
    height: '100%',
    width: 70,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
  },
  cardContent2: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginTop: 3,
  },
  proname: {
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Medium,
  },
  weight: {
    fontSize: 14,
    color: Constants.customgrey,
    fontFamily: FONTS.Regular,
    marginTop: 3,
  },
  offtxt: {
    fontSize: 12,
    color: Constants.white,
    fontFamily: FONTS.Black,
    marginLeft: 7,
  },
  disctxt: {
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Bold,
  },
  maintxt: {
    fontSize: 16,
    color: Constants.customgrey,
    fontFamily: FONTS.Medium,
    textDecorationLine: 'line-through',
  },
  pluscov: {
    minWidth: 30,
    minHeight: 30,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Constants.pink,
  },
  addcov: {
    flexDirection: 'row',
    height: 30,
    borderRadius: 7,
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },
  minus: {
    backgroundColor: Constants.pink,
    width: 30,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    backgroundColor: '#F3F3F3',
    width: 30,
    height: '100%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    // paddingTop: 5,
    textAlign: 'center',
    // textAlignVertical: 'center',
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Black,
    // justifyContent: 'center',
    // alignItems: 'center',
    // alignSelf: 'center'
  },
  plus3: {
    backgroundColor: Constants.pink,
    width: 30,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  cardimg2: {
    height: 50,
    width: 50,
    position: 'absolute',
    right: -14,
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    height: 30,
    width: 30,
    position: 'absolute',
  },
  categorycircle: {
    height: 70,
    width: 70,
    borderRadius: 10,
    backgroundColor: Constants.lightpink,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  categoryimg: {
    height: 55,
    width: 55,
    resizeMode: 'fill',
    borderRadius: 60,
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  }
});

export default ProductCard;
