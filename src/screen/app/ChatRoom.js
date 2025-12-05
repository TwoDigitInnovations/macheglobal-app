import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import DriverHeader from '../../Assets/Component/DriverHeader';
import Icon from 'react-native-vector-icons/FontAwesome';
import { setGlobalSocket } from '../../utils/socketManager';
import { getSocketUrl } from '../../Assets/Helpers/Service';

const ChatRoom = ({ route, navigation }) => {
  const { sellerId, sellerName, sellerImage, productId } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Hide tab bar when this screen is focused
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' }
      });
    }
    
   
    initializeChat();
    
    return () => {
   
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            position: 'absolute',
            width: '100%',
            minHeight: Platform?.OS === 'android' ? 70 : 90,
            backgroundColor: 'white',
            borderTopRightRadius: 15,
            borderTopLeftRadius: 15,
            borderTopWidth: 0,
            paddingTop: 20,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
          }
        });
      }
      
      // Disconnect socket when leaving chat
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeChat = async () => {
    try {
      const userDetail = await AsyncStorage.getItem('userDetail');
      if (userDetail) {
        const user = JSON.parse(userDetail);
        setUserId(user._id);
        
      
        const socketUrl = getSocketUrl();
        
        
        
        const newSocket = io(socketUrl, {
      transports: ['websocket'],     
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 20000,
      path: '/socket.io',
      query: { userId: user._id },
    });


        newSocket.on('connect', () => {
          console.log('✅ [SOCKET] Connected');
          newSocket.emit('joinRoom', {
            userId: user._id,
            sellerId: sellerId,
            productId: productId
          });
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ [SOCKET] Connection error:', error.message);
          console.error('❌ [SOCKET] Error details:', {
            type: error.type,
            description: error.description,
            context: error.context
          });
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔌 [SOCKET] Disconnected:', reason);
        });

        newSocket.on('previousMessages', (msgs) => {
          setMessages(msgs);
        });

        newSocket.on('newMessage', (message) => {
          setMessages(prev => {
            const exists = prev.some(m => 
              m.senderId === message.senderId && 
              m.message === message.message && 
              Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 2000
            );
            return exists ? prev : [...prev, message];
          });
        });

        newSocket.on('typing', ({ userId: typingUserId }) => {
          if (typingUserId === sellerId) {
            setIsTyping(true);
          }
        });

        newSocket.on('stopTyping', ({ userId: typingUserId }) => {
          if (typingUserId === sellerId) {
            setIsTyping(false);
          }
        });

        newSocket.on('userStatus', ({ userId: statusUserId, isOnline: online, lastSeen: seen }) => {
          if (statusUserId === sellerId || statusUserId.toString() === sellerId.toString()) {
            setIsOnline(online);
            setLastSeen(seen);
          }
        });

        setSocket(newSocket);
        setGlobalSocket(newSocket); // Set global socket for logout
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendMessage = () => {
    if (inputMessage.trim() && socket && userId) {
      if (!socket.connected) {
        console.error('❌ [SOCKET] Not connected');
        alert('Connection lost. Please check your internet and try again.');
        return;
      }

      const messageData = {
        senderId: userId,
        receiverId: sellerId,
        message: inputMessage.trim(),
        productId: productId,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, messageData]);
      socket.emit('sendMessage', messageData);
      setInputMessage('');
      socket.emit('stopTyping', { userId, receiverId: sellerId });
    }
  };

  const handleTyping = (text) => {
    setInputMessage(text);
    
    if (socket && userId && socket.connected) {
      socket.emit('typing', { userId, receiverId: sellerId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { userId, receiverId: sellerId });
      }, 1000);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Offline';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute - show Offline (just disconnected)
    if (diff < 60000) {
      return 'Offline';
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `Offline (${minutes}m ago)`;
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `Offline (${hours}h ago)`;
    }
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `Offline (${days}d ago)`;
    }
    // More than 7 days - show date
    return `Offline (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  };

  const renderMessage = ({ item }) => {
    const isSender = item.senderId === userId;
    
    return (
      <View style={[styles.messageContainer, isSender ? styles.senderContainer : styles.receiverContainer]}>
        <View style={[styles.messageBubble, isSender ? styles.senderBubble : styles.receiverBubble]}>
          <Text style={[styles.messageText, isSender ? styles.senderText : styles.receiverText]}>
            {item.message}
          </Text>
          <Text style={[styles.timeText, isSender ? styles.senderTimeText : styles.receiverTimeText]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item="Messages" showback={true} />
      
      {/* Seller Info Header */}
      <View style={styles.sellerHeader}>
        <View style={styles.sellerInfo}>
          <Image 
            source={{ uri: sellerImage || 'https://via.placeholder.com/50' }}
            style={styles.sellerImage}
          />
          <View style={styles.sellerDetails}>
            <Text style={styles.sellerName}>{sellerName}</Text>
            {isTyping ? (
              <Text style={styles.typingText}>typing...</Text>
            ) : (
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#999' }]} />
                <Text style={styles.statusText}>
                  {isOnline ? 'Online' : formatLastSeen(lastSeen)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="comments-o" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubText}>Start the conversation!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `msg-${index}-${item.timestamp}`}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputMessage.trim()}
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  sellerHeader: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    marginLeft: 8,
    padding: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  typingText: {
    fontSize: 12,
    color: '#FF7000',
    fontStyle: 'italic',
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  senderContainer: {
    alignSelf: 'flex-end',
  },
  receiverContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  senderBubble: {
    backgroundColor: '#FF7000',
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: '#e0e0e0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  senderText: {
    color: '#fff',
  },
  receiverText: {
    color: '#333',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  senderTimeText: {
    color: '#fff',
    opacity: 0.8,
    textAlign: 'right',
  },
  receiverTimeText: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#FF7000',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
});

export default ChatRoom;
