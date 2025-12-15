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
} from 'react-native';
import { BackIcon } from '../../../Theme';
import { goBack } from '../../../navigationRef';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { GetApi } from '../../Assets/Helpers/Service';

import { useTranslation } from 'react-i18next';
import { Copy, Check } from 'lucide-react-native';
import { Clipboard } from 'react-native';

const Coupons = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('available');
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCoupons();
  }, [activeTab]);

  const getCoupons = async () => {
    try {
      setLoading(true);
      const res = await GetApi(`coupon/getUserCoupons?status=${activeTab}`, {});
      console.log("cop====",res)
      setLoading(false);
      if (res?.status) {
        setCoupons(res.data);
      }
    } catch (err) {
      setLoading(false);
      console.log('Error fetching coupons:', err);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <BackIcon height={24} width={24} color={Constants.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Coupons & Credit')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
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

      {/* Coupons List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.saffron} />
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => item._id}
          renderItem={renderCoupon}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎟️</Text>
              <Text style={styles.emptyText}>
                {t('You currently have no coupons available')}
              </Text>
            </View>
          }
        />
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
    fontSize: 20,
    fontFamily: FONTS.Bold,
    color: Constants.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Constants.white,
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Constants.saffron,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: '#666',
  },
  activeTabText: {
    color: Constants.white,
    fontFamily: FONTS.Bold,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
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
});
