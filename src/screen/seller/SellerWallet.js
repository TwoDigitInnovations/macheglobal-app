import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GetApi, Post } from '../../Assets/Helpers/Service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SellerWallet = () => {
  const navigation = useNavigation();
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const user = await AsyncStorage.getItem('userDetail');
      const userDetail = JSON.parse(user);
      const sellerId = userDetail?.user?._id || userDetail?._id || userDetail?.id;
      
      if (!sellerId) {
        throw new Error('Seller ID not found');
      }

      console.log('Fetching wallet data for seller:', sellerId);

      // Fetch wallet balance
      const [walletResponse, transactionsResponse] = await Promise.all([
        GetApi(`wallet/seller/${sellerId}`, {}),
        GetApi(`wallet/transactions?sellerId=${sellerId}`, {})
      ]);
      
      console.log('Wallet balance response:', walletResponse);
      console.log('Transactions response:', transactionsResponse);
      
      if (walletResponse && walletResponse.data) {
        const formattedData = {
          balance: walletResponse.data.balance || 0,
          transactions: (transactionsResponse?.data || []).map(trans => ({
            id: trans._id || Math.random().toString(),
            amount: trans.amount || 0,
            description: trans.description || trans.type || 'Transaction',
            date: trans.createdAt ? new Date(trans.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }) : 'N/A',
            type: trans.type?.toLowerCase() || 'credit'
          }))
        };
        console.log('Formatted transactions:', formattedData.transactions);
        setWalletData(formattedData);
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data. Please try again.');
    } finally {
      // Always stop loading, whether success or error
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleWithdrawPress = () => {
    setWithdrawModalVisible(true);
  };

  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(withdrawAmount);
    
    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }
    
    if (amount > walletData.balance) {
      setWithdrawError('Insufficient balance');
      return;
    }
    
    try {
      setLoading(true);
      
      
      const user = await AsyncStorage.getItem('userDetail');
      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      const userDetail = JSON.parse(user);
      console.log('User details from storage:', userDetail);
      
      
      const sellerId = userDetail?._id || userDetail?.id;
      const sellerName = userDetail?.name || userDetail?.fullName || 'Seller';
      
      if (!sellerId) {
        console.error('User ID not found in user details');
        throw new Error('User ID not found. Please log in again.');
      }
      
      console.log('Sending withdrawal request with:', { 
        amount, 
        sellerId, 
        sellerName 
      });
      
      // Make the withdrawal request
      const response = await Post('wallet/withdraw', {
        amount: amount,
        sellerId: sellerId,
        sellerName: sellerName
      });
      
      if (response.status === true) {
        setWithdrawAmount('');
        setWithdrawError('');
        setWithdrawModalVisible(false);
        setShowSuccess(true);
        
        // Refresh wallet data
        await fetchWalletData();
        
        // Hide success message after 3 seconds and navigate to transaction history
        setTimeout(() => {
          setShowSuccess(false);
          navigation.navigate('TransactionHistory');
        }, 3000);
      } else {
        // Handle API error
        const errorMessage = response.message || 'Failed to process withdrawal';
        setWithdrawError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setWithdrawError('An error occurred while processing your request');
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseModal = () => {
    setWithdrawModalVisible(false);
    setWithdrawAmount('');
    setWithdrawError('');
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchWalletData();
  }, []);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderTransaction = (transaction) => {
    const isCredit = transaction.type === 'credit';
    
    return (
      <View key={transaction.id} style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.iconContainer, isCredit ? styles.creditIconBg : styles.debitIconBg]}>
            <Icon 
              name={isCredit ? 'arrow-downward' : 'arrow-upward'} 
              size={20} 
              color={isCredit ? '#4CAF50' : '#F44336'} 
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription} numberOfLines={2}>
              {transaction.description}
            </Text>
            <Text style={styles.transactionDate}>{transaction.date}</Text>
          </View>
        </View>
        <Text 
          style={[
            styles.transactionAmount,
            isCredit ? styles.credit : styles.debit
          ]}
        >
          {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
    );
  };

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
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchWalletData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Success Message */}
      {showSuccess && (
        <View style={styles.successMessage}>
          <Icon name="check-circle" size={24} color="white" />
          <Text style={styles.successText}>
            Withdrawal request submitted successfully!
          </Text>
        </View>
      )}
      
      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(walletData.balance)}</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={handleWithdrawPress}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.historyButton]}
            onPress={() => navigation.navigate('TransactionHistory')}
          >
            <Text style={styles.historyButtonText}>Transaction History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <ScrollView 
          style={styles.transactionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF7000']}
              tintColor="#FF7000"
            />
          }
        >
          {walletData.transactions.length > 0 ? (
            walletData.transactions.map(renderTransaction)
          ) : (
            <Text style={styles.noTransactions}>No transactions found</Text>
          )}
          </ScrollView>
        </View>
      </View>
      
      {/* Withdraw Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={withdrawModalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Withdraw Funds</Text>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Available Balance</Text>
                  <View style={styles.balanceContainer}>
                    <Text style={styles.balanceText}>${walletData.balance.toFixed(2)}</Text>
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Amount to Withdraw</Text>
                  <TextInput
                    style={[styles.input, withdrawError ? styles.inputError : null]}
                    placeholder="Enter amount"
                    keyboardType="decimal-pad"
                    value={withdrawAmount}
                    onChangeText={(text) => {
                      setWithdrawAmount(text.replace(/[^0-9.]/g, ''));
                      if (withdrawError) setWithdrawError('');
                    }}
                    placeholderTextColor="#999"
                  />
                  {withdrawError ? (
                    <Text style={styles.errorText}>{withdrawError}</Text>
                  ) : null}
                </View>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleWithdrawSubmit}
                  disabled={!withdrawAmount}
                >
                  <Text style={styles.submitButtonText}>
                    Request Withdrawal
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.note}>
                  Note: Withdrawals may take 1-3 business days to process.
                </Text>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#FF7000',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  withdrawButton: {
    backgroundColor: 'white',
    marginRight: 10,
  },
  withdrawButtonText: {
    color: '#FF7000',
    fontWeight: '600',
  },
  historyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'white',
  },
  historyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  transactionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creditIconBg: {
    backgroundColor: '#E8F5E9',
  },
  debitIconBg: {
    backgroundColor: '#FFEBEE',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
    lineHeight: 20,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  credit: {
    color: '#4CAF50',
  },
  debit: {
    color: '#F44336',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successMessage: {
    backgroundColor: '#10B981', // Green-500
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF7000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noTransactions: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  successMessage: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  balanceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  submitButton: {
    backgroundColor: '#FF7000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
});

export default SellerWallet;