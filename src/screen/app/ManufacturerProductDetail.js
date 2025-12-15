/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { BackIcon } from '../../../Theme';
import { goBack, navigate } from '../../../navigationRef';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { GetApi } from '../../Assets/Helpers/Service';
import { LoadContext } from '../../../App';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ManufacturerProductDetail = ({ route }) => {
  const { t } = useTranslation();
  const { productId } = route.params;
  const [loading, setLoading] = useContext(LoadContext);
  const [product, setProduct] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const predefinedQuestions = [
    t('What is the best price you can offer?'),
    t('What is the shipping cost?'),
    t('Can I customize this product with my logo?'),
  ];

  useEffect(() => {
    getProductDetails();
  }, []);

  const getProductDetails = async () => {
    try {
      setLoading(true);
      const res = await GetApi(`product/getProductById/${productId}`, {});
      setLoading(false);
      if (res?.status || res?.data) {
        setProduct(res.data || res);
      }
    } catch (err) {
      setLoading(false);
      console.log('Error fetching product details:', err);
    }
  };

  const toggleQuestion = (question) => {
    if (selectedQuestions.includes(question)) {
      setSelectedQuestions(selectedQuestions.filter(q => q !== question));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  const handleSendInquiry = async () => {
    if (selectedQuestions.length === 0 && !customMessage.trim()) {
      return;
    }

    const userDetail = await AsyncStorage.getItem('userDetail');
    if (!userDetail) {
      // Navigate to login
      navigate('Login');
      return;
    }

    // Combine selected questions and custom message
    let finalMessage = '';
    if (selectedQuestions.length > 0) {
      finalMessage = selectedQuestions.join('\n');
    }
    if (customMessage.trim()) {
      finalMessage += (finalMessage ? '\n\n' : '') + customMessage.trim();
    }

    // Navigate to ChatRoom with product info and message
    navigate('ChatRoom', {
      sellerId: product?.SellerId?._id || product?.SellerId,
      sellerName: product?.SellerId?.name || 'Seller',
      sellerImage: product?.SellerId?.image || '',
      productId: product?._id,
      productImage: images[currentImageIndex] || images[0],
      productName: product?.name,
      productPrice: product?.varients?.[0]?.selected?.[0]?.offerprice || product?.varients?.[0]?.selected?.[0]?.price,
      initialMessage: finalMessage,
    });

    setShowInquiryModal(false);
    setSelectedQuestions([]);
    setCustomMessage('');
  };

  const handleChatNow = async () => {
    const userDetail = await AsyncStorage.getItem('userDetail');
    if (!userDetail) {
      navigate('Login');
      return;
    }

    navigate('ChatRoom', {
      sellerId: product?.SellerId?._id || product?.SellerId,
      sellerName: product?.SellerId?.name || 'Seller',
      sellerImage: product?.SellerId?.image || '',
      productId: product?._id,
      productImage: images[currentImageIndex] || images[0],
      productName: product?.name,
      productPrice: product?.varients?.[0]?.selected?.[0]?.offerprice || product?.varients?.[0]?.selected?.[0]?.price,
    });
  };

  if (!product) {
    return null;
  }

  const images = product?.varients?.[0]?.image || [];
  const price = product?.varients?.[0]?.selected?.[0]?.offerprice || 
                product?.varients?.[0]?.selected?.[0]?.price || 0;
  const quantity = product?.pieces || 0;

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const screenWidth = Dimensions.get('window').width;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentImageIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <BackIcon height={24} width={24} color={Constants.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{product?.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Product Images Carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            snapToInterval={Dimensions.get('window').width}
            decelerationRate="fast"
            keyExtractor={(item, index) => `image-${index}`}
            renderItem={({ item }) => (
              <View style={styles.imageSlide}>
                <Image
                  source={{ uri: item }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />
          
          {/* Image Indicator Dots */}
          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentImageIndex && styles.activeDot
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product?.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('Price')}:</Text>
            <Text style={styles.price}>{Currency} {price.toFixed(2)}</Text>
          </View>

          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>{t('Available Quantity')}:</Text>
            <Text style={styles.quantity}>{quantity} {t('pieces')}</Text>
          </View>

          {/* View Details Link - Simple underlined text */}
          <TouchableOpacity
            style={styles.viewDetailsLink}
            onPress={() => navigate('Preview', product?.slug || product?._id)}>
            <Text style={styles.viewDetailsText}>{t('View Full Details')}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Buttons - Inside ScrollView for visibility */}
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleChatNow}>
            <Text style={styles.chatButtonText}>{t('Chat now')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.inquiryButton}
            onPress={() => setShowInquiryModal(true)}>
            <Text style={styles.inquiryButtonText}>{t('Send inquiry')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Inquiry Modal */}
      <Modal
        visible={showInquiryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInquiryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Send Inquiry')}</Text>
              <TouchableOpacity onPress={() => setShowInquiryModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Product Preview in Modal */}
            <View style={styles.modalProductPreview}>
              <View style={styles.modalImageContainer}>
                <Image
                  source={{ uri: images[currentImageIndex] || images[0] }}
                  style={styles.modalProductImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.modalProductInfo}>
                <Text style={styles.modalProductName} numberOfLines={2}>
                  {product?.name}
                </Text>
                <Text style={styles.modalProductPrice}>
                  {Currency} {price.toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={styles.questionsLabel}>{t('Select questions')}:</Text>

            {/* Predefined Questions */}
            {predefinedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.questionOption,
                  selectedQuestions.includes(question) && styles.questionOptionSelected
                ]}
                onPress={() => toggleQuestion(question)}>
                <View style={[
                  styles.checkbox,
                  selectedQuestions.includes(question) && styles.checkboxSelected
                ]}>
                  {selectedQuestions.includes(question) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[
                  styles.questionText,
                  selectedQuestions.includes(question) && styles.questionTextSelected
                ]}>
                  {question}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Custom Message Input */}
            <Text style={styles.customMessageLabel}>{t('Additional message')} ({t('optional')}):</Text>
            <TextInput
              style={styles.customMessageInput}
              placeholder={t('Type your message here...')}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={customMessage}
              onChangeText={setCustomMessage}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (selectedQuestions.length === 0 && !customMessage.trim()) && styles.submitButtonDisabled
              ]}
              onPress={handleSendInquiry}
              disabled={selectedQuestions.length === 0 && !customMessage.trim()}>
              <Text style={styles.submitButtonText}>{t('Send Inquiry')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ManufacturerProductDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  header: {
    backgroundColor: Constants.saffron,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.Bold,
    color: Constants.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: Constants.white,
    height: 340,
    position: 'relative',
  },
  imageSlide: {
    width: Dimensions.get('window').width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  productImage: {
    width: Dimensions.get('window').width - 40,
    height: 300,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCC',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Constants.saffron,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoContainer: {
    backgroundColor: Constants.white,
    marginTop: 10,
    padding: 20,
  },
  productName: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    color: Constants.black,
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: '#666',
    marginRight: 10,
  },
  price: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
    color: Constants.saffron,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quantityLabel: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: '#666',
    marginRight: 10,
  },
  quantity: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    color: Constants.black,
  },
  viewDetailsLink: {
    marginTop: 8,
    paddingVertical: 5,
  },
  viewDetailsText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: Constants.saffron,
    textDecorationLine: 'underline',
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    gap: 12,
  },
  chatButton: {
    flex: 1,
    backgroundColor: Constants.white,
    borderWidth: 1.5,
    borderColor: Constants.saffron,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 15,
    fontFamily: FONTS.Bold,
    color: Constants.saffron,
  },
  inquiryButton: {
    flex: 1,
    backgroundColor: Constants.saffron,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  inquiryButtonText: {
    fontSize: 15,
    fontFamily: FONTS.Bold,
    color: Constants.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Constants.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    color: Constants.black,
  },
  closeButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  modalProductPreview: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalProductImage: {
    width: '100%',
    height: '100%',
  },
  modalProductInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  modalProductName: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: Constants.black,
    marginBottom: 4,
  },
  modalProductPrice: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    color: Constants.saffron,
  },
  questionsLabel: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    color: Constants.black,
    marginBottom: 12,
  },
  questionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  questionOptionSelected: {
    backgroundColor: '#FFF5F0',
    borderColor: Constants.saffron,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Constants.saffron,
    borderColor: Constants.saffron,
  },
  checkmark: {
    color: Constants.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.Regular,
    color: '#333',
  },
  questionTextSelected: {
    fontFamily: FONTS.Medium,
    color: Constants.black,
  },
  customMessageLabel: {
    fontSize: 14,
    fontFamily: FONTS.Bold,
    color: Constants.black,
    marginTop: 15,
    marginBottom: 8,
  },
  customMessageInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: FONTS.Regular,
    color: Constants.black,
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  submitButton: {
    backgroundColor: Constants.saffron,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    color: Constants.white,
  },
});
