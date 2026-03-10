import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { GetApi } from '../../Assets/Helpers/Service';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import { LoadContext, ToastContext } from '../../../App';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import RenderHtml from 'react-native-render-html';
import { Dimensions } from 'react-native';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useContext(LoadContext);
  const [toast, setToast] = useContext(ToastContext);
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const handleLinkPress = async (event, href) => {
    try {
      // Check if it's an email link
      if (href.startsWith('mailto:')) {
        const supported = await Linking.canOpenURL(href);
        if (supported) {
          await Linking.openURL(href);
        } else {
          Alert.alert(
            t('Email'),
            t('No email app found. Please copy this email: ') + href.replace('mailto:', ''),
            [{ text: t('OK') }]
          );
        }
      } 
      // Check if it's a phone link
      else if (href.startsWith('tel:')) {
        const supported = await Linking.canOpenURL(href);
        if (supported) {
          await Linking.openURL(href);
        } else {
          Alert.alert(
            t('Phone'),
            t('Cannot make calls. Please dial: ') + href.replace('tel:', ''),
            [{ text: t('OK') }]
          );
        }
      }
      // Handle web links
      else if (href.startsWith('http://') || href.startsWith('https://')) {
        const supported = await Linking.canOpenURL(href);
        if (supported) {
          await Linking.openURL(href);
        } else {
          Alert.alert(
            t('Link'),
            t('Cannot open link: ') + href,
            [{ text: t('OK') }]
          );
        }
      }
      // Handle plain email addresses (without mailto:)
      else if (href.includes('@') && href.includes('.')) {
        const mailtoLink = `mailto:${href}`;
        const supported = await Linking.canOpenURL(mailtoLink);
        if (supported) {
          await Linking.openURL(mailtoLink);
        } else {
          Alert.alert(
            t('Email'),
            t('No email app found. Please copy this email: ') + href,
            [{ text: t('OK') }]
          );
        }
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert(
        t('Error'),
        t('Cannot open link'),
        [{ text: t('OK') }]
      );
    }
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await GetApi('user/getContent', {});
      
      console.log('Privacy Policy Response:', response);
      
      if (response && (response.status || response.data)) {
        // Handle different response formats
        const contentData = response.data || response;
        
        if (Array.isArray(contentData) && contentData.length > 0) {
          setContent(contentData[0]);
        } else if (contentData && typeof contentData === 'object') {
          setContent(contentData);
        } else {
          setError('No content available');
        }
      } else {
        setError(response?.message || 'Failed to load content');
      }
    } catch (err) {
      console.error('Error fetching privacy policy:', err);
      setError('Failed to load privacy policy');
      setToast(t('Failed to load content'));
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Constants.saffron} />
          <Text style={styles.loadingText}>{t('Loading...')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchContent}>
            <Text style={styles.retryButtonText}>{t('Retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!content) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t('No content available')}</Text>
        </View>
      );
    }

    // Get HTML content from various possible fields
    let htmlContent = content.policy || content.content || content.description || content.text || '';

    if (!htmlContent) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t('No content available')}</Text>
        </View>
      );
    }

    // Clean up the HTML - remove ALL numbering aggressively
    console.log('Original HTML content:', htmlContent);
    
    // MOST IMPORTANT: Convert <ol> (ordered list) to <div> to remove automatic numbering
    htmlContent = htmlContent.replace(/<ol[^>]*>/g, '<div>');
    htmlContent = htmlContent.replace(/<\/ol>/g, '</div>');
    
    // Remove numbers with dots and spaces (1. 2. 3. etc.)
    htmlContent = htmlContent.replace(/\d+\.\s*/g, '');
    
    // Remove standalone numbers at the beginning of lines
    htmlContent = htmlContent.replace(/^\s*\d+\s*/gm, '');
    
    // Remove numbers after HTML tags
    htmlContent = htmlContent.replace(/(>)\s*\d+\.?\s*/g, '$1');
    
    // Remove numbers before strong tags
    htmlContent = htmlContent.replace(/<strong[^>]*>(\d+\.?\s*)([^<]+)<\/strong>/g, '<strong>$2</strong>');
    htmlContent = htmlContent.replace(/(\d+\.?\s*)<strong/g, '<strong');
    
    // Remove numbers at the start of paragraphs and list items
    htmlContent = htmlContent.replace(/<p[^>]*>(\d+\.?\s*)/g, '<p>');
    htmlContent = htmlContent.replace(/<li[^>]*>(\d+\.?\s*)/g, '<li>');
    
    // Remove any remaining numbers followed by text
    htmlContent = htmlContent.replace(/\b\d+\.?\s+([A-Z])/g, '$1');
    
    // Remove numbers that appear in the middle of content
    htmlContent = htmlContent.replace(/>\s*\d+\.?\s*([A-Z])/g, '>$1');
    
    // Final aggressive cleanup - remove any digit followed by dot and space
    htmlContent = htmlContent.replace(/\d+\.\s+/g, '');
    
    // Remove any remaining standalone digits
    htmlContent = htmlContent.replace(/\b\d{1,2}\b\s*/g, '');
    
    // Super aggressive - remove ALL digits from the content
    htmlContent = htmlContent.replace(/\d+/g, '');
    
    // Remove nested ul/li tags inside ol to avoid bullet points
    htmlContent = htmlContent.replace(/<ul[^>]*>/g, '<div>');
    htmlContent = htmlContent.replace(/<\/ul>/g, '</div>');
    
    // Remove the li tags from nested lists but keep the content
    htmlContent = htmlContent.replace(/<li[^>]*>\s*<p/g, '<p');
    
    console.log('Cleaned HTML content:', htmlContent);

    return (
      <View style={styles.scrollContainer}>
        <ScrollView 
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <RenderHtml
            contentWidth={Dimensions.get('window').width - 40}
            source={{ html: htmlContent }}
            tagsStyles={tagsStyles}
            baseStyle={styles.baseText}
            enableExperimentalMarginCollapsing={true}
            defaultTextProps={{
              selectable: false,
            }}
            renderersProps={{
              a: {
                onPress: handleLinkPress,
              },
            }}
          />
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('Privacy Policy')} showback={true} />
      {renderContent()}
    </SafeAreaView>
  );
};

const tagsStyles = {
  p: {
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    fontFamily: FONTS.Regular,
  },
  strong: {
    fontFamily: FONTS.Bold,
    fontWeight: 'bold',
    color: '#000',
  },
  b: {
    fontFamily: FONTS.Bold,
    fontWeight: 'bold',
    color: '#000',
  },
  h1: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
    fontWeight: 'bold',
    color: Constants.black,
    marginBottom: 16,
    marginTop: 8,
  },
  h2: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    fontWeight: 'bold',
    color: Constants.black,
    marginBottom: 12,
    marginTop: 8,
  },
  h3: {
    fontSize: 18,
    fontFamily: FONTS.Bold,
    fontWeight: 'bold',
    color: Constants.black,
    marginBottom: 10,
    marginTop: 8,
  },
  h4: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    fontWeight: 'bold',
    color: Constants.black,
    marginBottom: 8,
    marginTop: 8,
  },
  ul: {
    marginBottom: 12,
    paddingLeft: 20,
    marginLeft: 0,
  },
  ol: {
    marginBottom: 12,
    paddingLeft: 20,
    marginLeft: 0,
  },
  li: {
    marginBottom: 8,
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    fontFamily: FONTS.Regular,
  },
  a: {
    color: Constants.saffron,
    textDecorationLine: 'underline',
  },
  br: {
    height: 8,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Constants.white,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Constants.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: FONTS.Regular,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.Regular,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Constants.saffron,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    color: Constants.white,
  },
  baseText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    fontFamily: FONTS.Regular,
  },
});

export default PrivacyPolicy;
