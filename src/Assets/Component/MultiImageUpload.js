import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import Constants, {FONTS} from '../Helpers/constant';
import { useTranslation } from 'react-i18next';

const MultiImageUpload = ({onImagesUpload, maxImages = 6, style}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const {t} = useTranslation();

  const selectImage = () => {
    if (selectedImages.length >= maxImages) {
      Alert.alert(
        'Limit Reached',
        `You can only upload up to ${maxImages} images`,
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      selectionLimit: maxImages - selectedImages.length, // Allow multiple selection
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets) {
        const newImages = response.assets.map(asset => asset.uri);
        const updatedImages = [...selectedImages, ...newImages].slice(
          0,
          maxImages,
        );
        setSelectedImages(updatedImages);
        if (onImagesUpload) {
          onImagesUpload(updatedImages);
        }
      }
    });
  };

  const removeImage = index => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
    if (onImagesUpload) {
      onImagesUpload(updatedImages);
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
            {t("Upload Images")} ({selectedImages.length}/{maxImages})
          </Text>
          <Text style={styles.uploadSubLabel}>
            Tap to add {selectedImages.length === 0 ? 'images' : 'more images'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Selected Images Grid */}
      {selectedImages.length > 0 && (
        <View style={styles.imagesContainer}>
          <FlatList
            data={selectedImages}
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

export default MultiImageUpload;
