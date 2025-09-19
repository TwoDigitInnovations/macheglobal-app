import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import Constants, {FONTS} from '../Helpers/constant';

const ImageUpload = ({onImageUpload, style}) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const selectImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        setSelectedImage(imageUri);
        if (onImageUpload) {
          onImageUpload(imageUri);
        }
      }
    });
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.uploadButton} onPress={selectImage}>
        {selectedImage ? (
          <Image source={{uri: selectedImage}} style={styles.selectedImage} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.uploadText}>📷</Text>
            <Text style={styles.uploadLabel}>Upload Image</Text>
          </View>
        )}
      </TouchableOpacity>
      {selectedImage && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            setSelectedImage(null);
            if (onImageUpload) {
              onImageUpload(null);
            }
          }}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
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
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 30,
    marginBottom: 5,
  },
  uploadLabel: {
    fontSize: 16,
    color: Constants.customgrey,
    fontFamily: FONTS.Regular,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  removeButton: {
    backgroundColor: Constants.red,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 10,
  },
  removeText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
});

export default ImageUpload;
