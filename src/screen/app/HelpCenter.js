import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BackIcon } from '../../../Theme';
import { Post } from '../../Assets/Helpers/Service';
import { useTranslation } from 'react-i18next';

// InputField component ko bahar define karo
const InputField = ({ label, value, onChangeText, placeholder, error, multiline = false, numberOfLines = 1, keyboardType = 'default' }) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          error && styles.inputError
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const HelpCenter = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    Email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('Name is required');
    if (!formData.Email.trim()) {
      newErrors.Email = t('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.Email)) {
      newErrors.Email = t('Please enter a valid email');
    }
    if (!formData.subject.trim()) newErrors.subject = t('Subject is required');
    if (!formData.message.trim()) newErrors.message = t('Message is required');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // useCallback se functions ko memoize karo
  const handleInputChange = useCallback((name, text) => {
    setFormData(prev => ({
      ...prev,
      [name]: text
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await Post('user/contactUs', formData);
      
      if (response && response.status) {
        setShowSuccessModal(true);
        setFormData({
          name: '',
          Email: '',
          subject: '',
          message: ''
        });
        // Hide the modal after 2 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      } else {
        Alert.alert(t('Error'), response?.message || t('Something went wrong. Please try again.'));
      }
    } catch (error) {
      console.error('Contact us error:', error);
      Alert.alert(t('Error'), t('Failed to send message. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon height={20} width={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Help Center')}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{t('How can we help you?')}</Text>
          <Text style={styles.subtitle}>
            {t("We're here to help and answer any question you might have. Fill out the form and we'll be in touch as soon as possible.")}
          </Text>

          <InputField
            label={t('Full Name')}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder={t('Enter your full name')}
            error={errors.name}
          />

          <InputField
            label={t('Email')}
            value={formData.Email}
            onChangeText={(text) => handleInputChange('Email', text)}
            placeholder={t('Enter your email')}
            error={errors.Email}
            keyboardType="email-address"
          />

          <InputField
            label={t('Subject')}
            value={formData.subject}
            onChangeText={(text) => handleInputChange('subject', text)}
            placeholder={t('Enter subject')}
            error={errors.subject}
          />

          <InputField
            label={t('Message')}
            value={formData.message}
            onChangeText={(text) => handleInputChange('message', text)}
            placeholder={t('Type your message here...')}
            error={errors.message}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{t('Send Message')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>{t('Contact Information')}</Text>
          <Text style={styles.contactText}>
            {t('Email')}: support@macheglobal.com
          </Text>
          <Text style={styles.contactText}>
            {t('Phone')}: +1 (555) 123-4567
          </Text>
          <Text style={styles.contactText}>
            {t('Address')}: 123 Market Street, City, Country
          </Text>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{t('Message sent successfully!')}</Text>
            <Text style={styles.modalSubtext}>{t("We'll get back to you soon.")}</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FF7000',
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#FF7000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 30,
    marginHorizontal: 10,
    width: '100%',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D283A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
});

export default HelpCenter;