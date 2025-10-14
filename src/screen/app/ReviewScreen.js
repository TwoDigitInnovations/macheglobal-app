import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const FONTS = {
  h3: {
    fontSize: 18,
    fontWeight: '600',
  },
  body3: {
    fontSize: 14,
  },
  body4: {
    fontSize: 13,
  },
  body5: {
    fontSize: 12,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
  },
};


const SIZES = {
  // Add any size constants you need
};


const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  primary: '#FF7000', 
  lightGray: '#E0E0E0',
  gray: '#757575',
  danger: '#FF3B30',   
};
import { LoadContext, ToastContext } from '../../../App';
import { Post, ApiFormData, GetApi } from '../../Assets/Helpers/Service';
import { launchImageLibrary } from 'react-native-image-picker';

const ReviewScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useContext(LoadContext);
  const [toast, setToast] = useContext(ToastContext);

  const { orderId, product } = route.params;

  const handleImagePick = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.5,
        selectionLimit: 5 - images.length,
        includeBase64: false,
      };

      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        console.log('User cancelled image picker');
      } else if (result.error) {
        console.log('ImagePicker Error: ', result.error);
        Alert.alert('Error', 'Failed to pick image');
      } else if (result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: `review_${Date.now()}.jpg`,
        }));
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setToast({
        type: 'error',
        message: 'Error selecting image. Please try again.',
        visible: true,
      });
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!review.trim()) {
      setToast({
        type: 'error',
        message: 'Please write your review',
        visible: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      let imageUrls = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: 'image/jpeg',
            name: `review_image_${Date.now()}_${index}.jpg`,
          });
        });

        const uploadResponse = await ApiFormData('upload/review-images', formData);
        if (uploadResponse.success) {
          imageUrls = uploadResponse.data.imageUrls;
        } else {
          throw new Error('Failed to upload images');
        }
      }

      const reviewData = {
        orderId,
        productId: product._id,
        rating,
        description: review,
        images: imageUrls,
      };

      const response = await Post('reviews', reviewData);
      
      if (response.success) {
        setToast({
          type: 'success',
          message: 'Thank you for your review!',
          visible: true,
        });
        navigation.goBack();
      } else {
        throw new Error(response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to submit review. Please try again.',
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 24 }} /> {/* For alignment */}
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 10 }]}>
        <View style={styles.productContainer}>
          <Image 
            source={{ uri: product.images?.[0]?.url || 'https://via.placeholder.com/100' }} 
            style={styles.productImage} 
            resizeMode="cover"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                >
                  <Icon 
                    name={star <= rating ? 'star' : 'star-outline'} 
                    size={28} 
                    color={COLORS.primary} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>
              {rating.toFixed(1)} {rating === 1 ? 'Star' : 'Stars'}
            </Text>
          </View>
        </View>

        <View style={styles.reviewContainer}>
          <Text style={styles.sectionTitle}>Your Review</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience about this product..."
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={5}
            value={review}
            onChangeText={setReview}
          />
        </View>

        <View style={styles.imagesContainer}>
          <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
          <Text style={styles.subtitle}>
            {images.length}/5 photos
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesList}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Icon name="close-circle" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 5 && (
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={handleImagePick}
                disabled={loading}
              >
                <Icon name="camera" size={24} color={COLORS.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...FONTS.h3,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  productContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    ...FONTS.body3,
    fontWeight: '500',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingText: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  reviewContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    ...FONTS.h4,
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.body5,
    color: COLORS.gray,
    marginBottom: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 120,
    ...FONTS.body4,
    color: COLORS.black,
  },
  imagesContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imagesList: {
    flexDirection: 'row',
  },
  imageItem: {
    marginRight: 12,
    position: 'relative',
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  addImageText: {
    ...FONTS.body5,
    color: COLORS.primary,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default ReviewScreen;
