import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Platform,
  AppState,
} from 'react-native';
import { Post } from '../Helpers/Service';
import Constants from '../Helpers/constant';
import { useTranslation } from 'react-i18next';
const InAppBrowser = require('react-native-inappbrowser-reborn');

const StripeCheckoutButton = ({
  customerData,
  cartData,
  orderData,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  triggerCheckout = false,
  pickupType,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [paymentTimeout, setPaymentTimeout] = useState(null);

  // Platform-specific deep link handler
  const handleDeepLink = useCallback((url) => {
    console.log('Processing deep link:', url);
    if (!url) {
      return;
    }

    if (url.includes('payment-success')) {
      InAppBrowser.InAppBrowser.close()
      console.log('Payment success detected via deep link');
      handlePaymentSuccess(url);
    } else if (url.includes('payment-cancel')) {
      InAppBrowser.InAppBrowser.close()
      console.log('Payment cancel detected via deep link');
      handlePaymentCancel();
    }
  }, [handlePaymentSuccess, handlePaymentCancel]);

  useEffect(() => {
    if (triggerCheckout && !loading) {
      handleStripeCheckout();
    }
  }, [triggerCheckout, loading, handleStripeCheckout]);

  useEffect(() => {
    return () => {
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
      }
    };
  }, [paymentTimeout]);

  const handlePaymentSuccess = useCallback(
    async url => {
      try {
        setLoading(true);
        setIsListening(false);

        if (paymentTimeout) {
          clearTimeout(paymentTimeout);
          setPaymentTimeout(null);
        }

        const sessionId = url.split('session_id=')[1];

        if (!sessionId) {
          throw new Error('No session ID found in success URL');
        }

        console.log(
          'Payment successful, retrieving session details:',
          sessionId,
        );

        const sessionResponse = await Post('retrieve-checkout-session', {
          session_id: sessionId,
        });

        if (sessionResponse?.error) {
          throw new Error(sessionResponse.error);
        }

        const paymentResult = {
          id: sessionResponse.payment_intent || sessionId,
          paymentId: sessionResponse.payment_intent,
          paymentIntentId: sessionResponse.payment_intent,
          sessionId: sessionId,
          total: sessionResponse.amount_total
            ? sessionResponse.amount_total / 100
            : 0,
          subtotal: sessionResponse.amount_subtotal
            ? sessionResponse.amount_subtotal / 100
            : 0,
          tax: sessionResponse.total_details?.amount_tax
            ? sessionResponse.total_details.amount_tax / 100
            : 0,
          // Delivery tip now included as a line item
          deliveryTip: sessionResponse.delivery_tip?.amount || 0,
          tipIncludedInSubtotal:
            sessionResponse.delivery_tip?.included_in_subtotal || true,
          tipTaxable: sessionResponse.delivery_tip?.taxable || true,
          tipLineItemId: sessionResponse.delivery_tip?.line_item_id || null,
          // Line items breakdown
          lineItemsBreakdown: sessionResponse.line_items_breakdown || [],
          currency: sessionResponse.currency || 'usd',
          status: 'succeeded',
          created: new Date().toISOString(),
          taxBreakdown: sessionResponse.total_details?.breakdown?.taxes || [],
        };

        console.log('Payment completed with tip as line item:', {
          total: paymentResult.total,
          subtotal: paymentResult.subtotal,
          tax: paymentResult.tax,
          deliveryTip: paymentResult.deliveryTip,
          tipIncludedInSubtotal: paymentResult.tipIncludedInSubtotal,
          tipTaxable: paymentResult.tipTaxable,
          lineItemsBreakdown: paymentResult.lineItemsBreakdown,
          sessionId: paymentResult.sessionId,
        });

        setLoading(false);
        onPaymentSuccess && onPaymentSuccess(paymentResult);
      } catch (error) {
        console.error('Failed to process payment success:', error);
        setLoading(false);
        onPaymentError && onPaymentError(error);
      }
    },
    [onPaymentSuccess, onPaymentError, paymentTimeout],
  );

  const handlePaymentCancel = useCallback(() => {
    console.log('User cancelled Stripe Checkout');
    setLoading(false);
    setIsListening(false);

    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }

    onPaymentCancel && onPaymentCancel();
  }, [onPaymentCancel, paymentTimeout]);

  useEffect(() => {
    if (isListening) {
      const handleUrlChange = event => {
        console.log('URL changed:', event.url);
        handleDeepLink(event.url);
      };

      // For iOS, we need to check for initial URL on app launch/resume
      const checkInitialUrl = async () => {
        try {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            console.log('Initial URL detected:', initialUrl);
            handleDeepLink(initialUrl);
          }
        } catch (error) {
          console.log('Error getting initial URL:', error);
        }
      };

      // iOS specific: Handle app state changes for better deep linking
      const handleAppStateChange = (nextAppState) => {
        if (Platform.OS === 'ios' && nextAppState === 'active') {
          console.log('App became active, checking for pending URL');
          // Small delay to ensure URL is processed
          setTimeout(checkInitialUrl, 100);
        }
      };

      checkInitialUrl();
      const subscription = Linking.addEventListener('url', handleUrlChange);
      const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        subscription?.remove();
        appStateSubscription?.remove();
        setIsListening(false);
      };
    }
  }, [isListening, handleDeepLink]);

  const handleStripeCheckout = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Starting Stripe Checkout with automatic tax calculation...');

      const lineItems = cartData.map(item => {
        // Determine if item should be tax-exempt
        const isTaxExempt =
          item.tax_exempt === true ||
          item.tax_exempt === 'true' ||
          item.taxable === false ||
          item.taxable === 'false' ||
          item.tax_code === 'txcd_00000000'; // Non-taxable tax code

        // Use appropriate tax code based on item's tax status
        let taxCode = item.tax_code;
        if (!taxCode) {
          // Default tax codes
          taxCode = isTaxExempt ? 'txcd_00000000' : 'txcd_10000000';
        }

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.productname,
              metadata: {
                productId: item.productid,
                barcode: item.BarCode || '',
                taxExempt: isTaxExempt.toString(),
              },
              tax_code: taxCode,
            },
            unit_amount: Math.round(parseFloat(item.price) * 100),
            tax_behavior: isTaxExempt ? 'inclusive' : 'exclusive',
          },
          quantity: item.quantity,
        };
      });

      // Handle coupon discount - pass to backend for proper handling
      let discountInfo = null;
      if (orderData?.couponDiscount && orderData.couponDiscount !== 0) {
        // Handle both positive and negative discount values
        const discountAmount = Math.abs(parseFloat(orderData.couponDiscount));
        console.log('Coupon discount detected:', {
          originalValue: orderData.couponDiscount,
          discountAmount: discountAmount,
          couponCode: orderData?.discountCode || 'Unknown',
        });

        discountInfo = {
          amount: discountAmount,
          code: orderData?.discountCode || '',
          type: 'coupon_discount',
        };
      }

      const deliveryTip =
        orderData?.deliveryTip && orderData.deliveryTip > 0
          ? parseFloat(orderData.deliveryTip)
          : 0;

      const deliveryAddress = orderData?.deliveryAddress || {};
      const currentPickupType = pickupType || orderData?.pickupType || '';
      const isPickupOrder =
        currentPickupType === 'orderPickup' || currentPickupType === 'driveUp';

      const storeLocation = {
        line1: '11360 Bellaire Blvd Suite 700',
        city: 'Houston',
        state: 'TX',
        postal_code: '77072',
        country: 'US',
      };

      const checkoutData = {
        line_items: lineItems,
        customer_email: customerData?.email || '',
        customer_creation: 'always',
        metadata: {
          userId: customerData?.userId || '',
          pickupType: currentPickupType,
          deliveryDate: orderData?.deliveryDate || '',
          orderId: `ORDER_${Date.now()}`,
          subtotal: orderData?.subtotal?.toString() || '0',
          couponDiscount: Math.abs(
            parseFloat(orderData?.couponDiscount || 0),
          ).toString(),
          deliveryTip: deliveryTip.toString(),
          customerName: customerData?.name || '',
          customerPhone: customerData?.phone || '',
          isPickupOrder: isPickupOrder.toString(),
          storeLocation: isPickupOrder ? JSON.stringify(storeLocation) : '',
          couponCode: orderData?.couponCode || '',
          // Add discount info for backend processing
          hasDiscount: discountInfo ? 'true' : 'false',
          discountAmount: discountInfo?.amount?.toString() || '0',
          discountCode: discountInfo?.code || '',
        },
        // Enable promotion codes and let backend handle the discount
        allow_promotion_codes: true,
        automatic_tax: {
          enabled: true,
        },
        billing_address_collection: 'auto',
        customer_update: {
          shipping: 'auto',
        },
        ...(isPickupOrder
          ? {}
          : {
            shipping_address_collection: {
              allowed_countries: ['US'],
            },
            shipping_options: [
              {
                shipping_rate_data: {
                  type: 'fixed_amount',
                  fixed_amount: {
                    amount: Math.round(
                      parseFloat(orderData?.deliveryFee || 0) * 100,
                    ),
                    currency: 'usd',
                  },
                  display_name: 'Delivery',
                  tax_behavior: 'exclusive',
                  tax_code: 'txcd_92010001',
                  // delivery_estimate: {
                  //   minimum: {
                  //     unit: 'hour',
                  //     value: 1,
                  //   },
                  //   maximum: {
                  //     unit: 'hour',
                  //     value: 3,
                  //   },
                  // },
                  metadata: {
                    type: 'delivery time may vary based on location',
                  },
                },
              },
            ],
          }),
        customer_data: {
          name: customerData?.name || '',
          email: customerData?.email || '',
          phone: customerData?.phone || '',
          address: isPickupOrder
            ? storeLocation
            : {
              line1:
                deliveryAddress.address ||
                deliveryAddress.line1 ||
                '',
              line2:
                deliveryAddress.ApartmentNo || deliveryAddress.line2 || '',
              city: deliveryAddress.city || '',
              state: deliveryAddress.state || '',
              postal_code:
                deliveryAddress.zipcode ||
                deliveryAddress.postal_code ||
                '',
              country: 'US',
            },
        },
        success_url:
          'groceryapp://payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'groceryapp://payment-cancel',
        mode: 'payment',
        payment_method_types: ['card'],
      };

      Object.keys(checkoutData).forEach(key => {
        if (
          checkoutData[key] === null ||
          checkoutData[key] === undefined ||
          checkoutData[key] === ''
        ) {
          delete checkoutData[key];
        }
      });

      console.log(
        'Creating Stripe Checkout session with pre-filled customer data...',
      );
      console.log(
        'Pickup Type:',
        currentPickupType,
        '| Is Pickup Order:',
        isPickupOrder,
      );
      console.log(
        'Delivery Tip (backend will add as line item with tax code):',
        deliveryTip > 0 ? `$${deliveryTip}` : 'None',
      );
      console.log(
        'Coupon Discount:',
        discountInfo
          ? `$${discountInfo.amount} (${discountInfo.code})`
          : 'None',
      );
      console.log(
        'Line items (products only, discount handled by backend):',
        JSON.stringify(
          lineItems.map(item => ({
            name: item.price_data?.product_data?.name,
            amount: item.price_data?.unit_amount,
            tax_behavior: item.price_data?.tax_behavior,
            tax_code: item.price_data?.product_data?.tax_code,
            tax_exempt: item.price_data?.product_data?.metadata?.taxExempt,
            type: item.price_data?.product_data?.metadata?.type || 'product',
          })),
          null,
          2,
        ),
      );
      console.log('Pre-filled customer email:', checkoutData.customer_email);
      console.log('Customer data for backend:', checkoutData.customer_data);
      if (isPickupOrder) {
        console.log('Using store location for tax calculation:', storeLocation);
      } else {
        console.log(
          'Using delivery address for tax calculation:',
          checkoutData.customer_data.address,
        );
      }
      console.log('Automatic tax enabled:', checkoutData.automatic_tax);
      console.log('Customer update config:', checkoutData.customer_update);
      if (isPickupOrder) {
        console.log(
          'Pickup order - no shipping options, tax calculated at store location',
        );
      } else {
        console.log(
          'Delivery order - shipping options with tax codes:',
          JSON.stringify(
            checkoutData.shipping_options?.map(option => ({
              display_name: option.shipping_rate_data?.display_name,
              amount: option.shipping_rate_data?.fixed_amount?.amount,
              tax_behavior: option.shipping_rate_data?.tax_behavior,
              tax_code: option.shipping_rate_data?.tax_code,
            })),
            null,
            2,
          ),
        );
      }

      console.log(
        'Final Checkout Payload (send this to backend):',
        JSON.stringify(checkoutData, null, 2),
      );

      const response = await Post('create-checkout-session', checkoutData);

      if (response?.error) {
        throw new Error(response.error);
      }

      if (!response?.url) {
        Alert.alert(
          t('Payment Setup Required'),
          t('Stripe Checkout is not configured yet. Please contact support.'),
          [
            {
              text: t('OK'),
              onPress: () => {
                setLoading(false);
                onPaymentCancel && onPaymentCancel();
              },
            },
          ],
        );
        return;
      }

      console.log('Opening Stripe Checkout URL:', response.url);
      setIsListening(true);

      const timeout = setTimeout(() => {
        console.log('Payment timeout - auto-cancelling');
        handlePaymentCancel();
      }, 5 * 60 * 1000);
      setPaymentTimeout(timeout);

      if (await InAppBrowser.InAppBrowser.isAvailable()) {
        // Platform-specific configuration for better iOS compatibility
        const browserOptions = {
          dismissButtonStyle: 'close',
          preferredBarTintColor: '#fff',
          preferredControlTintColor: '#000',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          enableUrlBarHiding: false,
          enableDefaultShare: false,
          forceCloseOnRedirection: false,
          showTitle: true,
          toolbarColor: '#fff',
          secondaryToolbarColor: '#000',
          navigationBarColor: '#fff',
          navigationBarDividerColor: '#000',
          hasBackButton: true,
          browserPackage: '', // Let the system choose
          showInRecents: false,
          // iOS specific: Add headers for better app switching
          headers: Platform.OS === 'ios' ? {
            'X-App-Redirect': 'groceryapp',
            'X-Payment-Flow': 'stripe-checkout',
          } : {},
        };

        console.log('Opening InAppBrowser with options:', browserOptions);

        try {
          const result = await InAppBrowser.InAppBrowser.open(response.url, browserOptions);
          console.log('InAppBrowser result:', result);

          if (result.type === 'cancel' || result.type === 'dismiss') {
            console.log('InAppBrowser was closed/dismissed');
            handlePaymentCancel();
          }
        } catch (browserError) {
          console.log('InAppBrowser failed, falling back to system browser:', browserError);
          // Fallback to system browser if InAppBrowser fails
          const supported = await Linking.canOpenURL(response.url);
          if (supported) {
            await Linking.openURL(response.url);
          } else {
            throw new Error('Cannot open Stripe Checkout URL');
          }
        }
      } else {
        console.log('InAppBrowser not available, using system browser');
        const supported = await Linking.canOpenURL(response.url);
        if (supported) {
          await Linking.openURL(response.url);
        } else {
          throw new Error('Cannot open Stripe Checkout URL');
        }
      }
    } catch (error) {
      console.error('Stripe Checkout failed:', error);
      setLoading(false);
      setIsListening(false);

      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
        setPaymentTimeout(null);
      }

      if (
        error.message.includes('404') ||
        error.message.includes('not found')
      ) {
        Alert.alert(
          t('Payment Setup Required'),
          t(
            'The payment system backend is not configured. Please set up the payment backend first.',
          ),
          [
            {
              text: t('OK'),
              onPress: () => onPaymentCancel && onPaymentCancel(),
            },
          ],
        );
      } else {
        console.error('Stripe Checkout error:', error);
        onPaymentError && onPaymentError(error);
      }
    }
  }, [
    cartData,
    orderData,
    customerData,
    pickupType,
    t,
    onPaymentError,
    onPaymentCancel,
    handlePaymentCancel,
    paymentTimeout,
  ]);

  return (
    <View style={styles.hiddenContainer}>
      <TouchableOpacity
        onPress={handleStripeCheckout}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>{t('Pay with Stripe Checkout')}</Text>
        )}
      </TouchableOpacity>
      {loading && (
        <Text style={styles.loadingText}>
          {t('Opening Stripe Checkout...')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  hiddenContainer: {
    opacity: 0,
    height: 0,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: Constants.pink,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: Constants.customgrey,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: Constants.customgrey,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default StripeCheckoutButton;
