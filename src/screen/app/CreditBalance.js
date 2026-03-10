/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { BackIcon } from '../../../Theme';
import { goBack } from '../../../navigationRef';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { GetApi } from '../../Assets/Helpers/Service';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';

const CreditBalance = () => {
  const { t } = useTranslation();
  const [creditBalance, setCreditBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    try {
      setLoading(true);
      await Promise.all([getCreditBalance(), getCreditTransactions(1)]);
    } catch (err) {
      console.log('Error loading credit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCreditBalance = async () => {
    try {
      const res = await GetApi('credit/balance', {});
      if (res?.success) {
        setCreditBalance(res.data.creditBalance || 0);
      }
    } catch (err) {
      console.log('Error fetching credit balance:', err);
    }
  };

  const getCreditTransactions = async (pageNum = 1) => {
    try {
      const res = await GetApi(`credit/transactions?page=${pageNum}&limit=20`, {});
      if (res?.success) {
        if (pageNum === 1) {
          setTransactions(res.data);
        } else {
          setTransactions(prev => [...prev, ...res.data]);
        }
        setHasMore(pageNum < res.totalPages);
        setPage(pageNum);
      }
    } catch (err) {
      console.log('Error fetching credit transactions:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCreditData();
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      getCreditTransactions(page + 1);
    }
  };

  const getReasonText = (reason) => {
    const reasons = {
      order_cancelled: t('Order Cancelled'),
      order_returned: t('Order Returned'),
      order_payment: t('Order Payment'),
      admin_adjustment: t('Admin Adjustment'),
    };
    return reasons[reason] || reason;
  };

  const renderTransaction = ({ item }) => {
    const isCredit = item.type === 'credit';
    const date = new Date(item.createdAt);

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionLeft}>
            <View
              style={[
                styles.transactionIcon,
                { backgroundColor: isCredit ? '#E8F5E9' : '#FFEBEE' },
              ]}>
              <Text style={[styles.transactionIconText, { color: isCredit ? '#4CAF50' : '#F44336' }]}>
                {isCredit ? '+' : '-'}
              </Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionReason}>{getReasonText(item.reason)}</Text>
              <Text style={styles.transactionDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.transactionDate}>
                {date.toLocaleDateString()} {date.toLocaleTimeString()}
              </Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text
              style={[
                styles.transactionAmount,
                { color: isCredit ? '#4CAF50' : '#F44336' },
              ]}>
              {isCredit ? '+' : '-'}{Currency}{item.amount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceLabel}>{t('Total Credit Balance')}</Text>
      <Text style={styles.balanceAmount}>
        {Currency}{creditBalance.toFixed(2)}
      </Text>
      <Text style={styles.balanceNote}>
        {t('1 credit is equivalent to 1 HTG')}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💳</Text>
      <Text style={styles.emptyText}>
        {t('No records yet')}
      </Text>
      <Text style={styles.emptySubtext}>
        {t('Keep an eye out for future promotions')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <BackIcon height={24} width={24} color={Constants.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Credit Balance')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.saffron} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={renderTransaction}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Constants.saffron]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && transactions.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Constants.saffron} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default CreditBalance;

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  balanceCard: {
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
  balanceLabel: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontFamily: FONTS.Bold,
    color: Constants.saffron,
    marginBottom: 8,
  },
  balanceNote: {
    fontSize: 13,
    fontFamily: FONTS.Regular,
    color: '#999',
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    fontSize: 15,
    fontFamily: FONTS.Bold,
    color: Constants.black,
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 13,
    fontFamily: FONTS.Regular,
    color: '#666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FONTS.Regular,
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  emptyContainer: {
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    color: '#BBB',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
