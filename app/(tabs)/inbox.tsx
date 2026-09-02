import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import ConversationItem from '@/components/ConversationItem';
import { conversations } from '@/mocks/data';
import Colors from '@/constants/colors';

export default function InboxScreen() {
  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptySubtext}>
          When you contact farmers or receive messages, they will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={({ item }) => <ConversationItem conversation={item} />}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: '80%',
  },
});