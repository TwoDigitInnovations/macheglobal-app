/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import React, { useContext, useEffect, useState, useCallback } from 'react';
import DriverHeader from '../../Assets/Component/DriverHeader';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { navigate } from '../../../navigationRef';
import { useIsFocused } from '@react-navigation/native';
import { LoadContext, ToastContext } from '../../../App';
import { ApiFormData, Post } from '../../Assets/Helpers/Service';
import moment from 'moment';
import { StatusIcon, ThreedotIcon, ViewIcon } from '../../../Theme';
import { useTranslation } from 'react-i18next';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';
import TestMap from './TestMap';
import { Image as ImageCompressor } from 'react-native-compressor';
import MultiImageCapture from '../../Assets/Component/MultiImageCapture';
import Toast from 'react-native-toast-message';

// Component for empty list
const EmptyListComponent = () => (
  <View
    style={{
      alignItems: 'center',
      justifyContent: 'center',
      height: Dimensions.get('window').height - 200,
    }}>
    <Text
      style={{
        color: Constants.black,
        fontSize: 20,
        fontFamily: FONTS.Bold,
      }}>
      {useTranslation().t('No Order Available')}
    </Text>
  </View>
);

const Work = () => {
  const { t } = useTranslation();
  const IsFocused = useIsFocused();
  const [, setToast] = useContext(ToastContext);
  const [, setLoading] = useContext(LoadContext);
  const [productList, setProductList] = useState([]);
  const [currentTab, setCurrentTab] = useState('pending');
  const [acceptModal, setAcceptModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(null);
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  const [deliveryModal, setDeliveryModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    images: [],
  });

  // Helper function to retry API calls
  const retryApiCall = async (apiCall, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        console.log(`Attempt ${attempt} failed:`, error.message);

        if (attempt === maxRetries) {
          throw error; // Throw the error if this was the last attempt
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  const nearbyLocation = useCallback(() => {
    // CuurentLocation(res => {
    // const data2 = {
    //   location: [Number(res.coords.longitude), Number(res.coords.latitude)],
    // };
    const raw = {
      lat: 29.7074,
      lng: -95.5612,
    };
    setLoading(true);
    // Post('nearbyorderfordriver', data2, {}).then(
    Post('optimize-route', raw, {}).then(
      async response => {
        setLoading(false);
        console.log('$%#@^&**', response);
        setProductList(response?.route || []);
      },
      err => {
        setLoading(false);
        setProductList([]);
        console.log(err);
      },
    );
    // });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptedOrderForDriver = () => {
    setLoading(true);
    const raw = {
      lat: 29.7074,
      lng: -95.5612,
    };
    Post('optimize-route', raw).then(
      async res => {
        setLoading(false);
        console.log('$%#@^&**', res);
        setProductList(res?.route || []);
      },
      err => {
        setLoading(false);
        setProductList([]);
        console.log(err);
      },
    );
  };

  const markOrderAsDelivered = async orderId => {
    setLoading(true);
    const data = {
      orderId: orderId,
      proofOfDelivery: deliveryData.images,
    };
    Post('submitProofOfDelivery', data).then(
      async res => {
        setLoading(false);
        console.log('$%#@^&**', res);
        if (res?.status) {
          setToast(t('Order marked as delivered'));
          // nearbyLocation();
          acceptedOrderForDriver();
          setDeliveryModal(false);
          setDeliveryData({ images: [] });
          setSelectedOrderData(null);
        } else {
          if (res?.message) {
            setToast(res?.message);
          }
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  useEffect(() => {
    if (IsFocused) {
      setProductList([]);
      nearbyLocation();
      setCurrentTab('pending');
    }
  }, [IsFocused, nearbyLocation]);

  // eslint-disable-next-line no-unused-vars
  const acceptOrder = id => {
    setLoading(true);
    Post(`acceptorderdriver/${id}`, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res?.status) {
          nearbyLocation();
        } else {
          if (res?.message) {
            setToast(res?.message);
          }
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('My orders')} />
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          style={{
            flex: 1,
            borderBottomColor:
              currentTab === 'pending' ? Constants.saffron : 'lightgray',
            borderBottomWidth: currentTab === 'pending' ? 5 : 2,
            height: 50,
            backgroundColor:
              currentTab === 'pending' ? 'white' : Constants.lightgrey,
            justifyContent: 'center',
          }}
          onPress={() => {
            setProductList([]);
            setCurrentTab('pending');
            // nearbyLocation();
            acceptedOrderForDriver();
          }}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 20,
              fontWeight: '700',
              color: currentTab === 'pending' ? Constants.saffron : 'black',
            }}>
            {t('Pending')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            borderBottomColor:
              currentTab === 'ongoing' ? Constants.saffron : 'lightgray',
            borderBottomWidth: currentTab === 'ongoing' ? 5 : 2,
            height: 50,
            backgroundColor:
              currentTab === 'ongoing' ? 'white' : Constants.lightgrey,
            justifyContent: 'center',
          }}
          onPress={() => {
            setProductList([]);
            setCurrentTab('ongoing');
            acceptedOrderForDriver();
          }}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 20,
              fontWeight: '700',
              color: currentTab === 'ongoing' ? Constants.saffron : 'black',
            }}>
            {t('Route')}
          </Text>
        </TouchableOpacity>
      </View>
      {/* <View style={{marginBottom:200,}}> */}
      {currentTab === 'pending' && (
        <FlatList
          data={productList}
          style={{ marginBottom: 70 }}
          renderItem={({ item }) => (
            <View>
              <TouchableOpacity
                style={styles.box}
                onPress={() =>
                  navigate('Map', {
                    orderid: item._id,
                    type: item.status === 'Collected' ? 'client' : 'shop',
                  })
                }>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Image
                      source={
                        item?.user?.image
                          ? {
                            uri: `${item.user?.image}`,
                          }
                          : require('../../Assets/Images/profile.png')
                      }
                      style={styles.hi}
                    // onPress={()=>navigate('Account')}
                    />
                    <View>
                      <Text style={styles.name}>{item?.user?.username}</Text>
                      <Text style={styles.redeembtn}>
                        {/* {moment(item?.created_at).format('DD-MM-YYYY')} */}
                        {item?.orderId}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(item._id);
                      console.log(item.index);
                    }}
                    style={{ height: 30, width: 30, alignItems: 'flex-end' }}>
                    <ThreedotIcon />
                  </TouchableOpacity>
                </View>
                {/* <Text style={styles.timeslotxt}>{item?.timeslot}</Text> */}
                {item?.dateOfDelivery && (
                  <View style={styles.secendpart}>
                    <LabelWithColon
                      labelKey="Delivery Date"
                      textStyle={styles.secendboldtxt}
                    />
                    <Text style={styles.secendtxt2}>
                      {/* {item?.dateOfDelivery} */}
                      {moment(item?.dateOfDelivery).format('MM-DD-YYYY')}
                    </Text>
                  </View>
                )}
                {item?.createdAt && (
                  <View style={styles.secendpart}>
                    <LabelWithColon
                      labelKey="Order Date"
                      textStyle={styles.secendboldtxt}
                    />
                    <Text style={styles.secendtxt2}>
                      {/* {item?.dateOfDelivery} */}
                      {moment(item?.createdAt).format('MM-DD-YYYY')}
                    </Text>
                  </View>
                )}
                <View style={styles.secendpart}>
                  <LabelWithColon
                    labelKey="Location"
                    textStyle={styles.secendboldtxt}
                  />
                  <Text style={styles.secendtxt2}>
                    {item?.Local_address?.address?.address ||
                      item?.Local_address?.address}
                  </Text>
                </View>
                {item?.Local_address?.ApartmentNo && (
                  <View style={styles.secendpart}>
                    <LabelWithColon
                      labelKey="Apartment No"
                      textStyle={styles.secendboldtxt}
                    />
                    <Text style={styles.secendtxt2}>
                      {item?.Local_address?.ApartmentNo}
                    </Text>
                  </View>
                )}
                {item?.Local_address?.SecurityGateCode && (
                  <View style={styles.secendpart}>
                    <LabelWithColon
                      labelKey="Security Gate No"
                      textStyle={styles.secendboldtxt}
                    />
                    <Text style={styles.secendtxt2}>
                      {item?.Local_address?.SecurityGateCode}
                    </Text>
                  </View>
                )}
                {item?.Local_address?.phoneNumber && (
                  <View style={styles.secendpart}>
                    <LabelWithColon
                      labelKey="Phone Number"
                      textStyle={styles.secendboldtxt}
                    />
                    <Text style={styles.secendtxt2}>
                      {item?.Local_address?.phoneNumber}
                    </Text>
                  </View>
                )}
                <View style={styles.txtcol}>
                  <View style={{}}>
                    <View style={styles.secendpart}>
                      <LabelWithColon
                        labelKey="Qty"
                        textStyle={styles.secendboldtxt}
                      />
                      <Text style={styles.secendtxt}>
                        {item?.productDetail.length}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.amount}>
                    {Currency}
                    {item?.total}
                  </Text>
                </View>
                {item?.driver_id && (
                  <TouchableOpacity
                    style={styles.acceptButtonStyle}
                    onPress={() => {
                      setDeliveryModal(true);
                      setSelectedOrderData({
                        orderId: item._id,
                        driverId: item.driver_id,
                        userId: item.user_id,
                        orderDetails: item,
                      });
                    }}>
                    <Text style={styles.modalText}>{t('Mark Delivered')}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              {modalVisible === item._id && (
                <TouchableOpacity
                  style={styles.backdrop}
                  onPress={() => setModalVisible(null)}>
                  <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                      <TouchableOpacity
                        style={styles.popuplistcov}
                        onPress={() => {
                          navigate('DriverOrder', item._id);
                          setModalVisible(null);
                        }}>
                        <View style={styles.popuplistcov2}>
                          <ViewIcon />
                          <Text>{t('View Order Details')}</Text>
                        </View>
                      </TouchableOpacity>
                      {item?.status !== 'Collected' && (
                        <TouchableOpacity
                          style={styles.popuplistcov}
                          onPress={() => {
                            navigate('Map', {
                              orderid: item._id,
                              type: 'shop',
                            });
                            setModalVisible(null);
                          }}>
                          <View style={styles.popuplistcov2}>
                            <StatusIcon />
                            <Text>{t('Shop location')}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.popuplistcov}
                        onPress={() => {
                          navigate('Map', {
                            orderid: item._id,
                            type: 'client',
                          });
                          setModalVisible(null);
                        }}>
                        <View style={styles.popuplistcov2}>
                          <StatusIcon />
                          <Text>{t('Client location')}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={EmptyListComponent}
        />
      )}
      {currentTab === 'ongoing' && <TestMap data={productList} />}
      {/* </View> */}
      <Modal
        animationType="none"
        transparent={true}
        visible={acceptModal}
        onRequestClose={() => {
          setAcceptModal(!acceptModal);
        }}>
        <View style={styles.centeredView2}>
          <View style={styles.modalView2}>
            <Text style={styles.alrt}>{t('Alert !')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {'Are you sure you want to Accept this ride to delivery !'}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setAcceptModal(!acceptModal)}
                  style={styles.cancelButtonStyle}>
                  <Text
                    style={[
                      styles.modalText,
                      { color: Constants.custom_yellow },
                    ]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    // Note: This functionality needs to be properly implemented
                    // acceptOrder(selectedOrderId);
                    setAcceptModal(false);
                  }}>
                  <Text style={styles.modalText}>{t('Yes')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="none"
        transparent={true}
        visible={deliveryModal}
        onRequestClose={() => {
          setDeliveryModal(!deliveryModal);
        }}>
        <View style={styles.centeredView2}>
          <View style={styles.modalView3}>
            <Text style={styles.alrt}>{t('Order Confirmation')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 10,
              }}>
              <Text style={[styles.textStyle, { textAlign: 'center' }]}>
                {t('Please upload image as proof of delivery')}
              </Text>
              <MultiImageCapture
                maxImages={3}
                uploadedImageUrls={deliveryData.images}
                onImageRemoved={(imageUrl, index) => {
                  // Remove the image from deliveryData
                  setDeliveryData(prevData => ({
                    ...prevData,
                    images: prevData.images.filter(img => img !== imageUrl),
                  }));
                }}
                onImagesUpload={async images => {
                  if (!images || images.length === 0) {
                    return;
                  }

                  const maxImages = 3;

                  // Since camera returns one image at a time, we'll process it
                  const image = images[0]; // Take the first (and only) image from camera

                  // Check if adding this image would exceed the maximum allowed
                  if (deliveryData.images.length + 1 > maxImages) {
                    Toast.show({
                      type: 'error',
                      text1: 'Maximum {{count}} images allowed',
                    })
                    return;
                  }

                  try {
                    setLoading(true);

                    // Validate image data
                    if (!image || (!image.uri && typeof image !== 'string')) {
                      Toast.show({
                        type: 'error',
                        text1: 'Invalid image selected',
                      })
                      return;
                    }

                    // Handle both object with uri property and direct uri string
                    const imageUri = image.uri || image;
                    console.log('Original image URI:', imageUri);

                    // Additional validation for the image URI
                    if (!imageUri || !imageUri.startsWith('file://')) {
                      Toast.show({
                        type: 'error',
                        text1: t('Invalid image file path'),
                      })
                      return;
                    }

                    // Compress the image before uploading with error handling
                    let compressedImage;
                    try {
                      compressedImage = await ImageCompressor.compress(
                        imageUri,
                        {
                          compressionMethod: 'auto',
                          maxWidth: 800,
                          maxHeight: 800,
                          quality: 0.7,
                        },
                      );
                      console.log('Compressed image URI:', compressedImage);
                    } catch (compressionError) {
                      console.log(
                        'Compression failed, using original image:',
                        compressionError,
                      );
                      compressedImage = imageUri; // Use original image if compression fails
                    }

                    // Validate compressed image
                    if (!compressedImage) {
                      Toast.show({
                        type: 'error',
                        text1: t('Failed to process image'),
                      })
                      return;
                    }

                    const imageForUpload = {
                      uri: compressedImage,
                      type: image.type || 'image/jpeg',
                      fileName:
                        image.fileName || `camera_capture_${Date.now()}.jpg`,
                    };

                    console.log('Image for upload:', imageForUpload);

                    // Use retry mechanism for upload
                    const result = await retryApiCall(
                      () => ApiFormData(imageForUpload),
                      2,
                    );

                    if (
                      result &&
                      result.status &&
                      result.data &&
                      result.data.file
                    ) {
                      // Add the uploaded image URL to delivery data
                      setDeliveryData(prevData => ({
                        ...prevData,
                        images: [...prevData.images, result.data.file],
                      }));
                      Toast.show({
                        type: 'success',
                        text1: t('Image uploaded successfully'),
                      })
                      console.log(
                        'Image uploaded successfully:',
                        result.data.file,
                      );
                    } else {
                      console.log('Upload failed for image:', image);
                      console.log('Server response:', result);
                      Toast.show({
                        type: 'error',
                        text1: t('Failed to upload image'),
                      })
                    }
                  } catch (error) {
                    console.log('Error uploading image:', error);

                    // Provide more specific error messages
                    if (
                      error.message &&
                      error.message.includes('end of stream')
                    ) {
                      Toast.show({
                        type: 'error',
                        text1: t('Network error. Please check your connection and try again.'),
                      })
                    } else if (
                      error.message &&
                      error.message.includes('timeout')
                    ) {
                      Toast.show({
                        type: 'error',
                        text1: t('Upload timeout. Please try again.'),
                      })
                    } else {
                      Toast.show({
                        type: 'error',
                        text1: t('Error uploading image. Please try again.'),
                      })
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ width: Dimensions.get('window').width - 60 }}
              />
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setDeliveryModal(!deliveryModal);
                    setSelectedOrderData(null);
                    // Reset delivery data when modal is closed
                    // This ensures that the next time the modal is opened, it starts fresh
                    const initialDeliveryData = { images: [] };
                    setDeliveryData(initialDeliveryData);
                  }}
                  style={styles.cancelButtonStyle}>
                  <Text
                    style={[
                      styles.modalText,
                      { color: Constants.custom_yellow },
                    ]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    const requiredImages = 1;
                    if (
                      !deliveryData.images ||
                      deliveryData.images.length === 0
                    ) {
                      Toast.show({
                        type: 'error',
                        text1: t('Please upload at least one image before confirming delivery', { count: requiredImages }),
                      })

                      return;
                    }
                    markOrderAsDelivered(selectedOrderData?.orderId);
                  }}>
                  <Text style={styles.modalText}>{t('Yes')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Work;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.lightgrey,
  },
  box: {
    backgroundColor: Constants.white,
    marginVertical: 10,
    padding: 20,
  },
  hi: {
    marginRight: 10,
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  redeembtn: {
    color: Constants.saffron,
    fontSize: 14,
    fontFamily: FONTS.Medium,
    // backgroundColor: Constants.saffron,
    // paddingHorizontal: 10,
    borderRadius: 8,
  },
  name: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 15,
  },
  secendpart: {
    flexDirection: 'row',
    // flex: 1,
    // justifyContent: 'space-between',
    marginLeft: 10,
    marginVertical: 5,
  },
  secendboldtxt: {
    color: Constants.black,
    fontSize: 15,
    fontFamily: FONTS.Bold,
    alignSelf: 'center',
  },
  secendtxt: {
    color: Constants.black,
    fontSize: 15,
    textAlign: 'left',
  },
  secendtxt2: {
    color: Constants.black,
    fontSize: 15,
    textAlign: 'left',
    flex: 1,
  },
  txtcol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // flex: 1,
  },
  amount: {
    color: Constants.saffron,
    fontSize: 24,
    fontFamily: FONTS.Bold,
    alignSelf: 'flex-end',
  },
  cancelAndLogoutButtonWrapStyle2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 3,
  },
  cancelButtonStyle: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginRight: 10,
    borderColor: Constants.saffron,
    borderWidth: 1,
    borderRadius: 10,
  },
  logOutButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.saffron,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  //////Model////////

  textStyle: {
    color: Constants.black,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Medium,
    fontSize: 16,
    margin: 20,
    marginBottom: 10,
  },
  cancelAndLogoutButtonWrapStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 3,
  },
  alrt: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    // backgroundColor: 'red',
    width: '100%',
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: Constants.customgrey2,
    paddingBottom: 20,
  },
  modalText: {
    color: Constants.white,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 14,
  },
  acceptButtonStyle: {
    flex: 1,
    backgroundColor: Constants.saffron,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  ////model
  centeredView2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 22,
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView2: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalView3: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    width: Dimensions.get('window').width - 40,
    maxHeight: '80%',
    overflow: 'scroll',
  },
  ///////Pop up model////
  centeredView: {
    position: 'absolute',
    right: 20,
    top: 60,
    // flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    // margin: 20,
    backgroundColor: 'white',
    borderRadius: 5,
    // paddingVertical: 20,
    // alignItems: 'center',
    boxShadow: '0 0 8 0.05 grey',
    // paddingHorizontal:10
  },
  popuplistcov: {
    // marginVertical:10,
    borderBottomWidth: 1,
    borderColor: Constants.customgrey,
  },
  popuplistcov2: {
    flexDirection: 'row',
    gap: 10,
    margin: 10,
    // borderBottomWidth:1,
    // borderColor:Constants.customgrey
  },
  backdrop: {
    // flex:1,
    // backgroundColor:Constants.red,
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  timeslotxt: {
    color: Constants.saffron,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    borderWidth: 1,
    borderColor: Constants.saffron,
    borderRadius: 5,
    width: '50%',
    textAlign: 'center',
    marginVertical: 5,
    // alignSelf:'center'
  },
});
