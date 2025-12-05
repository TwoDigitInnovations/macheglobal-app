import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
} from 'react-native';
import { GetApi } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TransactionHistory = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchWithdrawalHistory = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const user = await AsyncStorage.getItem('userDetail');
      const userDetail = JSON.parse(user);
      const sellerId = userDetail?.id || userDetail?._id;
      
      if (!sellerId) {
        throw new Error('Seller ID not found');
      }

      const response = await GetApi(`wallet/seller/withdrawals/${sellerId}`);
      
      console.log('Withdrawal history response:', response);
      
      if (response?.status === true && Array.isArray(response.data)) {
        const formattedTransactions = response.data.map(trans => ({
          id: trans._id || Math.random().toString(),
          amount: trans.amount || 0,
          status: trans.status?.toLowerCase() || 'pending',
          date: trans.createdAt ? new Date(trans.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'N/A',
          paymentMethod: trans.paymentMethod || 'Bank Transfer',
          transactionId: trans.transactionId || 'N/A',
          notes: trans.notes || ''
        }));
        
        setTransactions(formattedTransactions);
      } else {
        throw new Error(response?.message || 'Failed to fetch withdrawal history');
      }
    } catch (err) {
      console.error('Error fetching withdrawal history:', err);
      setError('Failed to load withdrawal history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWithdrawalHistory();
  }, []);

  const onRefresh = () => {
    fetchWithdrawalHistory();
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'approved':
        return '#10B981'; // Green-500
      case 'failed':
      case 'rejected':
        return '#EF4444'; // Red-500
      case 'processing':
        return '#F59E0B'; // Amber-500
      case 'pending':
        return '#3B82F6'; // Blue-500
      default:
        return '#6B7280'; // Gray-500
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'approved':
        return 'check-circle';
      case 'failed':
      case 'rejected':
        return 'cancel';
      case 'processing':
        return 'pending';
      case 'pending':
        return 'schedule';
      default:
        return 'info';
    }
  };

  const renderTransaction = (transaction) => (
    <View key={transaction.id} style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionLeft}>
          <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor(transaction.status)}20` }]}>
            <Icon 
              name={getStatusIcon(transaction.status)} 
              size={20} 
              color={getStatusColor(transaction.status)} 
            />
          </View>
          <View>
            <Text style={styles.amount}>${transaction.amount.toFixed(2)}</Text>
            <Text style={styles.paymentMethod}>{transaction.paymentMethod}</Text>
          </View>
        </View>
        <Text style={[styles.status, { color: getStatusColor(transaction.status) }]}>
          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
        </Text>
      </View>
      
      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{transaction.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction ID:</Text>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
            {transaction.transactionId}
          </Text>
        </View>
        {transaction.notes ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={[styles.detailValue, { flex: 1 }]}>{transaction.notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF7000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { padding: 20 }]}>
        <Icon name="error-outline" size={48} color="#F44336" style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchWithdrawalHistory}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
     

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF7000']}
            tintColor="#FF7000"
          />
        }
      >
        {transactions.length > 0 ? (
          <View style={styles.transactionList}>
            {transactions.map(renderTransaction)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="account-balance-wallet" size={64} color="#E0E0E0" />
            <Text style={styles.emptyStateText}>No withdrawal history found</Text>
            <Text style={styles.emptyStateSubtext}>Your withdrawal history will appear here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  transactionList: {
    paddingBottom: 24,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 110,
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF7000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TransactionHistory;
