import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  FlatList,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import Constants, {FONTS} from '../Helpers/constant';
import { useTranslation } from 'react-i18next';

const MultiImageCapture = ({onImagesUpload, onImageRemoved, uploadedImageUrls = [], maxImages = 6, style}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const {t} = useTranslation();

  // Update uploaded images when parent provides uploaded URLs
  React.useEffect(() => {
    setUploadedImages(uploadedImageUrls);
  }, [uploadedImageUrls]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS permissions are handled by the library
  };

  const selectImage = async () => {
    if (uploadedImages.length >= maxImages) {
      Alert.alert(
        'Limit Reached',
        `You can only upload up to ${maxImages} images`,
      );
      return;
    }

    // Request camera permission
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera permission is required to take photos.',
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      saveToPhotos: true, // Save the photo to the device's photo library
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
        let errorMessage = 'Failed to capture image';
        
        // Handle specific camera errors
        if (response.error.includes('permission')) {
          errorMessage = 'Camera permission denied. Please enable camera access in settings.';
        } else if (response.error.includes('unavailable')) {
          errorMessage = 'Camera is not available on this device.';
        }
        
        Alert.alert('Camera Error', errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const newImage = response.assets[0];
        
        // Validate the captured image
        if (!newImage.uri) {
          Alert.alert('Error', 'Failed to capture image. Please try again.');
          return;
        }
        
        console.log('Captured image:', newImage);
        
        // Only add to selectedImages for processing, not for display
        setSelectedImages(prev => [...prev, newImage.uri]);
        if (onImagesUpload) {
          onImagesUpload([newImage]); // Pass the complete image object
        }
      } else {
        Alert.alert('Error', 'No image was captured. Please try again.');
      }
    });
  };

  const removeImage = index => {
    const imageToRemove = uploadedImages[index];
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);
    
    // Find and remove from selectedImages as well
    const selectedIndex = selectedImages.indexOf(imageToRemove);
    if (selectedIndex !== -1) {
      const updatedSelected = selectedImages.filter((_, i) => i !== selectedIndex);
      setSelectedImages(updatedSelected);
    }
    
    // Notify parent about the specific image removal
    if (onImageRemoved) {
      onImageRemoved(imageToRemove, index);
    }
  };

  const renderImageItem = ({item, index}) => (
    <View style={styles.imageContainer}>
      <Image source={{uri: item}} style={styles.selectedImage} />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => removeImage(index)}>
        <Text style={styles.removeImageText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={selectImage}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.uploadText}>📷</Text>
          <Text style={styles.uploadLabel}>
            {t('Capture Images')} ({uploadedImages.length}/{maxImages})
          </Text>
          <Text style={styles.uploadSubLabel}>
            Tap to capture {uploadedImages.length === 0 ? 'images with camera' : 'more images'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Selected Images Grid */}
      {uploadedImages.length > 0 && (
        <View style={styles.imagesContainer}>
          <FlatList
            data={uploadedImages}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => index.toString()}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.imagesList}
          />

          {/* Clear All Button */}
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => {
              setUploadedImages([]);
              setSelectedImages([]);
              if (onImagesUpload) {
                onImagesUpload([]);
              }
            }}>
            <Text style={styles.clearAllText}>Clear All Images</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: Constants.customgrey3,
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 24,
    marginBottom: 5,
  },
  uploadLabel: {
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Medium,
    marginBottom: 2,
  },
  uploadSubLabel: {
    fontSize: 12,
    color: Constants.customgrey,
    fontFamily: FONTS.Regular,
  },
  imagesContainer: {
    marginTop: 10,
  },
  imagesList: {
    paddingBottom: 10,
  },
  imageContainer: {
    position: 'relative',
    margin: 5,
  },
  selectedImage: {
    height: 50,
    width: 50,
    borderRadius: 8,
    resizeMode: 'fill',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Constants.red,
    borderRadius: 15,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  clearAllButton: {
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 5,
  },
  clearAllText: {
    color: Constants.red,
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
});

export default MultiImageCapture;
