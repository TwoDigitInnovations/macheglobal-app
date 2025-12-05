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
import { Post, ApiFormData, GetApi, Delete } from '../../Assets/Helpers/Service';
import { launchImageLibrary } from 'react-native-image-picker';

const ReviewScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useContext(LoadContext);
  const [toast, setToast] = useContext(ToastContext);
  const [existingReviewId, setExistingReviewId] = useState(null);

  const { orderId, product, isUpdate } = route.params;

  // Fetch existing review if in update mode
  React.useEffect(() => {
    if (isUpdate && product._id) {
      fetchExistingReview();
    }
  }, [isUpdate, product._id]);

  const fetchExistingReview = async () => {
    try {
      setLoading(true);
      const response = await GetApi('reviews/me', {});
      
      if (response?.success && response?.data) {
        // Find review for this product
        const existingReview = response.data.find(
          r => (r.product?._id || r.product) === product._id
        );
        
        if (existingReview) {
          console.log('Found existing review:', existingReview);
          setRating(existingReview.rating || 5);
          setReview(existingReview.description || '');
          setExistingReviewId(existingReview._id);
          
          // Load images if available (these are already uploaded to cloudinary)
          if (existingReview.images && existingReview.images.length > 0) {
            const reviewImages = existingReview.images.map((url, index) => ({
              uri: url, // Cloudinary URL for preview
              url: url, // Cloudinary URL
              uploaded: true, // Already uploaded
              name: `review_${index}.jpg`
            }));
            setImages(reviewImages);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching existing review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.7,
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
        // Upload images immediately after selection
        setLoading(true);
        const uploadedImages = [];
        
        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];
          const imageData = {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || `review_${Date.now()}_${i}.jpg`,
            name: asset.fileName || `review_${Date.now()}_${i}.jpg`,
          };
          
          console.log(`Uploading image ${i + 1}/${result.assets.length}...`);
          
          try {
            const uploadResponse = await ApiFormData(imageData);
            console.log('Upload response:', uploadResponse);
            
            if (uploadResponse?.status && uploadResponse?.data?.fileUrl) {
              // Store both the local URI (for preview) and cloudinary URL
              uploadedImages.push({
                uri: asset.uri, // For preview
                url: uploadResponse.data.fileUrl, // Cloudinary URL
                uploaded: true
              });
              console.log(`Image ${i + 1} uploaded successfully`);
            } else {
              console.log(`Image ${i + 1} upload failed`);
              setToast(`Failed to upload image ${i + 1}`);
            }
          } catch (uploadError) {
            console.error(`Error uploading image ${i + 1}:`, uploadError);
            setToast(`Error uploading image ${i + 1}`);
          }
        }
        
        setLoading(false);
        
        if (uploadedImages.length > 0) {
          setImages([...images, ...uploadedImages]);
          setToast(`${uploadedImages.length} image(s) uploaded successfully!`);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setToast('Error selecting image. Please try again.');
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!review.trim()) {
      setToast('Please write your review');
      return;
    }

    try {
      setLoading(true);
      
      console.log('=== Review Submission Debug ===');
      console.log('Is Update Mode:', isUpdate);
      console.log('Existing Review ID:', existingReviewId);
      console.log('Order ID:', orderId);
      console.log('Product:', product);
      console.log('Product ID:', product._id);
      console.log('Rating:', rating);
      console.log('Description:', review);
      console.log('Images already uploaded:', images.length);
      
      // Extract cloudinary URLs from already uploaded images
      const uploadedImageUrls = images
        .filter(img => img.uploaded && img.url)
        .map(img => img.url);
      
      console.log('Image URLs to submit:', uploadedImageUrls);
      
      // If updating, delete the old review first
      if (isUpdate && existingReviewId) {
        console.log('Deleting existing review:', existingReviewId);
        try {
          await Delete(`user/deleteReview/${existingReviewId}`, {});
          console.log('Old review deleted successfully');
        } catch (deleteError) {
          console.error('Error deleting old review:', deleteError);
          // Continue anyway to create new review
        }
      }
      
      // Create new review (or first-time review)
      const reviewData = {
        orderId: orderId,
        productId: product._id,
        rating: rating,
        description: review,
        images: uploadedImageUrls,
      };

      console.log('Submitting review data:', JSON.stringify(reviewData, null, 2));
      const response = await Post('reviews', reviewData);
      
      console.log('Review response:', JSON.stringify(response, null, 2));
      
      if (response?.success === true) {
        setToast(isUpdate ? 'Review updated successfully!' : 'Thank you for your review!');
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } else {
        // Show more detailed error
        const errorMsg = response?.message || response?.error || 'Failed to submit review';
        console.error('Review submission failed:', errorMsg);
        setToast(errorMsg);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setToast(error.message || 'Failed to submit review. Please try again.');
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
        <Text style={styles.headerTitle}>
          {isUpdate ? 'Update Review' : 'Write a Review'}
        </Text>
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
            {loading 
              ? (isUpdate ? 'Updating...' : 'Submitting...') 
              : (isUpdate ? 'Update Review' : 'Submit Review')}
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
