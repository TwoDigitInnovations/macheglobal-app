import {
  Animated,
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
} from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { navigate } from '../../../navigationRef';
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import { mapStyle } from './mapStyle';
import Header from '../../Assets/Component/Header';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
// import CustomCurrentLocation from '../../Component/CustomCurrentLocation';

const TrackDriver = props => {
  const data = props?.route?.params;
  const {t} = useTranslation();
  console.log(data)
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDHd5FoyP2sDBo0vO2i0Zq7TIUZ_7GhBcI';
  const [location, setlocation] = useState(null);
  const [destination, setdestination] = useState(null);
  const [render, setrender] = useState();
  const [assigndata, setassigndata] = useState();

  const mapRef = useRef(null);
  const animatedValue = new Animated.Value(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  useEffect(() => {
    if (routeCoordinates.length > 0) {
      animateRoute();
    }
  }, [routeCoordinates]);
  const animateRoute = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };


  const [interval, setinter] = useState();

  useEffect(() => {
    let int;
    if(data.driverid){
      getdriverlocation();
      clearInterval(interval);
     
      // if (data.assign) {
        int = setInterval(() => {
          getdriverlocation(int);
        }, 30000);
        setinter(int);
      // } else {
      //   clearInterval(int);
      // }
    }
   
    return () => {
      clearInterval(int);
    };
  }, [data]);

  
  const getdriverlocation = (inter) => {

    GetApi(`getdriverlocation/${data.driverid}`).then(
      async res => {
        if (res.status) {
          setassigndata(res.data)
          console.log('lat', res.data.location.coordinates[1])
          console.log('long', res.data.location.coordinates[0])
          setrender(true)
        } else {
          // setToast(res.message);
          clearInterval(inter);
        }
      },
      err => {
        setLoading(false);
        console.log(err);
        clearInterval(inter);
      },
    );
  };
  


  const PackageIcon = () => {
    // console.log('image=======>', item);
    return (
      <TouchableOpacity
        style={{ height: 30, width: 30, position: 'relative' }}
        onPress={() => {
          rideRef.current.show();
        }}>
        {/* <View style={[styles.startMarkerView, {borderColor: Constants.red}]}> */}
        <View
          style={[
            styles.startMarkerView,
            { overflow: 'hidden', borderColor: Constants.customblue },
          ]}>
          <Image
            // source={require('../../Assets/Images/proimg2.png')}
            source={
              require('../../Assets/Images/bike.png')
            }
            onLoadEnd={() => {
              // item.isReady = true;
              // setPackagePlans([...packagePlans])
              // if (index + 1 === packagePlans.length) {
              //   setTimeout(() => {
              //     setIsmapready(true)
              //   }, 5000);
              // }
            }}
            // defaultSource={require('../../Assets/Images/truck2.png')}
            style={{ height: 30, width: 30, objectFit: 'contain' }}
          />
        </View>
        {/* <View
            style={{
              position: 'absolute',
              bottom: -28,
            }}>
            <Down height={50} width={20} color={Constants.customblue} />
          </View>
        </View> */}
      </TouchableOpacity>
    );
  };
  return (
    <SafeAreaView
      style={[
        styles.container,
      ]}>
      <DriverHeader item={t('Track Driver')} showback={true} />
   <View style={{ flex: 1 }}>
       {assigndata&& <MapView
       key={render}
          ref={mapRef}
          provider={PROVIDER_GOOGLE} // remove if not using Google Maps
          style={styles.map}
          customMapStyle={mapStyle}
          region={destination ? destination : location}
        // showsUserLocation={true}
        >
         
          <Marker
            coordinate={{
              latitude: data?.userlocation?.coordinates[1],
              longitude: data?.userlocation?.coordinates[0],
            }}
            // title={'Sourse'}
          />
          {assigndata?.currentlocation && <Marker
            zIndex={8}
            draggable={false}
            coordinate={{
              latitude: assigndata?.currentlocation.coordinates[1],
              longitude: assigndata?.currentlocation.coordinates[0],
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <PackageIcon /></Marker>}
         
          {/* <MapViewDirections
            origin={{
              latitude: data?.src?.coordinates[1],
              longitude: data?.src?.coordinates[0],
            }}
            destination={{
              latitude: data?.dest?.coordinates[1],
              longitude: data?.dest?.coordinates[0],
            }}
            onReady={result => {
              const edgePadding = {
                top: 100,
                right: 50,
                bottom: 100,
                left: 50,
              };
              // console.log('result', result);
              mapRef.current.fitToCoordinates(result.coordinates, {
                edgePadding,
                animated: true,
              });
              setRouteCoordinates(result.coordinates);
            }}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={5}
            //  strokeColor="#111111"
            strokeColors={['#000']}
            optimizeWaypoints={true}
          /> */}
          {assigndata?.currentlocation && <MapViewDirections
            origin={{
              latitude: assigndata?.currentlocation?.coordinates[1],
              longitude: assigndata?.currentlocation?.coordinates[0],
            }}
            destination={{
              latitude: data.userlocation.coordinates[1],
              longitude: data.userlocation.coordinates[0],
            }}
            onReady={result => {
              const edgePadding = {
                top: 100,
                right: 50,
                bottom: 100,
                left: 50,
              };
              // console.log('result', result);
              mapRef.current.fitToCoordinates(result.coordinates, {
                edgePadding,
                animated: true,
              });
              setRouteCoordinates(result.coordinates);
            }}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={5}
            //  strokeColor="#111111"
            strokeColors={['#000']}
            optimizeWaypoints={true}
          />}
          
        </MapView>}
       
      </View>
    </SafeAreaView>
  );
};

export default TrackDriver;

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Constants.white,
    // padding: 20,
  },
  addb: {
    fontSize: 20,
    // color: Constants.customgrey,
    // fontWeight: '500',
    fontFamily: FONTS.Medium,
  },
  box: {
    borderWidth: 2,
    borderColor: Constants.customblue,
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderRadius: 10,
    marginVertical: 20,
    // flexDirection: 'row',
    // justifyContent: 'space-between',
  },
  box3: {
    borderWidth: 2,
    borderColor: Constants.customblue,
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 50,
    // flexDirection: 'row',
    // justifyContent: 'space-between',
  },
  // box2: {
  //   paddingHorizontal: 10,
  //   paddingVertical: 25,
  //   borderRadius: 10,
  //   marginVertical: 20,
  //   borderRadius:5,
  //   // height:70,
  //   width:'90%',
  //   alignSelf:'center',
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  // },
  verline: {
    height: 1,
    width: '100%',
    backgroundColor: Constants.customgrey,
    marginVertical: 10,
  },
  add2: {
    fontSize: 18,
    // color: Constants.customgrey,
    fontFamily: FONTS.Regular,
  },
  btm: {
    // padding: 20,
    flex: 1,
    paddingBottom: 10
  },
  calbox: {
    flexDirection: 'row',
    gap: 5,
  },
  cal2: {
    alignSelf: 'center',
  },
  secpart: {
    flexDirection: 'column',
    // marginTop: 20,
  },
  secpartimg: {
    height: 70,
    width: 70,
    // borderRadius: 35,
    // resizeMode:'contain',
    alignSelf: 'center',
  },
  secendpart: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  modal: {
    // height: '40%',
    width: '85%',
    backgroundColor: Constants.white,
    borderRadius: 5,
    padding: 10,
  },
  cross: {
    alignSelf: 'flex-end',
    marginRight: 10,
    marginTop: 10,
  },
  tik2: {
    alignSelf: 'center',
  },
  txt: {
    alignSelf: 'center',
    color: Constants.black,
    fontWeight: '700',
    fontSize: 20,
    marginVertical: 20,
    fontFamily: FONTS.Bold,
  },
  cardbtm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    // height: 70,
  },
  box: {
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: Constants.white,
    width: '95%',
    alignSelf: 'center',
  },
  box2: {
    paddingHorizontal: 10,
    paddingVertical: 25,
    borderRadius: 20,
    marginVertical: 10,
    // backgroundColor: Constants.white,
    width: '95%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dotline: {
    // borderColor: Constants.customgrey,
    borderLeftWidth: 1,
    borderStyle: 'dotted',
    alignSelf: 'center',
    height: 30,
    marginVertical: 7,
    // backgroundColor:Constantsblack
  },
  verline: {
    height: 1,
    width: '100%',
    backgroundColor: Constants.customgrey,
    marginVertical: 10,
  },
  shadowProp: {
    // shadowColor: Constants.black,
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  shadowProp2: {
    shadowColor: Constants.black,
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  button: {
    backgroundColor: Constants.lightblue,
    height: 55,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
  },
  secendboldtxt: {
    // color: Constants.black,
    fontSize: 13,
    // fontWeight: '600',
    fontFamily: FONTS.SemiBold,
    alignSelf: 'center',
    width: '40%',
  },
  secendtxt: {
    // color: Constants.black,
    fontSize:13,
    textAlign: 'left',
    width: '60%',
    fontFamily: FONTS.Regular
  },
});
