import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetApi } from '../../Assets/Helpers/Service';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useIsFocused } from '@react-navigation/native';

const MessagesList = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchConversations();
    }
  }, [isFocused]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const userDetail = await AsyncStorage.getItem('userDetail');
      if (userDetail) {
        const user = JSON.parse(userDetail);
        const response = await GetApi(`chat/conversations/${user._id}`);
        
        if (response && response.status) {
          setConversations(response.data || []);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
    // More than 7 days
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }) => {
    // Display name will be the other person's name (seller for user, customer for seller)
    const displayName = item.sellerName || item.customerName || 'User';
    const displayImage = item.sellerImage || item.customerImage;
    const otherUserId = item.sellerId || item.customerId;
    
    // Check if image URL is valid (not placeholder or empty)
    const hasValidImage = displayImage && 
                          displayImage.startsWith('http') && 
                          !displayImage.includes('placeholder');
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('ChatRoom', {
          sellerId: otherUserId,
          sellerName: displayName,
          sellerImage: displayImage,
          productId: item.productId
        })}
      >
        {hasValidImage ? (
          <Image
            source={{ uri: displayImage }}
            style={styles.avatar}
            onError={() => {
              // If image fails to load, will show placeholder on next render
            }}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.sellerName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.timestamp}>
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.lastMessage}
          </Text>
          {item.productName && (
            <Text style={styles.productName} numberOfLines={1}>
              Product: {item.productName}
            </Text>
          )}
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <DriverHeader item="Messages" showback={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item="Messages" showback={false} />
      
      {conversations.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

// Empty State Component - Shows different message for sellers vs users
const EmptyState = () => {
  const [userRole, setUserRole] = React.useState('user');

  React.useEffect(() => {
    const getUserRole = async () => {
      const userDetail = await AsyncStorage.getItem('userDetail');
      if (userDetail) {
        const user = JSON.parse(userDetail);
        setUserRole(user.role || 'user');
      }
    };
    getUserRole();
  }, []);

  const isSeller = userRole === 'seller' || userRole === 'Seller';

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Messages Yet</Text>
      <Text style={styles.emptyText}>
        {isSeller 
          ? "You don't have any customer messages yet. Customers can message you from your product pages."
          : 'Start chatting with sellers by clicking "Chat with Seller" on product pages'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF7000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productName: {
    fontSize: 12,
    color: '#FF7000',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#FF7000',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MessagesList;
