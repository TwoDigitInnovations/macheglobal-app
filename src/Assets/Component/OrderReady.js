/* eslint-disable react-native/no-inline-styles */
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetApi, Post } from '../Helpers/Service';
import Constants, { FONTS } from '../Helpers/constant';
import { useTranslation } from 'react-i18next';
import { Toast } from 'toastify-react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { LoadContext } from '../../../App';

const OrderReady = ({ row, props, getProducts }) => {
  const { t } = useTranslation();
  const order = row;
  const shouldShowButton =
    order.isDriveUp === true || order.isOrderPickup === true;
  const isCompleted = order.status === 'Completed';
  const isCancelOrder = order.status === 'Cancel';
  const localStorageKey = `inProcess-${order._id}`;
  const [inProcess, setInProcess] = useState(false);
  const [open1, setopen1] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [fortrackingOrderId, setFortrackingOrderId] = useState(null);
  const [modalText, setModalText] = useState({
    trackingNo: '',
    companyName: '',
    driverId: '',
  });
  const [driverList, setDriverList] = useState([]);
  const [loading, setLoading] = useContext(LoadContext);

  useEffect(() => {
    const loadInProcess = async () => {
      const stored = await AsyncStorage.getItem(localStorageKey);
      if (stored === 'true') {
        setInProcess(true);
      }
    };
    loadInProcess();
  }, [localStorageKey]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await GetApi('getDriverList', {});
        if (response.status) {
          setDriverList(response.data.drivers);
          console.log('Driver List:', response.data);
        } else {
          Toast.error(response.message || 'Failed to fetch drivers');
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
        Toast.error(error?.message || 'Something went wrong');
      }
    };
    if (isOpen) {
      fetchDrivers();
    }
  }, [isOpen]);

  const handleInProcessClick = async () => {
    setLoading(true);
    Post('markOrderAsPreparing', { orderId: order._id })
      .then(res => {
        if (res.status) {
          Toast.success(res.message || 'Order is preparing');
          console.log(res);
          getProducts();
        } else {
          Toast.error(res.message || 'Failed to prepare order');
        }
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        Toast.error(err?.message || 'Something went wrong');
        setLoading(false);
      });
  };

  const ReturnOrder = id => {
    setLoading(true);
    Post('ReturnConform', { orderId: id })
      .then(res => {
        setLoading(false);
        if (res.status) {
          Toast.success(res.message || 'Return confirmed successfully');
          getProducts();
        } else {
          Toast.error(res.message || 'Failed to confirm return');
        }
      })
      .catch(err => {
        setLoading(false);
        console.log(err);
        Toast.error(err?.message || 'Something went wrong');
      });
  };

  const orderready = id => {
    setLoading(true);
    Post('orderreadyNotification', { id: id })
      .then(res => {
        setLoading(false);
        Toast.success(res.message || 'Order is ready');
        getProducts();
      })
      .catch(err => {
        setLoading(false);
        console.log(err);
        Toast.error(err?.message || 'Something went wrong');
      });
  };

  const updateTrackingInfo = (id, data) => {
    setLoading(true);
    const raw = {
      id,
      trackingNo: data.trackingNo,
      trackingLink: data.companyName,
      driverId: data.driverId,
    };
    console.log('Update Tracking Info:', raw);
    Post('updateTrackingInfo', raw)
      .then(res => {
        setLoading(false);
        if (res.status) {
          Toast.success(res.message || 'Tracking info updated successfully');
          setIsOpen(false);
          setModalText({
            trackingNo: '',
            companyName: '',
            driverId: '',
          });
          setFortrackingOrderId(null);
          getProducts();
        } else {
          Toast.error(res.message || 'Failed to update tracking info');
          console.log('Error:', res);
        }
      })
      .catch(err => {
        setLoading(false);
        console.log(err);
        Toast.error(err?.message || 'Something went wrong');
      });
  };

  return (
    <View>
      <View style={styles.container}>
        {isCancelOrder ? (
          <View style={styles.buttonDisabled}>
            <Text style={styles.buttonTextDisabled}>Order Cancelled</Text>
          </View>
        ) : (
          <>
            {shouldShowButton && (
              <>
                {isCompleted ? (
                  <View style={styles.buttonCompleted}>
                    <Text style={styles.buttonText}>Order Delivered</Text>
                  </View>
                ) : (
                  <>
                    {order?.status !== 'Preparing' ? (
                      <TouchableOpacity
                        style={styles.buttonPrimary}
                        onPress={() => {
                          setopen1(true);
                        }}>
                        <Text style={styles.buttonText}>In-Process</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.buttonGrey}
                        onPress={() => {
                          orderready(order._id);
                        }}>
                        <Text style={styles.buttonTextBlack}>Order Ready</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            )}

            {order.isShipmentDelivery && (
              <>
                {order.status === 'Return Requested' && (
                  <TouchableOpacity
                    style={styles.buttonGrey}
                    onPress={() => {
                      ReturnOrder(order._id);
                    }}>
                    <Text style={styles.buttonTextBlack}>Return Confirm</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'Return' && (
                  <View style={styles.buttonCompleted}>
                    <Text style={styles.buttonText}>Return Successfully</Text>
                  </View>
                )}

                {order.status !== 'Return Requested' &&
                  order.status !== 'Return' &&
                  (order.status === 'Completed' ? (
                    <View style={styles.buttonCompleted}>
                      <Text style={styles.buttonText}>Order Delivered</Text>
                    </View>
                  ) : order.trackingNo && order.trackingLink ? (
                    <View style={styles.buttonPrimary}>
                      <Text style={styles.buttonText}>Order Shipped</Text>
                    </View>
                  ) : !(
                    (order.isShipmentDelivery || order?.isLocalDelivery) &&
                    order.status === 'Shipped'
                  ) ? (
                    <TouchableOpacity
                      style={[
                        styles.buttonGrey,
                        { backgroundColor: Constants.pink },
                      ]}
                      onPress={() => {
                        setIsOpen(true);
                        setFortrackingOrderId(order._id);
                      }}>
                      <Text style={styles.buttonTextBlack}>
                        {t('Add Tracking Info')}
                      </Text>
                    </TouchableOpacity>
                  ) : null)}
              </>
            )}

            {order.isLocalDelivery && (
              <>
                {order.status === 'Return Requested' && (
                  <TouchableOpacity
                    style={styles.buttonGrey}
                    onPress={() => ReturnOrder(order._id)}>
                    <Text style={styles.buttonTextBlack}>Return Confirm</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'Return' && (
                  <View style={styles.buttonCompleted}>
                    <Text style={styles.buttonText}>Return Successfully</Text>
                  </View>
                )}

                {order.status !== 'Return Requested' &&
                  order.status !== 'Return' &&
                  (order.status === 'Completed' ? (
                    <View style={styles.buttonCompleted}>
                      <Text style={styles.buttonText}>Order Delivered</Text>
                    </View>
                  ) : order.trackingNo && order.trackingLink ? (
                    <View style={styles.buttonPrimary}>
                      <Text style={styles.buttonText}>Order Shipped</Text>
                    </View>
                  ) : !(
                    (order.isShipmentDelivery || order?.isLocalDelivery) &&
                    order.status === 'Shipped'
                  ) ? (
                    <TouchableOpacity
                      style={[
                        styles.buttonGrey,
                        { backgroundColor: Constants.pink },
                      ]}
                      onPress={() => {
                        setIsOpen(true);
                        setFortrackingOrderId(order._id);
                      }}>
                      <Text style={styles.buttonTextBlack}>
                        {t('Assign Driver')}
                      </Text>
                    </TouchableOpacity>
                  ) : null)}
              </>
            )}
          </>
        )}
      </View>
      <Modal
        animationType="none"
        transparent={true}
        visible={open1}
        onRequestClose={() => {
          setopen1(!open1);
        }}>
        <View style={styles.centeredView2}>
          <View style={styles.modalView2}>
            <Text style={styles.alrt}>{t('Start Preparing Order?')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to start preparing the order?')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setopen1(!open1)}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, { color: Constants.saffron }]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    setopen1(false);
                    handleInProcessClick();
                  }}>
                  <Text style={styles.modalText}>{t('Yes, Proceed')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="none"
        transparent={true}
        visible={isOpen}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setIsOpen(!isOpen);
        }}>
        <View style={styles.centeredView2}>
          <View style={styles.modalView2}>
            <Text style={styles.alrt}>
              {order.isLocalDelivery ? t('Assign Driver') : t('Tracking Info')}
            </Text>
            <View
              style={{
                backgroundColor: 'white',
                // alignItems: 'center',
                paddingHorizontal: 20,
                width: '100%',
                marginTop: 10,
              }}>
              {order?.isShipmentDelivery && (
                <View>
                  <Text style={styles.label}>{t('Tracking Number')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('Enter Tracking Number')}
                    placeholderTextColor={Constants.customgrey}
                    value={modalText?.trackingNo}
                    onChangeText={trackingNo =>
                      setModalText(prev => ({ ...prev, trackingNo }))
                    }
                    autoCapitalize="none"
                  />
                  <Text style={styles.label}>{t('Company Name')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('Enter Company Name')}
                    placeholderTextColor={Constants.customgrey}
                    value={modalText?.companyName}
                    onChangeText={companyName =>
                      setModalText(prev => ({ ...prev, companyName }))
                    }
                    autoCapitalize="none"
                  />
                </View>
              )}
              {order?.isLocalDelivery && (
                <View>
                  <Text style={styles.label}>{t('Assign Driver')}</Text>
                  <Dropdown
                    style={styles.input}
                    data={driverList?.map(item => ({
                      label: item.username,
                      value: item._id,
                    }))}
                    value={modalText?.driverId}
                    onChange={item => {
                      setModalText(prev => ({ ...prev, driverId: item.value }));
                    }}
                    placeholder={t('Select Driver')}
                    placeholderStyle={{ color: Constants.customgrey }}
                    selectedTextStyle={{ color: Constants.black }}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    renderItem={item => (
                      <Text style={{ padding: 10, color: Constants.black }}>
                        {item.label}
                      </Text>
                    )}
                  />
                </View>
              )}

              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setIsOpen(!isOpen);
                    setModalText({
                      trackingNo: '',
                      companyName: '',
                      driverId: '',
                    });
                    setFortrackingOrderId(null);
                  }}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, { color: Constants.saffron }]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    updateTrackingInfo(fortrackingOrderId, modalText);
                    setIsOpen(false);
                  }}>
                  <Text style={styles.modalText}>{t('Yes, Update')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#F38529',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonCompleted: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonGrey: {
    backgroundColor: '#00000020',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonDisabled: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
  },
  buttonTextBlack: {
    color: 'black',
    fontSize: 15,
  },
  buttonTextDisabled: {
    color: 'white',
    fontSize: 15,
  },
  backdrop: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  popuptxt: {
    fontSize: 16,
    fontFamily: FONTS.Regular,
    color: Constants.black,
    paddingRight: 5,
  },

  centeredView2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView2: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    width: '90%',
  },

  textStyle: {
    color: Constants.black,
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
  status: {
    color: Constants.saffron,
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  statuscov: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  modalText: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Bold,
  },
  timeslotxt: {
    color: Constants.saffron,
    fontSize: 14,
    fontFamily: FONTS.Medium,
    // alignSelf:'center'
  },
  label: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.Regular,
    fontWeight: '700',
    marginBottom: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    color: Constants.black,
    fontWeight: '500',
    borderRadius: 10,
    textAlign: 'left',
    fontSize: 16,
    fontFamily: FONTS.Regular,
    marginTop: 5,
    paddingHorizontal: 10,
    height: 45,
    width: '100%',
    marginBottom: 10,
  },
});

export default OrderReady;
