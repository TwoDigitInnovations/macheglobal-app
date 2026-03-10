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
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import DriverHeader from '../../Assets/Component/DriverHeader';
import Icon from 'react-native-vector-icons/FontAwesome';
import { setGlobalSocket } from '../../utils/socketManager';
import { getSocketUrl } from '../../Assets/Helpers/Service';
import { useTranslation } from 'react-i18next';

const ChatRoom = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { 
    sellerId, 
    sellerName, 
    sellerImage, 
    productId,
    productImage,
    productName,
    productPrice,
    initialMessage 
  } = route.params;
  const [messages, setMessages] = useState([]);
  const [displayMessages, setDisplayMessages] = useState([]); // Messages to display
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [messagesFullyLoaded, setMessagesFullyLoaded] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const initialMessageSentRef = useRef(false); // Use ref instead of state
  const lastSellerIdRef = useRef(null); // Track last seller ID
  const lastProductIdRef = useRef(null); // Track last product ID
  const shouldScrollToEnd = useRef(true); // Control auto-scroll

  // Reset initialMessageSent when seller or product changes
  useEffect(() => {
    const sellerChanged = lastSellerIdRef.current !== sellerId;
    const productChanged = lastProductIdRef.current !== productId;
    
    if (sellerChanged || productChanged) {
      console.log('🔄 [CHAT] Seller or product changed, resetting state');
      initialMessageSentRef.current = false;
      lastSellerIdRef.current = sellerId;
      lastProductIdRef.current = productId;
      
      // Clear messages when switching conversations and show loading
      setMessages([]);
      setDisplayMessages([]);
      setIsLoadingMessages(true);
      setIsConnecting(true);
      setMessagesFullyLoaded(false);
      
      // Reconnect socket with new room
      if (socket) {
        socket.disconnect();
        initializeChat();
      }
    }
  }, [sellerId, productId]);

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
            height: Platform?.OS === 'android' ? 68 : 88,
            backgroundColor: 'white',
            borderTopRightRadius: 15,
            borderTopLeftRadius: 15,
            borderTopWidth: 0,
            paddingTop: 15,
            paddingBottom: 8,
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

  // Sync displayMessages with messages when fully loaded
  useEffect(() => {
    if (messagesFullyLoaded) {
      setDisplayMessages(messages);
    }
  }, [messages, messagesFullyLoaded]);

  // Auto-scroll when displayMessages change
  useEffect(() => {
    if (displayMessages.length > 0 && messagesFullyLoaded) {
      // Multiple scroll attempts to ensure it reaches the bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 400);
    }
  }, [displayMessages.length, messagesFullyLoaded]);

  // Mark messages as read when screen is focused
  useEffect(() => {
    const markMessagesAsRead = async () => {
      try {
        const userDetail = await AsyncStorage.getItem('userDetail');
        if (userDetail) {
          const user = JSON.parse(userDetail);
          const { Post } = require('../../Assets/Helpers/Service');
          await Post('chat/mark-read', {
            userId: user._id,
            otherUserId: sellerId,
            productId: productId
          });
          console.log('✅ Messages marked as read');
          
          // Emit socket event to update badge immediately
          if (socket && socket.connected) {
            socket.emit('messagesRead', {
              userId: user._id,
              otherUserId: sellerId,
              productId: productId
            });
          }
        }
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    };

    // Mark as read after a short delay to ensure messages are loaded
    const timer = setTimeout(markMessagesAsRead, 500);
    return () => clearTimeout(timer);
  }, [sellerId, productId, socket]);

  // Keyboard listener to scroll messages when keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        // Scroll to end when keyboard opens
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        // Keyboard hidden - no action needed
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const initializeChat = async () => {
    try {
      const userDetail = await AsyncStorage.getItem('userDetail');
      if (userDetail) {
        const user = JSON.parse(userDetail);
        setUserId(user._id);
        
        // Set a timeout to hide loading if connection takes too long
        const loadingTimeout = setTimeout(() => {
          console.log('⏰ [TIMEOUT] Loading timeout reached');
          setIsLoadingMessages(false);
          setIsConnecting(false);
          setMessagesFullyLoaded(true);
          // Show empty messages if timeout occurs
          setDisplayMessages([]);
        }, 10000); // 10 seconds timeout
        
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
          clearTimeout(loadingTimeout);
          setIsConnecting(false);
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
          clearTimeout(loadingTimeout);
          setIsConnecting(false);
          setIsLoadingMessages(false);
          setMessagesFullyLoaded(true);
          setDisplayMessages([]);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔌 [SOCKET] Disconnected:', reason);
        });

        newSocket.on('previousMessages', async (msgs) => {
          console.log('📨 [PREVIOUS] Received messages:', msgs.length);
          clearTimeout(loadingTimeout);
          
          // Log each message details
          msgs.forEach((msg, index) => {
            console.log(`📨 [MSG ${index}]:`, {
              id: msg._id,
              message: msg.message?.substring(0, 30),
              productId: msg.productId,
              productName: msg.productName,
              productPrice: msg.productPrice,
              productImage: msg.productImage ? 'YES' : 'NO',
              hasMessage: !!msg.message
            });
          });
          
          // Store all messages at once
          setMessages(msgs);
          
          // Wait a bit to ensure all messages are processed, then show them all at once
          setTimeout(() => {
            console.log('📱 [DISPLAY] Showing all messages at once:', msgs.length);
            setDisplayMessages(msgs);
            setIsLoadingMessages(false);
            setMessagesFullyLoaded(true);
            
            // Force immediate scroll to bottom
            requestAnimationFrame(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
              
              // Additional scroll attempts
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 50);
              
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 150);
              
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 300);
            });
          }, 50); // Minimal delay for instant loading
          
          // Send initial message with product info if provided
          // IMPORTANT: Only send if we have initialMessage AND it hasn't been sent yet
          if (initialMessage && !initialMessageSentRef.current && productId) {
            console.log('📤 [INITIAL] Preparing to send inquiry message');
            
            // Wait a bit to ensure socket is fully ready
            setTimeout(() => {
              // Double check it hasn't been sent in the meantime
              if (initialMessageSentRef.current) {
                console.log('⚠️ [INITIAL] Already sent, skipping');
                return;
              }
              
              const tempId = `temp-${Date.now()}`;
              const messageData = {
                _id: tempId,
                senderId: user._id,
                receiverId: sellerId,
                message: initialMessage,
                productId: productId,
                productImage: productImage,
                productName: productName,
                productPrice: productPrice,
                timestamp: new Date().toISOString(),
                isPending: true,
              };
              
              console.log('📤 [INITIAL] Sending inquiry message:', {
                message: messageData.message.substring(0, 30),
                productName: messageData.productName,
                productPrice: messageData.productPrice
              });
              
              // Add to both messages arrays
              setMessages(prev => [...prev, messageData]);
              setDisplayMessages(prev => [...prev, messageData]);
              newSocket.emit('sendMessage', messageData);
              initialMessageSentRef.current = true;
            }, 500);
          }
        });

        newSocket.on('newMessage', (message) => {
          console.log('📩 [NEW] Message received:', {
            id: message._id,
            message: message.message?.substring(0, 30),
            productName: message.productName,
            timestamp: message.timestamp
          });
          
          // Update both message arrays
          setMessages(prev => {
            const withoutPending = prev.filter(m => 
              !(m.isPending && m.message === message.message && m.senderId === message.senderId)
            );
            
            const existsById = withoutPending.some(m => m._id === message._id);
            
            if (existsById) {
              console.log('⚠️ [NEW] Message already exists (by ID), skipping');
              return withoutPending;
            }
            
            const existsByContent = withoutPending.some(m => 
              m.senderId === message.senderId && 
              m.receiverId === message.receiverId &&
              m.message === message.message && 
              Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 2000
            );
            
            if (existsByContent) {
              console.log('⚠️ [NEW] Message already exists (by content), skipping');
              return withoutPending;
            }
            
            console.log('✅ [NEW] Adding new message');
            const newMessages = [...withoutPending, message];
            
            // If messages are fully loaded, also update display messages
            if (messagesFullyLoaded) {
              setDisplayMessages(newMessages);
            }
            
            return newMessages;
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
        alert(t('Connection lost. Please check your internet and try again.'));
        return;
      }

      const messageData = {
        senderId: userId,
        receiverId: sellerId,
        message: inputMessage.trim(),
        productId: productId,
        productImage: productImage,
        productName: productName,
        productPrice: productPrice,
        timestamp: new Date()
      };

      console.log('📤 [SEND] Sending message with product details:', {
        hasProductId: !!productId,
        hasProductImage: !!productImage,
        hasProductName: !!productName,
        hasProductPrice: !!productPrice
      });

      // Update both message arrays
      setMessages(prev => [...prev, messageData]);
      setDisplayMessages(prev => [...prev, messageData]);
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
    if (!timestamp) return t('Offline');
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    
    if (diff < 60000) {
      return t('Offline');
    }
   
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return t('Offline_minutes_ago', { count: minutes });
    }
    
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return t('Offline_hours_ago', { count: hours });
    }
  
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return t('Offline_days_ago', { count: days });
    }
    // More than 7 days - show date
    return `${t('Offline')} (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  };

  const renderMessage = ({ item }) => {
    const isSender = item.senderId === userId;
    const hasProductInfo = !!(item.productImage || item.productName || item.productPrice);
    
    console.log('🎨 [RENDER] Message:', {
      hasProductInfo,
      hasMessage: !!item.message,
      message: item.message?.substring(0, 50),
      productName: item.productName,
      productPrice: item.productPrice,
      productImage: item.productImage ? 'YES' : 'NO'
    });
    
    return (
      <View style={[styles.messageContainer, isSender ? styles.senderContainer : styles.receiverContainer]}>
        <View style={[
          styles.messageBubble, 
          isSender ? styles.senderBubble : styles.receiverBubble,
          hasProductInfo && styles.productMessageBubble
        ]}>
          {/* Product Info Card */}
          {hasProductInfo && (
            <View style={[styles.productInfoCard, isSender && styles.productInfoCardSender]}>
              {item.productImage && (
                <Image 
                  source={{ uri: item.productImage }}
                  style={styles.productInfoImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.productInfoDetails}>
                {item.productName && (
                  <Text style={[styles.productInfoName, isSender && styles.productInfoNameSender]} numberOfLines={2}>
                    {item.productName}
                  </Text>
                )}
                {item.productPrice && (
                  <Text style={styles.productInfoPrice}>
                    $ {typeof item.productPrice === 'number' ? item.productPrice.toFixed(2) : parseFloat(item.productPrice || 0).toFixed(2)}
                  </Text>
                )}
                
                {/* Message Text inside Product Card */}
                {item.message && item.message.trim() && (
                  <Text style={styles.productInfoMessage} numberOfLines={0}>
                    {item.message}
                  </Text>
                )}
                
                {/* Time inside Product Card */}
                <Text style={styles.productInfoTime}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            </View>
          )}
          
          {/* Message Text (only if no product info) */}
          {!hasProductInfo && item.message && item.message.trim() && (
            <>
              <Text style={[styles.messageText, isSender ? styles.senderText : styles.receiverText]}>
                {item.message}
              </Text>
              <Text style={[styles.timeText, isSender ? styles.senderTimeText : styles.receiverTimeText]}>
                {formatTime(item.timestamp)}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <DriverHeader item={t('Messages')} showback={true} />
      
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
              <Text style={styles.typingText}>{t('typing...')}</Text>
            ) : (
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#999' }]} />
                <Text style={styles.statusText}>
                  {isOnline ? t('Online') : formatLastSeen(lastSeen)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages List */}
        <View style={styles.messagesContainer}>
          {isLoadingMessages || isConnecting || !messagesFullyLoaded ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF7000" />
              <Text style={styles.loadingText}>
                {isConnecting ? t('Connecting...') : t('Loading messages...')}
              </Text>
            </View>
          ) : displayMessages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="comments-o" size={60} color="#ccc" />
              <Text style={styles.emptyText}>{t('No messages yet')}</Text>
              <Text style={styles.emptySubText}>{t('Start the conversation!')}</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={displayMessages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => item._id || `msg-${index}-${item.timestamp}`}
              contentContainerStyle={styles.messagesList}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              inverted={false}
              initialNumToRender={displayMessages.length > 0 ? displayMessages.length : 50}
              maxToRenderPerBatch={displayMessages.length > 0 ? displayMessages.length : 50}
              windowSize={21}
              removeClippedSubviews={false}
              getItemLayout={null}
              legacyImplementation={false}
              disableVirtualization={true}
              onContentSizeChange={() => {
                // Auto-scroll to end immediately when content size changes
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }, 50);
              }}
              onLayout={() => {
                // Scroll to end when FlatList is laid out
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }, 50);
              }}
              onScroll={(event) => {
                // Detect if user is scrolling up (viewing old messages)
                const offsetY = event.nativeEvent.contentOffset.y;
                const contentHeight = event.nativeEvent.contentSize.height;
                const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
                
                // If user is near bottom (within 100px), enable auto-scroll
                const isNearBottom = contentHeight - offsetY - scrollViewHeight < 100;
                shouldScrollToEnd.current = isNearBottom;
              }}
              scrollEventThrottle={400}
            />
          )}
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={handleTyping}
            onFocus={() => {
              // Scroll to end when input is focused with better timing
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 200);
            }}
            placeholder={t('Type a message...')}
            placeholderTextColor="#999"
            multiline
            maxHeight={100}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  productMessageBubble: {
    width: '100%',
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
    position: 'relative',
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
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  senderTimeText: {
    color: '#fff',
    opacity: 0.9,
    textAlign: 'right',
  },
  receiverTimeText: {
    color: '#666',
  },
  productInfoTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  productInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productInfoCardSender: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  productInfoImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  productInfoDetails: {
    width: '100%',
  },
  productInfoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  productInfoNameSender: {
    color: '#1a1a1a',
  },
  productInfoPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF7000',
  },
  productInfoMessage: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    marginTop: 8,
    lineHeight: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
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
    paddingVertical: 12,
    marginRight: 10,
    maxHeight: 100,
    minHeight: 44,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
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
