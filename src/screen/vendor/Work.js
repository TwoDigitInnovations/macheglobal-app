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
import React, { useContext, useEffect, useState } from 'react';
import DriverHeader from '../../Assets/Component/DriverHeader';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { navigate } from '../../../navigationRef';
import { useIsFocused } from '@react-navigation/native';
import { LoadContext, ToastContext } from '../../../App';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import moment from 'moment';
import {
  CrossIcon,
  RadiooffIcon,
  RadioonIcon,
  StatusIcon,
  ThreedotIcon,
  ViewIcon,
} from '../../../Theme';
import { useTranslation } from 'react-i18next';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';

const Work = () => {
  const { t } = useTranslation();
  const dumydata = [1, 2, 3, 4, 5];
  const IsFocused = useIsFocused();
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [productlist, setproductlist] = useState([]);
  const [employeelist, setemployeelist] = useState([]);
  const [currentTab, setCurrentTab] = useState('pending');
  const [modalVisible, setModalVisible] = useState(false);
  const [assignmodel, setassignmodel] = useState(false);
  const [employeid, setemployeid] = useState('');
  const [orderid, setorderid] = useState('');

  useEffect(() => {
    getEmployee();
    if (IsFocused) {
      setproductlist([]);
      getProducts('pending');
    }
  }, [IsFocused]);

  const getProducts = tab => {
    // setPage(p);
    let url;
    if (tab === 'pending') {
      url = `getOrderBySeller`;
    } else {
      url = `getAssignedOrder`;
    }
    setLoading(true);
    setCurrentTab(tab);
    Post(url, {}).then(
      async res => {
        setLoading(false);
        console.log(res);

        // if (p === 1) {
        setproductlist(res.data);
        // } else {
        //   setproductlist([...productlist, ...res.data]);
        // }
        // setproductlist(res?.data);
      },
      err => {
        setLoading(false);
        setproductlist([]);
        console.log('errrrrrr===>', err);
      },
    );
  };

  // const assigdriver = id => {
  //   const body={
  //     id:id,
  //     status:'Driverassigned'
  //   }
  //   setLoading(true);
  //   Post(`changeorderstatus`, body).then(
  //     async res => {
  //       setLoading(false);
  //       console.log(res);
  //       getProducts('pending');
  //     },
  //     err => {
  //       setLoading(false);
  //       console.log(err);
  //     },
  //   );
  // };
  const getEmployee = () => {
    setLoading(true);
    GetApi(`getEmployee?all=true`).then(
      async res => {
        setLoading(false);
        console.log(res);
        setemployeelist(res?.data);
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const assignOrder = (id, emplid) => {
    const body = {
      orderId: id,
      assignedEmployee: emplid,
    };
    setLoading(true);
    Post(`assignOrder`, body).then(
      async res => {
        setLoading(false);
        console.log(res);
        setToast(res?.message)
        getProducts('pending');
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
            setproductlist([]);
            getProducts('pending');
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
            setproductlist([]);
            getProducts('ongoing');
          }}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 20,
              fontWeight: '700',
              color: currentTab === 'ongoing' ? Constants.saffron : 'black',
            }}>
            {t('Assigned')}
          </Text>
        </TouchableOpacity>
      </View>
      {/* <View style={{marginBottom:200,}}> */}
      <FlatList
        data={productlist}
        style={{ marginBottom: 70 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }, index) => (
          <View key={index}>
            <TouchableOpacity style={[styles.box]}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <View style={{ flexDirection: 'row' }}>
                  <Image
                    // source={require('../../Assets/Images/profile.png')}
                    source={
                      item?.user?.img
                        ? {
                          uri: `${item?.user?.img}`,
                        }
                        : require('../../Assets/Images/profile.png')
                    }
                    style={styles.hi}
                  // onPress={()=>navigate('Account')}
                  />
                  <View>
                    <Text style={styles.name}>{item?.user?.username}</Text>
                    <Text style={styles.redeembtn}>
                      {moment(item?.createdAt).format('DD-MM-YYYY ')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(item._id), console.log(item._id);
                  }}
                  style={{ height: 30, width: 30, alignItems: 'flex-end' }}>
                  <ThreedotIcon />
                </TouchableOpacity>
              </View>
              <Text style={styles.timeslotxt}>
                {item?.timeslot}
              </Text>
              <View style={styles.secendpart}>
                <LabelWithColon
                  labelKey="Location"
                  textStyle={styles.secendboldtxt}
                />
                <Text style={styles.secendtxt2}>
                  {item?.shipping_address?.address}
                </Text>
              </View>

              <View style={styles.txtcol}>
                <View style={{}}>
                  <View style={styles.secendpart}>
                    <LabelWithColon
                      labelKey="Qty"
                      textStyle={styles.secendboldtxt}
                    />
                    <Text style={styles.secendtxt}>
                      {item?.productDetail?.length}
                    </Text>
                  </View>
                </View>
                <Text style={styles.amount}>
                  {Currency}
                  {item?.total}
                </Text>
              </View>
              {currentTab === 'pending' && <TouchableOpacity
                style={styles.acceptButtonStyle}
                onPress={() => {
                  setassignmodel(true), setorderid(item?._id);
                }}>
                <Text style={styles.modalText}>{t('Assign Employee')}</Text>
              </TouchableOpacity>}
            </TouchableOpacity>

            {modalVisible === item._id && (
              <TouchableOpacity
                style={styles.backdrop}
                onPress={() => setModalVisible(null)}>
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    {/* {item.status === 'Pending' && (
                          <TouchableOpacity
                            style={styles.popuplistcov}
                            onPress={() => {
                              navigate('OrderDetail', item),
                                setModalVisible(null);
                            }}>
                            <View style={styles.popuplistcov2}>
                              <ViewIcon />
                              <Text>{t('View Order Details')}</Text>
                            </View>
                          </TouchableOpacity>
                         )} 
                        {item.status === 'Packed' && (
                          <TouchableOpacity
                            style={styles.popuplistcov}
                            onPress={() => {
                              setassignmodel(true),
                                setModalVisible(null),
                                setorderid(item._id);
                            }}>
                            <View style={styles.popuplistcov2}>
                              <ViewIcon />
                              <Text style={styles.popuptxt}>{t('Assign Driver')}</Text>
                            </View>
                          </TouchableOpacity>
                         )}  */}
                    <TouchableOpacity
                      // style={styles.popuplistcov}
                      onPress={() => {
                        navigate('OrderStatus', item._id),
                          setModalVisible(null);
                      }}>
                      <View style={styles.popuplistcov2}>
                        <StatusIcon />
                        <Text style={styles.popuptxt}>{t('Status')}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
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
              {t('No Order Available')}
            </Text>
          </View>
        )}
      />
      {/* </View> */}
      {/* <Modal
        animationType="none"
        transparent={true}
        visible={assignmodel}
        onRequestClose={() => {
          setassignmodel(!assignmodel);
        }}>
        <View style={styles.centeredView2}>
          <View style={styles.modalView2}>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to assign driver !')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setassignmodel(!assignmodel)}
                  style={styles.cancelButtonStyle}>
                  <Text
                    style={[
                      styles.modalText,
                      {color: Constants.saffron},
                    ]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    assigdriver(orderid), setassignmodel(false);
                  }}>
                  <Text style={styles.modalText}>{t('Yes')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal> */}
      <Modal
        transparent={true}
        animationType={'none'}
        visible={assignmodel}
        style={{ zIndex: 1100 }}
        onRequestClose={() => { }}>
        <View style={styles.modalBackground}>
          <View
            style={{
              borderColor: Constants.white,
              borderWidth: 2,
              borderRadius: 10,
              padding: 20,
              width: Dimensions.get('screen').width * 0.8,
              backgroundColor: Constants.white,
            }}>
            <CrossIcon
              color={Constants.black}
              height={15}
              width={15}
              style={{ alignSelf: 'flex-end' }}
              onPress={() => setassignmodel(false)}
            />
            {employeelist &&
              employeelist.length > 0 &&
              employeelist.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    flexDirection: 'row',
                    borderBottomColor: Constants.lightgrey,
                    borderBottomWidth: 1,
                    alignItems: 'center',
                  }}
                  onPress={() => setemployeid(item?._id)}>
                  <View style={{ width: 30 }}>
                    {employeid === item._id ? (
                      <RadioonIcon
                        color={Constants.saffron}
                        height={20}
                        width={20}
                      />
                    ) : (
                      <RadiooffIcon
                        color={Constants.saffron}
                        height={20}
                        width={20}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      color: Constants.black,
                      fontSize: 16,
                      lineHeight: 25,
                      fontWeight: '700',
                      // borderBottomColor: Constants.lightgrey,
                      // borderBottomWidth: 1,
                      paddingBottom: 5,
                      flex: 1,
                      // backgroundColor:'red'
                    }}>
                    {item.username}
                  </Text>
                </TouchableOpacity>
              ))}

            <Text
              style={[
                styles.selectbtn,
                {
                  backgroundColor: employeid ? Constants.saffron : '#40334a',
                },
              ]}
              onPress={() => {
                employeid && setassignmodel(false),
                  assignOrder(orderid, employeid);
              }}>
              {t('Assign')}
            </Text>
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
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    backgroundColor: Constants.saffron,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginVertical: 7,
    borderRadius: 8,
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
    marginVertical: 5
    // alignSelf:'center'
  },
  name: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 14,
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
    minWidth: 150,
    alignItems: 'center',
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
  popuptxt: {
    fontSize: 16,
    fontFamily: FONTS.Regular,
    color: Constants.black,
    paddingRight: 5,
  },

  /////model///
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
    width: '90%',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    // elevation: 5,
    // position: 'relative',
  },

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
  ////////end////////
  status: {
    color: Constants.saffron,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    // alignSelf: 'flex-end',
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
  ////
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
    marginLeft: 10,
  },
  modalBackground: {
    flex: 1,
    // height:'80%',
    // width:'80%',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  selectbtn: {
    backgroundColor: Constants.saffron,
    color: Constants.white,
    fontSize: 16,
    width: '60%',
    paddingVertical: 10,
    alignSelf: 'center',
    textAlign: 'center',
    borderRadius: 10,
    marginTop: 10,
    // height:50
  },
});
