/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { goBack } from '../../../navigationRef';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { GetApi } from '../../Assets/Helpers/Service';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { Copy, Check } from 'lucide-react-native';
import { Clipboard } from 'react-native';

const Coupons = () => {
  const { t } = useTranslation();
  const [mainTab, setMainTab] = useState('coupons'); // 'coupons' or 'credit'
  const [activeTab, setActiveTab] = useState('available');
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditTransactions, setCreditTransactions] = useState([]);

  useEffect(() => {
    if (mainTab === 'coupons') {
      getCoupons();
    } else {
      getCreditData();
    }
  }, [activeTab, mainTab]);

  const getCoupons = async () => {
    try {
      setLoading(true);
      const res = await GetApi(`coupon/getUserCoupons?status=${activeTab}`, {});
      console.log("cop====", res)
      setLoading(false);
      if (res?.status) {
        setCoupons(res.data);
      }
    } catch (err) {
      setLoading(false);
      console.log('Error fetching coupons:', err);
    }
  };

  const getCreditData = async () => {
    try {
      setLoading(true);
      const [balanceRes, transactionsRes] = await Promise.all([
        GetApi('credit/balance', {}),
        GetApi('credit/transactions?page=1&limit=20', {})
      ]);
      
      if (balanceRes?.success) {
        setCreditBalance(balanceRes.data.creditBalance || 0);
      }
      
      if (transactionsRes?.success) {
        setCreditTransactions(transactionsRes.data || []);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.log('Error fetching credit data:', err);
    }
  };

  const handleCopy = (code) => {
    try {
      Clipboard.setString(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.log('Clipboard not available:', error);
      // Fallback: just show copied state
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const renderCoupon = ({ item }) => {
    const isExpired = new Date(item.endDate) < new Date();
    const isUsed = activeTab === 'used';
    const canUse = item.canUse && !isExpired && !isUsed;

    return (
      <View style={[styles.couponCard, !canUse && styles.couponCardDisabled]}>
        {/* Coupon Header */}
        <View style={styles.couponHeader}>
          <View style={styles.couponLeft}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {item.discountType === 'percentage'
                  ? `${item.discountValue}%`
                  : `${Currency}${item.discountValue}`}
              </Text>
              <Text style={styles.offText}>{t('OFF')}</Text>
            </View>
          </View>

          <View style={styles.couponRight}>
            <View style={styles.codeContainer}>
              <Text style={styles.couponCode}>{item.code}</Text>
              <TouchableOpacity
                onPress={() => handleCopy(item.code)}
                style={styles.copyButton}>
                {copiedCode === item.code ? (
                  <Check size={18} color={Constants.saffron} />
                ) : (
                  <Copy size={18} color={Constants.saffron} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.couponDescription} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Status Badge */}
            {isExpired && (
              <View style={[styles.statusBadge, styles.expiredBadge]}>
                <Text style={styles.statusText}>{t('Expired')}</Text>
              </View>
            )}
            {isUsed && !isExpired && (
              <View style={[styles.statusBadge, styles.usedBadge]}>
                <Text style={styles.statusText}>{t('Used')}</Text>
              </View>
            )}
            {!canUse && !isExpired && !isUsed && (
              <View style={[styles.statusBadge, styles.limitBadge]}>
                <Text style={styles.statusText}>{t('Limit Reached')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Coupon Details */}
        <View style={styles.couponDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('Min Order')}:</Text>
            <Text style={styles.detailValue}>
              {Currency} {item.minOrderAmount}
            </Text>
          </View>

          {item.maxDiscountAmount && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('Max Discount')}:</Text>
              <Text style={styles.detailValue}>
                {Currency} {item.maxDiscountAmount}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('Valid Until')}:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.endDate).toLocaleDateString()}
            </Text>
          </View>

          {activeTab === 'used' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('Used')}:</Text>
              <Text style={styles.detailValue}>
                {item.userUsageCount} / {item.userUsageLimit}
              </Text>
            </View>
          )}
        </View>

        {/* Dashed Border Effect */}
        <View style={styles.dashedBorder} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Tabs */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={Constants.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Coupons & Credit')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Main Tabs inside Header */}
        <View style={styles.headerTabsContainer}>
          <TouchableOpacity
            style={styles.headerTab}
            onPress={() => setMainTab('coupons')}>
            <Text
              style={[
                styles.headerTabText,
                mainTab === 'coupons' && styles.activeHeaderTabText,
              ]}>
              {t('Coupons')}
            </Text>
            {mainTab === 'coupons' && <View style={styles.headerTabUnderline} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerTab}
            onPress={() => setMainTab('credit')}>
            <Text
              style={[
                styles.headerTabText,
                mainTab === 'credit' && styles.activeHeaderTabText,
              ]}>
              {t('Credit')}
            </Text>
            {mainTab === 'credit' && <View style={styles.headerTabUnderline} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub Tabs - Only show for coupons */}
      {mainTab === 'coupons' && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'available' && styles.activeTabText,
              ]}>
              {t('Available')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'used' && styles.activeTab]}
            onPress={() => setActiveTab('used')}>
            <Text
              style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}>
              {t('Used')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'expired' && styles.activeTab]}
            onPress={() => setActiveTab('expired')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'expired' && styles.activeTabText,
              ]}>
              {t('Expired')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.saffron} />
        </View>
      ) : mainTab === 'coupons' ? (
        <FlatList
          data={coupons}
          keyExtractor={(item) => item._id}
          renderItem={renderCoupon}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎟️</Text>
              <Text style={styles.emptyText}>
                {t('You currently have no coupons available')}
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}>
          {/* Credit Balance Card */}
          <View style={styles.creditBalanceCard}>
            <Text style={styles.creditBalanceLabel}>{t('Total Credit Balance')}</Text>
            <Text style={styles.creditBalanceAmount}>
              {Currency}{creditBalance.toFixed(2)}
            </Text>
            <Text style={styles.creditBalanceNote}>
              {t('1 credit is equivalent to 1 HTG')}
            </Text>
          </View>

          {/* Credit Transactions */}
          {creditTransactions.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>{t('Recent Transactions')}</Text>
              {creditTransactions.map((item) => {
                const isCredit = item.type === 'credit';
                const date = new Date(item.createdAt);
                return (
                  <View key={item._id} style={styles.creditTransactionCard}>
                    <View style={styles.creditTransactionHeader}>
                      <View style={styles.creditTransactionLeft}>
                        <View
                          style={[
                            styles.creditTransactionIcon,
                            { backgroundColor: isCredit ? '#E8F5E9' : '#FFEBEE' },
                          ]}>
                          <Text style={[styles.creditTransactionIconText, { color: isCredit ? '#4CAF50' : '#F44336' }]}>
                            {isCredit ? '+' : '-'}
                          </Text>
                        </View>
                        <View style={styles.creditTransactionInfo}>
                          <Text style={styles.creditTransactionReason}>
                            {item.reason === 'order_cancelled' ? t('Order Cancelled') :
                             item.reason === 'order_returned' ? t('Order Returned') :
                             item.reason === 'order_payment' ? t('Order Payment') :
                             t('Admin Adjustment')}
                          </Text>
                          <Text style={styles.creditTransactionDescription} numberOfLines={2}>
                            {item.description}
                          </Text>
                          <Text style={styles.creditTransactionDate}>
                            {date.toLocaleDateString()} {date.toLocaleTimeString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.creditTransactionRight}>
                        <Text
                          style={[
                            styles.creditTransactionAmount,
                            { color: isCredit ? '#4CAF50' : '#F44336' },
                          ]}>
                          {isCredit ? '+' : '-'}{Currency}{item.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>
                {t('No records yet')}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('Keep an eye out for future promotions')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Coupons;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  headerContainer: {
    backgroundColor: Constants.saffron,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    gap: 19,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    color: Constants.white,
  },
  headerTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 30,
  },
  headerTab: {
    paddingBottom: 8,
    
  },
  headerTabText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeHeaderTabText: {
    color: Constants.white,
    fontFamily: FONTS.Bold,
  },
  headerTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Constants.white,
    borderRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Constants.saffron,
  },
  tabText: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    color: '#888',
  },
  activeTabText: {
    color: Constants.white,
    fontFamily: FONTS.Bold,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  couponCard: {
    backgroundColor: Constants.white,
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  couponCardDisabled: {
    opacity: 0.6,
  },
  couponHeader: {
    flexDirection: 'row',
    padding: 15,
  },
  couponLeft: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 2,
    borderRightColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  discountBadge: {
    alignItems: 'center',
  },
  discountText: {
    fontSize: 32,
    fontFamily: FONTS.Bold,
    color: Constants.saffron,
  },
  offText: {
    fontSize: 14,
    fontFamily: FONTS.Bold,
    color: Constants.saffron,
  },
  couponRight: {
    flex: 1,
    paddingLeft: 15,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponCode: {
    fontSize: 18,
    fontFamily: FONTS.Bold,
    color: Constants.black,
    flex: 1,
  },
  copyButton: {
    padding: 5,
  },
  couponDescription: {
    fontSize: 13,
    fontFamily: FONTS.Regular,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  expiredBadge: {
    backgroundColor: '#FFE5E5',
  },
  usedBadge: {
    backgroundColor: '#E5F5FF',
  },
  limitBadge: {
    backgroundColor: '#FFF5E5',
  },
  statusText: {
    fontSize: 11,
    fontFamily: FONTS.Bold,
    color: '#666',
  },
  couponDetails: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: FONTS.Regular,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: FONTS.Bold,
    color: Constants.black,
  },
  dashedBorder: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 15,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    color: '#BBB',
    textAlign: 'center',
    marginTop: 8,
  },

  creditBalanceCard: {
    backgroundColor: Constants.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  creditBalanceLabel: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: '#666',
    marginBottom: 8,
  },
  creditBalanceAmount: {
    fontSize: 48,
    fontFamily: FONTS.Bold,
    color: Constants.saffron,
    marginBottom: 8,
  },
  creditBalanceNote: {
    fontSize: 13,
    fontFamily: FONTS.Regular,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.Bold,
    color: Constants.black,
    marginBottom: 15,
  },
  creditTransactionCard: {
    backgroundColor: Constants.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  creditTransactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditTransactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creditTransactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creditTransactionIconText: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
  },
  creditTransactionInfo: {
    flex: 1,
  },
  creditTransactionReason: {
    fontSize: 15,
    fontFamily: FONTS.Bold,
    color: Constants.black,
    marginBottom: 4,
  },
  creditTransactionDescription: {
    fontSize: 13,
    fontFamily: FONTS.Regular,
    color: '#666',
    marginBottom: 4,
  },
  creditTransactionDate: {
    fontSize: 12,
    fontFamily: FONTS.Regular,
    color: '#999',
  },
  creditTransactionRight: {
    alignItems: 'flex-end',
  },
  creditTransactionAmount: {
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
});
