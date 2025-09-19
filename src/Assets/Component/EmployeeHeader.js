/* eslint-disable react-native/no-inline-styles */
import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import React, {useContext, useEffect, useState, useRef} from 'react';
import Constants, {FONTS} from '../Helpers/constant';
import {goBack, navigate, reset} from '../../../navigationRef';
import {GetApi} from '../Helpers/Service';
import {UserContext} from '../../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BackIcon, CrossIcon, FilterIcon, SignoutIcon} from '../../../Theme';
import {useTranslation} from 'react-i18next';
import {Dropdown} from 'react-native-element-dropdown';

const EmployeeHeader = props => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);
  const [user, setuser] = useContext(UserContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [tempFilterType, setTempFilterType] = useState({
    orderType: null,
    date: null,
  });
  const isInitialized = useRef(false);
  const [userDetail, setUserDetail] = useState({
    email: '',
    username: '',
    number: '',
    img: '',
  });

  // Initialize temp filter state only when modal first opens
  useEffect(() => {
    if (filterVisible && !isInitialized.current) {
      setTempFilterType({
        orderType: props.filterType?.orderType || null,
        date: props.filterType?.date || null,
      });
      isInitialized.current = true;
    } else if (!filterVisible) {
      // Reset initialization flag when modal closes
      isInitialized.current = false;
    }
  }, [filterVisible, props.filterType]);

  return (
    <>
      <View style={styles.toppart}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Constants.saffron}
        />
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            //   backgroundColor:'red',
            width: '100%',
          }}>
          <Text style={styles.backtxt}>{props?.item}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            {props?.filterType && (
              <TouchableOpacity
                onPress={() => setFilterVisible(true)}
                style={{width: 20, height: 20, marginRight: 10}}>
                <FilterIcon color={Constants.white} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{width: 20, height: 20, marginRight: 10}}>
              <SignoutIcon color={Constants.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={{backgroundColor: 'white', alignItems: 'center'}}>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to sign out?')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible(!modalVisible)}
                  style={styles.cancelButtonStyle}>
                  <Text style={styles.modalText}>{t('Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={async () => {
                    setModalVisible(!modalVisible);
                    await AsyncStorage.removeItem('userDetail');
                    reset('Auth');
                  }}
                  style={styles.logOutButtonStyle}>
                  <Text style={styles.modalText}>{t('Sign out')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterVisible}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setFilterVisible(!filterVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                width: '100%',
                position: 'relative',
              }}>
              <CrossIcon
                style={{position: 'absolute', right: 0, top: 0}}
                onPress={() => setFilterVisible(false)}
              />
              <Text style={styles.textStyle}>{t('Filter Options')}</Text>
              <View style={{width: '100%', marginTop: 10}}>
                <Dropdown
                  style={styles.input}
                  data={[
                    // {label: t('All'), value: null},
                    {label: t('In Store Pickup'), value: 'isOrderPickup'},
                    {label: t('Curbside Pickup'), value: 'isDriveUp'},
                    {
                      label: t('Next Day Local Delivery'),
                      value: 'isLocalDelivery',
                    },
                    {label: t('Shipping'), value: 'isShipmentDelivery'},
                  ]}
                  value={tempFilterType?.orderType}
                  onChange={item => {
                    setTempFilterType(prev => ({
                      ...prev,
                      orderType: item.value,
                    }));
                  }}
                  placeholder={t('Select Order Type')}
                  placeholderStyle={{color: Constants.customgrey}}
                  selectedTextStyle={{color: Constants.black}}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  renderItem={item => (
                    <Text style={{padding: 10, color: Constants.black}}>
                      {item.label}
                    </Text>
                  )}
                />
                <Dropdown
                  style={styles.input}
                  data={[
                    // {label: t('All'), value: null},
                    {label: t('Recent Order'), value: 'dateOfDelivery'},
                    {label: t('Created Order'), value: 'createdAt'},
                  ]}
                  value={tempFilterType?.date}
                  onChange={item => {
                    setTempFilterType(prev => ({
                      ...prev,
                      date: item.value,
                    }));
                  }}
                  placeholder={t('Order Date')}
                  placeholderStyle={{color: Constants.customgrey}}
                  selectedTextStyle={{color: Constants.black}}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  renderItem={item => (
                    <Text style={{padding: 10, color: Constants.black}}>
                      {item.label}
                    </Text>
                  )}
                />
              </View>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setFilterVisible(!filterVisible);
                    // Reset the temporary filter state
                    setTempFilterType({
                      orderType: null,
                      date: null,
                    });
                    props.setFilterType({
                      orderType: null,
                      date: null,
                    });
                    // Trigger API call if callback provided
                    if (props.onApplyFilter) {
                      props.onApplyFilter({
                        orderType: null,
                        date: null,
                      });
                    }
                  }}
                  style={styles.cancelButtonStyle}>
                  <Text style={styles.modalText}>{t('Clear Filter')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={async () => {
                    setFilterVisible(!filterVisible);
                    props.setFilterType(tempFilterType);

                    if (props.onApplyFilter) {
                      props.onApplyFilter(tempFilterType);
                    }
                  }}
                  style={[
                    styles.logOutButtonStyle,
                    {backgroundColor: Constants.saffron},
                  ]}>
                  <Text style={styles.modalText}>{t('Apply Filter')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default EmployeeHeader;

const styles = StyleSheet.create({
  backtxt: {
    color: Constants.white,
    fontWeight: '600',
    fontSize: 20,
    fontFamily: FONTS.Medium,
  },
  toppart: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Constants.saffron,
  },
  hi: {
    marginRight: 10,
    height: 25,
    width: 25,
    borderRadius: 15,
  },
  aliself: {
    alignSelf: 'center',
    // fontWeight:'bold'
    // fontFamily:FONTS.Bold
  },
  /////////logout model //////
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 22,
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 17,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
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
    width: '90%',
  },

  textStyle: {
    color: Constants.black,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 16,
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
    gap: 3,
  },
  cancelButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.black,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginRight: 10,
  },
  logOutButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.red,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
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
    marginBottom: 10,
    width: '100%',
  },
});
