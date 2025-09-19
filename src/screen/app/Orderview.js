/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { createRef, useContext, useEffect, useState } from 'react';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { useIsFocused } from '@react-navigation/native';
import { LoadContext, ToastContext } from '../../../App';
import { ApiFormData, GetApi, Patch, Post } from '../../Assets/Helpers/Service';
import moment from 'moment';
import { Cross2Icon, CrossIcon, PriceTagIcon, UploadIcon } from '../../../Theme';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import { goBack, navigate } from '../../../navigationRef';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import Barcode from '../../Assets/Component/Barcode';
import i18n from 'i18next';
// import StarRating from 'react-native-star-rating-widget';

const Orderview = props => {
  const { t } = useTranslation();
  const dumydata = [1, 2, 3];
  const id = props?.route?.params.id;
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [rtnreason, setrtnreason] = useState('');
  const [orderid, setorderid] = useState('');
  const [productid, setproductid] = useState('');
  const [orderview, setorderview] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadimg, setuploadimg] = useState([]);

  const cameraRef = createRef();
  const IsFocused = useIsFocused();
  useEffect(() => {
    if (IsFocused) {
      getorderdetail();
    }
  }, [IsFocused]);

  const getorderdetail = () => {
    setLoading(true);
    GetApi(`getProductRequest/${id}`, {}).then(
      async res => {
        setLoading(false);
        console.log('xyz', res);
        setorderview(res.data);
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const submit = () => {
    if (rtnreason === '') {
      setToast('Please enter a reason for the return');
      return;
    }

    if (uploadimg?.length < 2) {
      setToast('Please upload atleast two images');
      return;
    }
    let data = {
      product_id: productid,
      reason: rtnreason,
      refundProof: uploadimg,
    };
    console.log(data);
    setLoading(true);
    Patch(`refundProduct/${orderview?._id}`, data).then(async res => {
      setLoading(false);
      console.log(res);
      if (res.status) {
        setToast(res?.data?.message);
        goBack();
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DriverHeader item={t('Order Detail')} showback={true} />
        {/* <View style={styles.toppart}>
          <Image
            source={require('../../Assets/Images/logosmall.png')}
            style={styles.logoimg}
          />
          <Text style={styles.ordertxt}>Order View</Text>
          <Image
            source={require('../../Assets/Images/profile3.png')}
            style={styles.logoimg}
          />
        </View> */}
        {orderview && (
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: 20,
              justifyContent: 'space-between',
              marginTop: 10,
            }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.txt1}>{t('Order ID')}</Text>
                <Text style={styles.txt1}>
                  :- {orderview?.orderId || orderview?._id}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.txt1}>{t('Date')}</Text>
                <Text style={styles.txt1}>
                  :- {moment(orderview?.created_at).format('DD MMM, hh:mm A')}
                </Text>
              </View>
            </View>
            <Text style={styles.delevered}>{orderview?.status}</Text>
          </View>
        )}
        {/* <View style={styles.optcov}>
          <Text style={[styles.opttxt,{borderBottomColor:Constants.black,paddingBottom:5,borderBottomWidth:selectrate==='ORDER'?1:0}]} onPress={()=>setselectrate('ORDER')}>Rate Order</Text>
          <Text style={[styles.opttxt,{borderBottomColor:Constants.black,paddingBottom:5,borderBottomWidth:selectrate==='DRIVER'?1:0}]} onPress={()=>setselectrate('DRIVER')}>Rate Driver</Text>
          
        </View> */}
        {/* {orderview?.driver_id&&<View style={[styles.box, styles.shadowProp, {flexDirection: 'row'}]}>
          <Image
            source={require('../../Assets/Images/rider.png')}
            style={{
              height: 50,
              width: 50,
              marginHorizontal: 10,
              alignSelf: 'center',
            }}
          />
          <View style={{flex: 1, marginLeft: 10}}>
            <Text style={styles.opttxt}>Rate delivery experience</Text>
            <View style={{marginVertical: 10}}>
              <StarRating
                rating={orderview?.driver_rating || '0'}
                enableHalfStar={false}
                color={Constants.custom_green}
                onChange={() => {}}
                onRatingEnd={e => ratedriver(orderview.id,orderview?.driver_id, e)}
              />
            </View>
          </View>
        </View>} */}
        {orderview?.productDetail && orderview?.productDetail.length > 0 ? (
          orderview?.productDetail.map((item, i) => {
            return (
              <View style={[styles.box2]} key={i}>
                <View style={{ flexDirection: 'row' }}>
                  <Image
                    // source={require('../../Assets/Images/meal.png')}
                    source={
                      item?.image
                        ? {
                          uri: `${item.image}`,
                        }
                        : require('../../Assets/Images/veg.png')
                    }
                    style={styles.cartimg}
                  />
                  <View style={{ flex: 1, marginLeft: 10, gap: 5 }}>
                    <Text style={styles.boxtxt}>{i18n.language === 'vi' ? (item?.product?.vietnamiesName || item?.product?.name) : item?.product?.name}</Text>
                    {/* <Text style={styles.qty}>
                      {item?.price_slot?.value} {item?.price_slot?.unit}
                    </Text> */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        // marginTop: 10,
                      }}>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.boxtxt2}>{t('Qty')}</Text>
                        <Text style={styles.boxtxt2}>
                          {''} :- {item?.qty}
                        </Text>
                      </View>
                      <Text style={styles.boxtxt3}>
                        {Currency} {(Number(item?.price) || 0).toFixed(2)}{' '}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignSelf: 'flex-end', marginVertical: 10 }}>
                  {/* <StarRating
                    rating={item.rating}
                    enableHalfStar={false}
                    color={Constants.custom_green}
                    onChange={() => {}}
                    onRatingEnd={e => rating(item.id, e)}
                  /> */}
                  {!item?.returnDetails?.isRefunded &&
                    !item?.returnDetails?.isReturned &&
                    Date.now() - new Date(orderview?.deliveredAt).getTime() <=
                    15 * 60 * 1000 && (
                      <Text
                        style={styles.rtnbtn}
                        onPress={() => {
                          setModalVisible(true),
                            setproductid(item?.product?._id);
                        }}>
                        Return
                      </Text>
                    )}
                </View>
              </View>
            );
          })
        ) : (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              height: Dimensions.get('window').height - 200,
            }}>
            <Text style={styles.carttxt}>{t('Loading...')}</Text>
          </View>
        )}
        {orderview?.productDetail && orderview?.productDetail.length > 0 && (
          <View>
            <View
              style={{
                marginHorizontal: 20,
                justifyContent: 'space-between',
                flexDirection: 'row',
                marginTop: 30,
              }}>
              <Text style={styles.boxtxt}>{t('Total Amount')}</Text>
              <Text style={styles.boxtxt}>
                {Currency}{' '}
                {(
                  Number(orderview?.total || 0) -
                  Number(orderview?.totalTax || 0) -
                  Number(orderview?.deliveryfee || 0) -
                  Number(orderview?.Deliverytip || 0) +
                  Number(orderview?.discount || 0)
                ).toFixed(2)}
              </Text>
            </View>

            {orderview?.isLocalDelivery && (
              <View
                style={{
                  marginHorizontal: 20,
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  marginTop: 10,
                }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={styles.boxtxt}>{t('Delivery Tip')}</Text>
                </View>
                <Text style={styles.boxtxt}>
                  {Currency} {(Number(orderview?.Deliverytip) || 0).toFixed(2)}
                </Text>
              </View>
            )}

            {(orderview?.isOrderPickup || orderview?.isDriveUp) ? null : (
              <View
                style={{
                  marginHorizontal: 20,
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  marginTop: 10,
                }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={styles.boxtxt}>{t('Delivery Fees')}</Text>
                </View>
                <Text style={styles.boxtxt}>
                  {Currency} {(Number(orderview?.deliveryfee) || 0).toFixed(2)}
                </Text>
              </View>
            )}

            <View
              style={{
                marginHorizontal: 20,
                justifyContent: 'space-between',
                flexDirection: 'row',
                marginTop: 10,
              }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.boxtxt}>{t("Tax")}</Text>
              </View>
              <Text style={styles.boxtxt}>
                {Currency} {(Number(orderview?.totalTax) || 0).toFixed(2)}
              </Text>
            </View>

            <View
              style={{
                marginHorizontal: 20,
                justifyContent: 'space-between',
                flexDirection: 'row',
                marginTop: 10,
              }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.boxtxt}>{t("Discount")}</Text>
              </View>
              <Text style={styles.boxtxt}>
                -{Currency} {(Number(orderview?.discount) || 0).toFixed(2)}
              </Text>
            </View>

            <View style={[styles.box, styles.shadowProp]}>
              <View
                style={{
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  flex: 1,
                }}>
                <Text style={styles.boxtxt}>{t('Final Amount')}</Text>
                <Text style={styles.boxtxt}>
                  {Currency}
                  {Number(orderview?.total)}
                </Text>
              </View>
            </View>
            <View style={[styles.centeredView, { backgroundColor: Constants.white }]}>
              <Barcode value={orderview?.orderId} />
            </View>
            {orderview?.onthewaytodelivery && (
              <TouchableOpacity
                style={styles.btn}
                onPress={() =>
                  navigate('TrackDriver', {
                    driverid: orderview?.driver_id?._id,
                    userlocation: orderview?.location,
                  })
                }>
                <Text style={styles.tracktxt}>Track Driver</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView]}>
            <View
              style={{
                backgroundColor: Constants.white,
                alignItems: 'center',
                width: '100%',
              }}>
              <CrossIcon
                style={{
                  alignSelf: 'flex-end',
                  position: 'absolute',
                  top: -12,
                  right: -10,
                }}
                height={18}
                width={18}
                onPress={() => {
                  setModalVisible(!modalVisible);
                  setuploadimg([]);
                }}
                color={Constants.black}
              />
              <Text style={[styles.textStyle, { color: Constants.black }]}>
                Return Product
              </Text>
              <TextInput
                style={[styles.input]}
                placeholder="Reason for return"
                placeholderTextColor={Constants.customgrey2}
                onChangeText={e => setrtnreason(e)}
                value={rtnreason}
              />
              <UploadIcon
                color={Constants.saffron}
                height={80}
                width={80}
                style={{ alignSelf: 'center' }}
                onPress={() => cameraRef.current.show()}
              />
              <CameraGalleryPeacker
                refs={cameraRef}
                getImageValue={async img => {
                  setLoading(true);
                  ApiFormData(img.assets[0]).then(
                    res => {
                      console.log(res);
                      setLoading(false);
                      if (res.status) {
                        setuploadimg(prev => [...prev, res.data.file]);
                      }
                    },
                    err => {
                      console.log(err);
                    },
                  );
                }}
                base64={false}
                cancel={() => { }}
              />
              <Text style={styles.imgtxt}>Upload atleast two images</Text>
              <ScrollView
                style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}
                horizontal={true}
                showsHorizontalScrollIndicator={false}>
                {uploadimg.map((item, i) => {
                  return (
                    <View key={i}>
                      <Cross2Icon
                        color={Constants.red}
                        height={15}
                        width={15}
                        style={{ position: 'absolute', zIndex: 10, right: 0 }}
                        onPress={() =>
                          setuploadimg(prev => prev.filter(it => it !== item))
                        }
                      />
                      <Image
                        source={{ uri: item }}
                        style={styles.imgcov}
                        resizeMode="contain"
                      />
                    </View>
                  );
                })}
              </ScrollView>

              {/* <TouchableOpacity
                activeOpacity={0.9}
                style={styles.addcov}
                onPress={() => setuploadimg([...uploadimg, {imgname: ''}])}>
                <Text style={styles.addcovtxt}>Add more</Text>
              </TouchableOpacity> */}

              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                {/* <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible(!modalVisible)}
                  style={styles.cancelButtonStyle}>
                  <Text style={styles.modalText}>Cancel</Text>
                </TouchableOpacity> */}

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => submit()}>
                  <Text style={styles.modalText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Orderview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.white,
    // padding: 20,
  },
  logoimg: {
    height: 40,
    width: 40,
  },
  toppart: {
    padding: 20,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  ordertxt: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    alignSelf: 'center',
  },
  box2: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: Constants.white,
    width: '90%',
    alignSelf: 'center',
    borderBottomWidth: 1,
    // borderColor:Constants.saffron
  },
  box: {
    paddingHorizontal: 10,
    paddingVertical: 13,
    // borderRadius: 20,
    marginVertical: 20,
    backgroundColor: Constants.white,
    width: '90%',
    alignSelf: 'center',
    // flexDirection: 'row',
    // height:300,
    // backgroundColor:Constants.red
  },
  shadowProp: {
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderRadius: 7,
    marginVertical: 20,
    backgroundColor: Constants.saffron,
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tracktxt: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: Constants.white,
  },
  boxtxt: {
    color: Constants.black,
    fontSize: 16,
    // fontWeight: '500',
    fontFamily: FONTS.Medium,
  },
  boxtxt3: {
    color: Constants.black,
    fontSize: 16,
    // fontWeight: '500',
    fontFamily: FONTS.Bold,
  },
  boxtxt2: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  cartimg: {
    height: 60,
    width: 60,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  txt1: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    // flex: 1,
    // marginVertical: 5,
  },
  delevered: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Regular,
    backgroundColor: Constants.pink,
    padding: 5,
    borderRadius: 3,
    marginVertical: 5,
    textAlign: 'center',
  },
  carttxt: {
    color: Constants.black,
    fontSize: 18,
    // fontWeight: '500',
    marginTop: 10,
    fontFamily: FONTS.Bold,
  },
  optcov: {
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  opttxt: {
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Bold,
    marginLeft: 10,
  },
  qty: {
    fontSize: 14,
    color: Constants.customgrey,
    fontFamily: FONTS.Bold,
    // marginBottom: 5,
  },
  rtnbtn: {
    backgroundColor: Constants.saffron,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 7,
    color: Constants.white,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 22,
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
    width: '85%',
  },

  textStyle: {
    color: Constants.black,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 16,
    marginTop: 10,
  },
  imgtxt: {
    color: Constants.customgrey,
    textAlign: 'center',
    fontFamily: FONTS.Regular,
    fontSize: 14,
  },
  modalText: {
    color: Constants.white,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 14,
  },
  cancelAndLogoutButtonWrapStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 5,
  },
  cancelButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.black,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginRight: 15,
  },
  logOutButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.saffron,
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
  },
  textInput: {
    flexDirection: 'row',
  },
  imgcov: {
    height: 50,
    width: 50,
    marginHorizontal: 5,
  },
  input: {
    paddingLeft: 10,
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: Constants.black,
    height: 60,
    width: '100%',
    backgroundColor: Constants.customgrey4,
    borderRadius: 15,
    // borderWidth:1,
    // borderColor:Constants.saffron
  },
  mylivejobtitle: {
    position: 'absolute',
    backgroundColor: Constants.white,
    paddingHorizontal: 5,
    top: -13,
    left: 30,
  },
  jobtitle: {
    color: Constants.black,
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
    textAlign: 'center',
    fontWeight: '500',
  },
  addcov: {
    // height:40,
    backgroundColor: Constants.green,
    alignSelf: 'flex-end',
    marginTop: 15,
    borderRadius: 5,
  },
  addcovtxt: {
    color: Constants.white,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
