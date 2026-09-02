import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { conversations } from '@/mocks/data';
import Colors from '@/constants/colors';

// Mock messages for the chat
const mockMessages = [
  {
    id: 'm1',
    senderId: 'user',
    content: 'Hello, I am interested in your tomatoes. Are they still available?',
    timestamp: '2023-09-15T10:30:00Z',
  },
  {
    id: 'm2',
    senderId: 'f1',
    content: 'Yes, we have fresh tomatoes available. How many kilograms would you like?',
    timestamp: '2023-09-15T10:35:00Z',
  },
  {
    id: 'm3',
    senderId: 'user',
    content: 'I would like 3kg. What is the price?',
    timestamp: '2023-09-15T10:40:00Z',
  },
  {
    id: 'm4',
    senderId: 'f1',
    content: 'The price is 1500 FCFA per kg, so 4500 FCFA for 3kg. Would you like to place an order?',
    timestamp: '2023-09-15T10:45:00Z',
  },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  
  const conversation = conversations.find(c => c.id === id || c.participantId === id);

  if (!conversation) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Conversation not found</Text>
      </View>
    );
  }

  const handleSend = () => {
    if (message.trim() === '') return;
    
    const newMessage = {
      id: `m${messages.length + 1}`,
      senderId: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.senderId === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.otherMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.otherTimestamp]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Send size={20} color={Colors.text.light} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: Colors.text.light,
  },
  otherMessageText: {
    color: Colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: Colors.text.secondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});