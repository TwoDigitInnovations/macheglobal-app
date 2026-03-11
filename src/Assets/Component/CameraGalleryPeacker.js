/* eslint-disable no-alert */
/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, { useEffect } from 'react';
// import ImagePicker from 'react-native-image-crop-picker';
import ActionSheet from 'react-native-actions-sheet';
import { check, PERMISSIONS, RESULTS, request, requestMultiple } from 'react-native-permissions';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
// import ImagePicker from 'react-native-image-picker';
import Constants from '../Helpers/constant';

const CameraGalleryPeacker = (props) => {
  // useEffect(() => {
  //   ImagePicker.clean()
  //     .then(() => {
  //       // console.log('removed tmp images from tmp directory');
  //       alert('Temporary images history cleared');
  //     })
  //     .catch(e => {
  //       alert(e);
  //     });
  // }, []);

  const options2 = {
    mediaType: 'photo',
    maxWidth: props?.width || 300,
    maxHeight: props?.height || 300,
    quality: props?.quality || 1,
    includeBase64: props.base64,
    // saveToPhotos: true
    // cameraType: props?.useFrontCamera ? 'front' : 'back',
  };

  const options = {
    width: props?.width || 300,
    height: props?.height || 300,
    cropping: props?.crop || false,
    compressImageQuality: props?.quality || 1,
    includeBase64: props.base64,
    useFrontCamera: props?.useFrontCamera ? props?.useFrontCamera : false,
  };

  const launchCameras = async () => {
    launchCamera(options2, (response) => {
      console.log('Camera response:', response);
      if (response.didCancel) {
        props?.cancel();
        console.log('User cancelled camera');
      } else if (response.error) {
        props?.cancel();
        console.log('Camera Error:', response.error);
      } else if (response.customButton) {
        props?.cancel();
        console.log('User tapped custom button: ', response.customButton);
      } else {
        console.log('Camera photo captured successfully');
        // Call getImageValue first, then cancel
        props.getImageValue(response);
        // Small delay to ensure image processing starts before modal closes
        setTimeout(() => {
          props?.cancel();
        }, 100);
      }
    });
  };

  const launchImageLibrarys = async () => {
    launchImageLibrary(options2, (response) => {
      console.log('Gallery response:', response);
      if (response.didCancel) {
        props?.cancel();
        console.log('User cancelled gallery picker');
      } else if (response.error) {
        props?.cancel();
        console.log('Gallery Error:', response.error);
      } else if (response.customButton) {
        props?.cancel();
        console.log('User tapped custom button: ', response.customButton);
      } else {
        console.log('Gallery photo selected successfully');
        // Call getImageValue first, then cancel
        props.getImageValue(response);
        // Small delay to ensure image processing starts before modal closes
        setTimeout(() => {
          props?.cancel();
        }, 100);
      }
    });
  };

  // const checkAndroidPermission = async type => {
  //   console.log(Platform.Version);
  //   if (Platform.OS !== 'android') {
  //     const granted = await PermissionsAndroid.requestMultiple([
  //       'android.permission.CAMERA',
  //       'android.permission.READ_EXTERNAL_STORAGE',
  //       // 'android.permission.WRITE_EXTERNAL_STORAGE',
  //     ]);
  //     if (
  //       granted['android.permission.CAMERA'] !== 'granted' &&
  //       granted['android.permission.READ_EXTERNAL_STORAGE'] !== 'granted'
  //       //  &&
  //       // granted['android.permission.WRITE_EXTERNAL_STORAGE'] !== 'granted'
  //     ) {
  //       throw new Error('Required permission not granted');
  //     } else {
  //       // try {
  //       //   const result = await launchCamera({saveToPhotos: true});
  //       //   console.log(result);
  //       // } catch (err) {
  //       //   console.log(err);
  //       // }
  //       type();
  //       // launchCameras();
  //     }
  //   } else {
  //     type();
  //     // launchCameras();
  //   }
  // };

  const requestCameraPermission = async (type) => {
    try {
      if (Platform.OS === 'android') {
        // For Android, request both camera and storage permissions
        const permissions = [
          PERMISSIONS.ANDROID.CAMERA,
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        ];
        
        const results = await requestMultiple(permissions);
        
        if (results[PERMISSIONS.ANDROID.CAMERA] === RESULTS.GRANTED) {
          console.log('Camera permission granted');
          type();
        } else {
          console.log('Camera permission denied');
          alert('Camera permission is required to take photos');
        }
      } else {
        // For iOS
        const cameraPermission = PERMISSIONS.IOS.CAMERA;
        const result = await check(cameraPermission);
        
        if (result === RESULTS.GRANTED) {
          type();
          console.log('Camera permission already granted');
          return;
        }
        
        if (result === RESULTS.DENIED || result === RESULTS.UNAVAILABLE) {
          const permissionResult = await request(cameraPermission);
          
          if (permissionResult === RESULTS.GRANTED) {
            console.log('Camera permission granted');
            type();
          } else {
            console.log('Camera permission denied');
            alert('Camera permission is required to take photos');
          }
        }
      }
    } catch (error) {
      console.error('Error checking or requesting camera permission:', error);
    }
  };

  const requestMediaPermission = async (type) => {
    try {
      // Specify the permission you want to request
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      // Check the current status of the permission
      const result = await check(permission);
      // const result2 = await check(PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      // If permission is already granted, do nothing
      if (result === RESULTS.GRANTED) {
        type()
        console.log('Permission already granted');
        return;
      }

      // If permission is denied or undetermined, request permission
      if (result === RESULTS.DENIED || result === RESULTS.UNAVAILABLE) {
        const permissionResult = await request(permission);

        // Handle the permission result
        if (permissionResult === RESULTS.GRANTED) {
          console.log('Permission granted');
          type()
          // You can now access the media
        } else {
          console.log('Permission denied');
          type()
          // Handle the denial of permission
        }
      }
    } catch (error) {
      console.error('Error checking or requesting permission:', error);
    }
  };


  return (
    <ActionSheet
      ref={props.refs}
      closeOnTouchBackdrop={false}
      onNavigateBack={() => {
        props.cancel()
      }}
      containerStyle={{ backgroundColor: props.backgroundColor }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 30 }}>
        <View style={{ marginLeft: 10 }}>
          <Text
            style={{
              color: props?.headerColor || Constants.black,
              fontSize: 20,
              fontWeight: '700',
              marginBottom: 20,
            }}>
            Choose your photo
          </Text>
        </View>
        <TouchableOpacity
          style={{ flexDirection: 'row', width: '100%' }}
          onPress={() => {
            requestCameraPermission(launchCameras);
            // launchCameras();

            // props.refs.current?.hide();
          }}>
          <View style={{ marginLeft: 10 }}>
            <Text
              style={{
                color: props?.titleColor || Constants.black,
                fontSize: 18,
                fontWeight: '500',
                opacity: 0.7,
              }}>
              Take a Picture
            </Text>
          </View>
        </TouchableOpacity>

        {props.hidegallaryoption ? null : <TouchableOpacity
          style={{ flexDirection: 'row', marginTop: 10 }}
          onPress={() => {
            requestMediaPermission(launchImageLibrarys);
            // launchImageLibrarys();
            // props.refs.current?.hide();
          }}>
          <View style={{ marginLeft: 10 }}>
            <Text
              style={{
                color: props?.titleColor || Constants.black,
                fontSize: 18,
                fontWeight: '500',
                opacity: 0.7,
              }}>
              Choose from gallery
            </Text>
          </View>
        </TouchableOpacity>}

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            marginTop: 20,
            alignItems: 'flex-end',
          }}
          onPress={() => {
            props?.cancel()
            props.refs.current?.hide();
          }}>
          <View style={{ marginLeft: 10, width: '100%' }}>
            <Text
              style={{
                color: props?.cancelButtonColor || Constants.black,
                fontSize: 18,
                fontWeight: '500',
                textAlign: 'right',
                marginRight: 20,
              }}>
              CANCEL
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ActionSheet>
  );
};

export default CameraGalleryPeacker;
