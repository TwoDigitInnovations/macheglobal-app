/* eslint-disable react-native/no-inline-styles */
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import {
  request,
  PERMISSIONS,
  requestLocationAccuracy,
} from 'react-native-permissions';
import MapViewDirections from 'react-native-maps-directions';
import Constants, {
  Currency,
  FONTS,
  Googlekey,
} from '../../Assets/Helpers/constant';
import moment from 'moment';
import { goBack, navigate } from '../../../navigationRef';
import { LoadContext, ToastContext } from '../../../App';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import Header from '../../Assets/Component/Header';
import { CheckboxactiveIcon } from '../../../Theme';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import CustomCurrentLocation from '../../Component/CustomCurrentLocation';

const Map = props => {
  const data = props?.route?.params?.orderid;
  const locationtpye = props?.route?.params?.type;
  const { t } = useTranslation();
  const screenHeight = Dimensions.get('window').height;
  // console.log(data);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [modalVisible5, setModalVisible5] = useState(false);
  const [modalVisible4, setModalVisible4] = useState(false);
  const [modalVisible3, setModalVisible3] = useState(false);
  const [modalVisibleGoogleMaps, setModalVisibleGoogleMaps] = useState(false);
  const [toast, setToast] = useContext(ToastContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [from, setFrom] = useState('');
  const [location, setlocation] = useState(null);
  const [destination, setdestination] = useState(null);
  const [locationadd, setlocationadd] = useState(null);
  const [destinationadd, setdestinationadd] = useState(null);
  const [per, setper] = useState(null);
  const [orderdetail, setorderdetail] = useState();

  const DELIVERY_START_LOCATION = {
    latitude: 29.7049215,
    longitude: -95.58094542,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
    address: '11360 Bellaire Blvd Suite 700, Houston, TX 77072',
  };

  const mapRef = useRef(null);
  const animatedValue = new Animated.Value(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    if (data) {
      MyOrders();
    }
    // Set fixed delivery start location instead of GPS
    setlocation(DELIVERY_START_LOCATION);
    setlocationadd(DELIVERY_START_LOCATION.address);
  }, [data]);

  const CustomCurrentLocation = async () => {
    try {
      if (Platform.OS === 'ios') {
        request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(result => {
          console.log(result);
          if (result === 'granted') {
            Geolocation.getCurrentPosition(
              position => {
                console.log(position);
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Add validation for coordinates
                if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                  setlocation({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                  });
                }
              },
              error => {
                console.log(error.code, error.message);
                //   return error;
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
            );
          }
        });
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            position => {
              console.log(position);
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;

              // Add validation for coordinates
              if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                setlocation({
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.0121,
                });
              }
            },
            error => {
              console.log(error.code, error.message);
              //   return error;
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        } else {
          console.log('location permission denied');
        }
      }
    } catch (err) {
      console.log('location err =====>', err);
    }
  };

  console.log(destination);
  const MyOrders = () => {
    setLoading(true);
    GetApi(`getProductRequest/${data}`, {}).then(
      async res => {
        setLoading(false);
        console.log('locations[[[[[[[[[=====>', res.data.Local_address.location);
        setorderdetail(res.data);

        // Add safety checks for coordinates
        const lat = Number(res?.data?.Local_address?.location?.coordinates[1].toFixed(6));
        const lng = Number(res?.data?.Local_address?.location?.coordinates[0].toFixed(6));

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          setdestination({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          });
        }
        // if (locationtpye === 'shop') {
        //   setdestination({
        //     latitude: Number(res?.data?.seller_id?.location?.coordinates[1]),
        //     longitude: Number(res?.data?.seller_id?.location?.coordinates[0]),
        //     latitudeDelta: 0.015,
        //     longitudeDelta: 0.0121,
        //   });
        // } else {
        //   setdestination({
        //     latitude: Number(res?.data?.Local_address?.location?.coordinates[1]),
        //     longitude: Number(res?.data?.Local_address?.location?.coordinates[0]),
        //     latitudeDelta: 0.015,
        //     longitudeDelta: 0.0121,
        //   });
        // }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  useEffect(() => {
    if (routeCoordinates.length > 0) {
      animateRoute();
    }
  }, [routeCoordinates]);

  // useEffect(() => {
  //   if (location && destination && mapRef.current) {
  //     // Fit map to show both origin and destination with more padding
  //     const coordinates = [location, destination];
  //     const edgePadding = {
  //       top: 150,
  //       right: 80,
  //       bottom: 150,
  //       left: 80,
  //     };

  //     setTimeout(() => {
  //       mapRef.current.fitToCoordinates(coordinates, {
  //         edgePadding,
  //         animated: true,
  //       });
  //     }, 1500); // Longer delay to ensure map is fully loaded
  //   }
  // }, [location, destination]);
  const animateRoute = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };
  const collectorder = id => {
    const body = {
      id: id,
      status: 'Collected',
    };
    setLoading(true);
    Post('changeorderstatus', body).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          MyOrders();
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const collectcash = id => {
    const body = {
      id: id,
    };
    setLoading(true);
    Post(`cashcollected`, body).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          MyOrders();
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const deliverorder = id => {
    const body = {
      id: id,
      status: 'Delivered',
    };
    setLoading(true);
    Post(`changeorderstatus`, body).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          MyOrders();
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };
  const onthewaytodelivery = id => {
    setLoading(true);
    GetApi(`onthewaytodelivery/${id}`).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res.status) {
          MyOrders();
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const Acceptorder = id => {
    setLoading(true);
    Post('acceptorderdriver/' + id, {}).then(
      async res => {
        setLoading(false);
        console.log(res);
        if (res?.status) {
          MyOrders();
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

  const openGoogleMaps = () => {
    const driverLat = location?.latitude || DELIVERY_START_LOCATION.latitude;
    const driverLng = location?.longitude || DELIVERY_START_LOCATION.longitude;
    const destinationLat = destination?.latitude;
    const destinationLng = destination?.longitude;

    if (destinationLat && destinationLng) {
      const url = `https://www.google.com/maps/dir/${driverLat},${driverLng}/${destinationLat},${destinationLng}`;
      Linking.openURL(url).catch(err => {
        console.error('Error opening Google Maps:', err);
        Toast.show({
          type: 'error',
          text1: 'Unable to open Google Maps',
        })
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Destination location not available',
      })
    }
  };

  const getCurrentDriverLocation = () => {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'ios') {
        request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(result => {
          if (result === 'granted') {
            Geolocation.getCurrentPosition(
              position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                  resolve({ latitude: lat, longitude: lng });
                } else {
                  resolve(DELIVERY_START_LOCATION);
                }
              },
              error => {
                console.log(error.code, error.message);
                resolve(DELIVERY_START_LOCATION);
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
            );
          } else {
            resolve(DELIVERY_START_LOCATION);
          }
        });
      } else {
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then(granted => {
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            Geolocation.getCurrentPosition(
              position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                  resolve({ latitude: lat, longitude: lng });
                } else {
                  resolve(DELIVERY_START_LOCATION);
                }
              },
              error => {
                console.log(error.code, error.message);
                resolve(DELIVERY_START_LOCATION);
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
            );
          } else {
            resolve(DELIVERY_START_LOCATION);
          }
        });
      }
    });
  };

  const openGoogleMapsWithCurrentLocation = async () => {
    try {
      const currentLocation = await getCurrentDriverLocation();
      const destinationLat = destination?.latitude;
      const destinationLng = destination?.longitude;

      if (destinationLat && destinationLng) {
        let origin = `${currentLocation.latitude},${currentLocation.longitude}`;
        let destination = `${destinationLat},${destinationLng}`;
        // const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelMode}`;

        const url4 = `https://waze.com/ul?ll=${destination}&navigate=yes`;
        const url = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${destinationLat},${destinationLng}`;
        Linking.openURL(url).catch(err => {
          console.error('Error opening Google Maps:', err);
          Toast.show({
            type: 'error',
            text1: 'Unable to open Google Maps',
          })
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Destination location not available',
        })
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      openGoogleMaps(); // Fallback to original method
    }
  };

  const MyCustomMarkerView = () => (
    // <View style={{ height: 35, width: 30, position: 'relative' }}>
    <View style={styles.startMarkerView}>
      {/* <Ionicons name="location" size={20} color={Constants.yellow} /> */}
      <View style={{
        position: 'absolute', bottom: -15,
      }}>
        <Ionicons name="caret-down-outline" size={20} color={Constants.yellow} />
      </View>
    </View>
    // </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('My orders')} showback={true} />
      {/* <Image
        source={require('../../Assets/Images/mapimg.png')}
        style={[styles.map, {width: '100%'}]}
      /> */}
      <View style={[styles.mapContainer, { height: screenHeight * 0.4 }]}>
        {location?.latitude && (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude:
                (location.latitude +
                  (destination?.latitude || location.latitude)) /
                2,
              longitude:
                (location.longitude +
                  (destination?.longitude || location.longitude)) /
                2,
              latitudeDelta: 0.05, // Wider view to show both points
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
            showsTraffic={false}
            showsIndoors={true}
            // loadingEnabled={true}
            mapType="standard">
            {destination?.latitude && (
              <Marker
                key="destination-marker"
                coordinate={destination}
                title={'Delivery Destination'}
                description={
                  typeof orderdetail?.Local_address?.address === 'object'
                    ? orderdetail?.Local_address?.address?.address
                    : orderdetail?.Local_address?.address
                }
                pinColor="red"
              // image={require('../../Assets/Images/Start.png')}
              />
            )}
            {location?.latitude && (
              <Marker
                key="source-marker"
                coordinate={location}
                title={'Driver Start Location'}
                description={'11360 Bellaire Blvd Suite 700, Houston, TX 77072'}
                pinColor={'green'}
              />

            )}
            {location?.latitude && destination?.latitude && (
              <MapViewDirections
                origin={location}
                destination={destination}
                onReady={result => {
                  console.log('result', result);

                  // Don't auto-fit when route is ready, let user control zoom
                  // setTimeout(() => {
                  //   mapRef.current.fitToCoordinates(result.coordinates, {
                  //     edgePadding,
                  //     animated: true,
                  //   });
                  // }, 500);
                  const edgePadding = { top: 50, right: 50, bottom: 50, left: 50 };
                  mapRef.current.fitToCoordinates(result.coordinates, {
                    edgePadding,
                    animated: true,
                  });

                  setRouteCoordinates(result.coordinates);
                }}
                apikey={Googlekey}
                strokeWidth={4}
                strokeColor={Constants.customblue || '#007AFF'}
                // strokeColors={['#007AFF']}
                // strokeColors={['#000']}

                optimizeWaypoints={true}
                onError={error => console.log('Directions error:', error)}
              />
            )}
          </MapView>
        )}
      </View>

      {/* Map Control Buttons */}
      {/* {location && destination && (
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => {
              if (mapRef.current) {
                const coordinates = [location, destination];
                const edgePadding = {
                  top: 150,
                  right: 80,
                  bottom: 150,
                  left: 80,
                };
                mapRef.current.fitToCoordinates(coordinates, {
                  edgePadding,
                  animated: true,
                });
              }
            }}>
            <Text style={styles.controlBtnText}>{t('Fit Both Points')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => {
              if (mapRef.current && routeCoordinates.length > 0) {
                const edgePadding = {
                  top: 120,
                  right: 60,
                  bottom: 120,
                  left: 60,
                };
                mapRef.current.fitToCoordinates(routeCoordinates, {
                  edgePadding,
                  animated: true,
                });
              }
            }}>
            <Text style={styles.controlBtnText}>{t('Fit Route')}</Text>
          </TouchableOpacity>
        </View>
      )} */}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.box}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row' }}>
              <Image
                // source={require('../../Assets/Images/profile4.png')}
                source={
                  orderdetail?.user?.img
                    ? {
                      uri: `${orderdetail?.user?.img}`,
                    }
                    : require('../../Assets/Images/profile.png')
                }
                style={styles.hi}
              // onPress={()=>navigate('Account')}
              />
              <View>
                <Text style={styles.name}>
                  {orderdetail?.Local_address?.name +
                    ' ' +
                    orderdetail?.Local_address?.lastname}
                </Text>
                <Text style={styles.redeembtn}>
                  {moment(orderdetail?.created_at).format('MM-DD-YYYY')}
                </Text>
              </View>

              {/* <View style={styles.statuscov}>
                <Text style={styles.status}>Delivered</Text>
                </View> */}
            </View>
            {locationtpye === 'shop' && (
              <Text style={styles.redeembtn2}>{orderdetail?.orderId}</Text>
            )}
          </View>
          <View style={styles.secendpart}>
            <LabelWithColon
              labelKey="Location"
              textStyle={styles.secendboldtxt}
            />
            <Text style={styles.secendtxt2}>
              {typeof orderdetail?.Local_address?.address === 'object'
                ? orderdetail?.Local_address?.address?.address
                : orderdetail?.Local_address?.address}
            </Text>
          </View>
          {/* <View style={styles.txtcol}>
            <View style={styles.secendpart}>
              <Text style={styles.secendboldtxt}>QTY : </Text>
              <Text style={styles.secendtxt}>{orderdetail?.qty}</Text>
            </View>
          </View> */}
          <View style={styles.txtcol}>
            <View style={{}}>
              <View style={styles.secendpart}>
                <LabelWithColon
                  labelKey="Qty"
                  textStyle={styles.secendboldtxt}
                />
                <Text style={styles.secendtxt}>
                  {orderdetail?.productDetail?.length}
                </Text>
              </View>
            </View>
            <Text style={styles.amount}>
              {Currency}
              {orderdetail?.total}
            </Text>
          </View>
        </TouchableOpacity>
        {orderdetail?.productDetail &&
          orderdetail?.productDetail.length > 0 &&
          orderdetail.productDetail.map((item, index) => (
            <TouchableOpacity
              style={[
                styles.inputbox,
                {
                  marginBottom:
                    index + 1 === orderdetail.productDetail.length &&
                      orderdetail?.status !== 'Delivered'
                      ? 60
                      : 10,
                },
              ]}
              key={index}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flexDirection: 'row', width: '90%' }}>
                  {item?.image && item.image.length > 0 && (
                    <Image
                      source={{ uri: `${item.image[0]}` }}
                      style={styles.hi2}
                    />
                  )}
                  <Text style={styles.name2}>{item?.product?.name}</Text>
                </View>
                {/* <CheckboxactiveIcon style={{}} height={20} width={20} /> */}
              </View>
              <View style={[styles.txtcol, { marginVertical: 10 }]}>
                <View style={styles.secendpart}>
                  <LabelWithColon
                    labelKey="Qty"
                    textStyle={[
                      styles.secendboldtxt,
                      { color: Constants.saffron },
                    ]}
                  />
                  <Text style={[styles.secendtxt]}>{item?.qty}</Text>
                </View>
                <Text style={styles.amount}>
                  {Currency}
                  {item?.price}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

        {/* Google Maps Navigation Button - Inside ScrollView */}
        {(orderdetail || destination) && (
          <TouchableOpacity
            style={[
              styles.googleMapsBtn,
              {
                position: 'relative',
                // // margin: 20,
                // marginBottom: orderdetail?.status !== 'Delivered' ? 80 : 20,
                marginBottom: 20,
              },
            ]}
            onPress={() => {
              console.log('Google Maps button pressed');
              console.log('orderdetail:', !!orderdetail);
              console.log('destination:', !!destination);
              if (orderdetail && destination) {
                setModalVisibleGoogleMaps(true);
              } else {
                Toast.show({
                  type: 'error',
                  text1: err?.message || 'An error occurred',
                })
              }
            }}>
            <Text style={styles.buttontxt}>
              {t('Navigate with Google Maps')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      {/* <View style={{position: 'absolute', bottom: 20, width: '100%'}}> */}

      {/* </View> */}
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
            <Text style={styles.alrt}>{t('Alert !')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to Start this ride !')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible(!modalVisible)}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, { color: Constants.saffron }]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    collectorder(orderdetail._id);
                    setModalVisible(false);
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
        visible={modalVisible2}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible2(!modalVisible2);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.alrt}>{t('Alert !')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to finish the ride?')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible2(!modalVisible2)}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, { color: Constants.saffron }]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    deliverorder(orderdetail._id);
                    setModalVisible2(false);
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
        visible={modalVisible5}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible5(!modalVisible5);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.alrt}>{t('Alert !')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t('Are you on the way to delivery for this order?')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible5(!modalVisible5)}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, { color: Constants.saffron }]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    onthewaytodelivery(orderdetail._id);
                    setModalVisible5(false);
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
        visible={modalVisible3}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible3(!modalVisible3);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.alrt}>{t('Alert !')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t('Are you sure you collected the cash?')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible3(!modalVisible3)}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, { color: Constants.saffron }]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    collectcash(orderdetail._id);
                    setModalVisible3(false);
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
        visible={modalVisible4}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible4(!modalVisible4);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.alrt}>{t('Alert !')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t('Are you sure you want to Accept this ride to delivery !')}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible4(!modalVisible4)}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, { color: Constants.saffron }]}>
                    {t('No')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    setModalVisible4(false);
                    Acceptorder(orderdetail._id);
                  }}>
                  <Text style={styles.modalText}>{t('Yes')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Google Maps Navigation Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisibleGoogleMaps}
        onRequestClose={() => {
          setModalVisibleGoogleMaps(!modalVisibleGoogleMaps);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.alrt}>{t('Navigation')}</Text>
            <View
              style={{
                backgroundColor: 'white',
                alignItems: 'center',
                paddingHorizontal: 30,
              }}>
              <Text style={styles.textStyle}>
                {t(
                  'Do you want to navigate to the delivery location using Google Maps?',
                )}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    setModalVisibleGoogleMaps(!modalVisibleGoogleMaps)
                  }
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText, { color: Constants.saffron }]}>
                    {t('Cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.logOutButtonStyle}
                  onPress={() => {
                    setModalVisibleGoogleMaps(false);
                    openGoogleMapsWithCurrentLocation();
                  }}>
                  <Text style={styles.modalText}>{t('Navigate')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Map;

const styles = StyleSheet.create({
  map: {
    flex: 1,
    minHeight: 250, // Minimum height for map
  },
  mapContainer: {
    width: '100%',
    minHeight: 250, // Minimum height to ensure map is visible
    maxHeight: '50%', // Maximum height so content below is still accessible
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  controlBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
  scrollContainer: {
    flex: 1, // Takes remaining space
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  box: {
    backgroundColor: Constants.white,
    marginVertical: 5,
    padding: 20,
  },
  hi: {
    marginRight: 10,
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  hi2: {
    marginRight: 10,
    height: 50,
    width: 50,
    // borderRadius: 50,
  },
  redeembtn: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: Constants.saffron,
  },
  redeembtn2: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    backgroundColor: Constants.saffron,
    paddingHorizontal: 10,
    // paddingVertical: 5,
    marginVertical: 7,
    borderRadius: 8,
    height: 25,
    textAlign: 'center',
  },
  name: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 16,
  },
  secendpart: {
    flexDirection: 'row',
    // flex: 1,
    // justifyContent: 'space-between',
    marginLeft: 10,
    marginVertical: 5,
    alignItems: 'center',
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
    fontFamily: FONTS.Regular,
  },
  secendtxt2: {
    color: Constants.black,
    fontSize: 15,
    textAlign: 'left',
    flex: 1,
    fontFamily: FONTS.Regular,
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
  signInbtn: {
    height: 50,
    width: '90%',
    borderRadius: 10,
    backgroundColor: Constants.saffron,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: 20,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 20,
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
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
  modalText: {
    color: Constants.white,
    // fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 14,
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
  cancelAndLogoutButtonWrapStyle2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // marginTop: 20,
    gap: 3,
  },
  name2: {
    color: Constants.black,
    fontFamily: FONTS.Bold,
    fontSize: 14,
    alignSelf: 'center',
    width: '90%',
  },
  shadowProp: {
    boxShadow: '0 0 8 0.05 grey',
  },
  shadowProp2: {
    boxShadow: 'inset 0 0 8 5 #1b1e22',
  },
  inrshabox: {
    flex: 1,
    borderRadius: 15,
    backgroundColor: Constants.light_black,
    // justifyContent: 'space-evenly',
    // alignItems: 'center',
    padding: 20,
    // justifyContent:'space-between'
  },
  inputbox: {
    backgroundColor: Constants.saffron + 50,
    color: Constants.custom_black,
    borderRadius: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    // width: '90%',
    // alignSelf: 'center',
    padding: 15,
  },
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
  qty: {
    fontSize: 14,
    color: Constants.customgrey,
    fontFamily: FONTS.Bold,
    // marginBottom: 5,
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
  googleMapsBtn: {
    height: 50,
    width: '90%',
    borderRadius: 10,
    backgroundColor: '#4CAF50', // Green color to distinguish from other buttons
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  startMarkerView: {
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: '#FFDEAB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Constants.red,
    position: 'relative',
  },
});
