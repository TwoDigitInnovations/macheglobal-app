/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import {
  FlatList,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import React, { createRef, useContext, useEffect, useState } from 'react';
import { Currency, FONTS, Constants } from '../../Assets/Helpers/constant';
import { useIsFocused } from '@react-navigation/native';
import { LoadContext, ToastContext } from '../../../App';
import { GetApi, Patch } from '../../Assets/Helpers/Service';
import moment from 'moment';
import { CrossIcon, UploadIcon } from '../../../Theme';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import { goBack } from '../../../navigationRef';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';

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
    GetApi(`orders/details/${id}`, {}).then(
      async res => {
        setLoading(false);
        console.log('Order details:', res);
        if (res.success && res.data) {
          setorderview(res.data);
        } else {
          console.error('Failed to fetch order details');
          setToast('Failed to load order details');
        }
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

  const handleGetInvoice = async () => {
    console.log('=== Invoice Download Started ===');
    console.log('Order view:', orderview);
    
    if (!orderview?._id) {
      console.log('ERROR: Order ID not found');
      setToast('Order ID not found');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get auth token
      const userDetail = await AsyncStorage.getItem('userDetail');
      console.log('User detail retrieved:', userDetail ? 'Yes' : 'No');
      
      if (!userDetail) {
        setToast('Please login to download invoice');
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userDetail);
      const token = user.token;
      console.log('Token:', token ? 'Found' : 'Not found');
      
      // Create invoice download URL
      const invoiceUrl = `${Constants.baseUrl}invoice/${orderview._id}`;
      const fileName = `invoice-${orderview.orderId || orderview._id}.pdf`;
      
      console.log('Invoice URL:', invoiceUrl);
      console.log('File name:', fileName);
      console.log('Platform:', Platform.OS);
      
      // For Android 13+, no storage permission needed with Download Manager
      console.log('Skipping permission check - using Download Manager');
      
      // Download directory
      const { dirs } = ReactNativeBlobUtil.fs;
      const downloadDir = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.DownloadDir;
      const filePath = `${downloadDir}/${fileName}`;
      
      console.log('Download directory:', downloadDir);
      console.log('File path:', filePath);
      console.log('Starting download...');
      
      // Download the PDF - Simple approach without Download Manager
      console.log('Fetching PDF...');
      
      ReactNativeBlobUtil.config({
        fileCache: true,
        appendExt: 'pdf',
      })
      .fetch('GET', invoiceUrl, {
        Authorization: `Bearer ${token}`,
      })
      .then(async (res) => {
        console.log('Download success!');
        console.log('Temp file path:', res.path());
        
        // Ensure Downloads folder exists
        const folderExists = await ReactNativeBlobUtil.fs.isDir(downloadDir);
        console.log('Download folder exists:', folderExists);
        
        if (!folderExists) {
          console.log('Creating download folder...');
          await ReactNativeBlobUtil.fs.mkdir(downloadDir);
        }
        
        // Move to Downloads folder
        const destPath = `${downloadDir}/${fileName}`;
        console.log('Moving to:', destPath);
        
        try {
          await ReactNativeBlobUtil.fs.mv(res.path(), destPath);
          console.log('File moved successfully');
        } catch (mvError) {
          console.log('Move failed, trying copy instead...');
          await ReactNativeBlobUtil.fs.cp(res.path(), destPath);
          await ReactNativeBlobUtil.fs.unlink(res.path());
          console.log('File copied successfully');
        }
        
        // Scan file for media scanner (Android)
        if (Platform.OS === 'android') {
          await ReactNativeBlobUtil.fs.scanFile([{ path: destPath, mime: 'application/pdf' }]);
          console.log('File scanned');
        }
        
        setLoading(false);
        Alert.alert(
          'Success',
          `Invoice saved to Downloads!\n${fileName}`,
          [
            {
              text: 'Open',
              onPress: () => {
                console.log('Opening PDF...');
                if (Platform.OS === 'ios') {
                  ReactNativeBlobUtil.ios.openDocument(destPath);
                } else {
                  ReactNativeBlobUtil.android.actionViewIntent(destPath, 'application/pdf');
                }
              }
            },
            { text: 'OK' }
          ]
        );
      })
      .catch((error) => {
        console.error('=== Download Error ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        setLoading(false);
        setToast(`Failed to download: ${error.message || 'Unknown error'}`);
      });
      
    } catch (error) {
      console.error('=== Invoice Download Exception ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      setToast(`Error: ${error.message || 'Failed to download invoice'}`);
      setLoading(false);
    }
  };

  const renderOrderItem = ({ item, index }) => (
    <View key={index} style={styles.productContainer}>
      <Image
        source={item.image ? { uri: item.image } : require('../../Assets/Images/veg.png')}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productDetails}>
        <Text style={styles.productName}>
          {i18n.language === 'fr' ? (item.product?.frenchName || item.name) : item.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>
            {Currency} {Number(item.price).toFixed(2)}
          </Text>
          <Text style={styles.quantityText}>Qty: {item.qty}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('Order Details')} showback={true} />
      
      {orderview ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 20 }}>
          
          <View style={styles.card}>
           <View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>{t('Order Summary')}</Text>
  <View style={[styles.statusBadge, { 
    backgroundColor: orderview.status === 'Completed' ? '#10B981' : 
      orderview.status === 'Pending' ? '#F59E0B' : 
      orderview.status === 'Cancelled' ? '#EF4444' : '#F59E0B' 
  }]}>
    <Text style={styles.statusText}>
      {orderview.status || 'Processing'}
    </Text>
  </View>
</View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Order ID')}:</Text>
              <Text style={styles.infoValue}>#{orderview.orderId || orderview._id?.substring(0, 8)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Order Date')}:</Text>
              <Text style={styles.infoValue}>
                {moment(orderview.createdAt).format('MMM D, YYYY h:mm A')}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Payment Method')}:</Text>
              <Text style={styles.infoValue}>
                {orderview.paymentMethod === 'card' ? 'Credit/Debit Card' : 
                 orderview.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                 orderview.paymentMethod || 'N/A'}
              </Text>
            </View>
            
            <View style={[styles.divider, { marginVertical: 12 }]} />
            
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>{t('Delivery Address')}</Text>
            {orderview.shippingAddress && (
              <View style={styles.addressContainer}>
                <Text style={styles.addressName}>{orderview.shippingAddress.name}</Text>
                <Text style={styles.addressText}>{orderview.shippingAddress.address}</Text>
                <Text style={styles.addressText}>
                  {orderview.shippingAddress.city}, {orderview.shippingAddress.country} {orderview.shippingAddress.postalCode}
                </Text>
                <Text style={styles.addressText}>Phone: {orderview.shippingAddress.phone}</Text>
              </View>
            )}
          </View>
          
          {/* Order Items */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>{t('Order Items')}</Text>
            <FlatList
              data={orderview.orderItems}
              renderItem={renderOrderItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
            
            <View style={[styles.divider, { marginVertical: 12 }]} />
            
            {/* Order Total */}
            <View style={styles.totalContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('Subtotal')}:</Text>
                <Text style={styles.totalValue}>
                  {Currency} {Number(orderview.itemsPrice || 0).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('Shipping')}:</Text>
                <Text style={styles.totalValue}>
                  {Currency} {Number(orderview.shippingPrice || 0).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('Tax')}:</Text>
                <Text style={styles.totalValue}>
                  {Currency} {Number(orderview.taxPrice || 0).toFixed(2)}
                </Text>
              </View>
              
              {/* Delivery Tip */}
              {orderview.Deliverytip > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('Delivery Tip')}:</Text>
                  <Text style={styles.totalValue}>
                    {Currency} {Number(orderview.Deliverytip || 0).toFixed(2)}
                  </Text>
                </View>
              )}
              
              {/* Delivery Fees (if applicable) */}
              {!orderview.isOrderPickup && !orderview.isDriveUp && orderview.deliveryfee > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('Delivery Fee')}:</Text>
                  <Text style={styles.totalValue}>
                    {Currency} {Number(orderview.deliveryfee || 0).toFixed(2)}
                  </Text>
                </View>
              )}
              
              {/* Discount (if applicable) */}
              {orderview.discount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('Discount')}:</Text>
                  <Text style={[styles.totalValue, { color: '#10B981' }]}>
                    -{Currency} {Number(orderview.discount || 0).toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View style={[styles.divider, { marginVertical: 8 }]} />
              
              <View style={[styles.totalRow, { marginTop: 4 }]}>
                <Text style={styles.grandTotalLabel}>{t('Total')}:</Text>
                <Text style={styles.grandTotalValue}>
                  {Currency} {Number(orderview.totalPrice || 0).toFixed(2)}
                </Text>
              </View>
            </View>
            
            {/* Barcode Section Removed */}
            
            {/* Track Driver Button */}
            {orderview.onthewaytodelivery && (
              <TouchableOpacity
                style={styles.trackButton}
                onPress={() =>
                  navigate('TrackDriver', {
                    driverid: orderview?.driver_id?._id,
                    userlocation: orderview?.location,
                  })
                }>
                <Text style={styles.trackButtonText}>{t('Track Driver')}</Text>
              </TouchableOpacity>
            )}
            
            {/* Get Invoice Button */}
            <TouchableOpacity
              style={styles.invoiceButton}
              onPress={handleGetInvoice}>
              <Text style={styles.invoiceButtonText}>{t('Get Invoice')}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Return/Refund Section */}
          {orderview.status === 'Delivered' && (
            <View style={[styles.card, { marginTop: 12, marginBottom: 20 }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>{t('Need Help?')}</Text>
              <TouchableOpacity 
                style={styles.helpButton}
                onPress={() => {
                  setModalVisible(true);
                  setproductid(orderview.orderItems[0]?.product?._id);
                }}
              >
                <Text style={styles.helpButtonText}>{t('Request Return/Refund')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>{t('Loading order details...')}</Text>
        </View>
      )}
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
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.Regular,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: FONTS.Medium,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  addressContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  addressName: {
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
    color: '#111827',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: FONTS.Regular,
    marginBottom: 2,
    lineHeight: 18,
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: '#111827',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
    color: '#111827',
  },
  quantityText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONTS.Regular,
  },
  totalContainer: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.Regular,
  },
  totalValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: FONTS.Medium,
  },
  grandTotalLabel: {
    fontSize: 16,
    color: '#111827',
    fontFamily: FONTS.SemiBold,
  },
  grandTotalValue: {
    fontSize: 16,
    color: '#111827',
    fontFamily: FONTS.Bold,
  },
  helpButton: {
    backgroundColor: '#FF7000',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  invoiceButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  invoiceButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  trackButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
