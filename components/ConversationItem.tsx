import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Conversation } from '@/types';
import Colors from '@/constants/colors';

interface ConversationItemProps {
  conversation: Conversation;
}

export default function ConversationItem({ conversation }: ConversationItemProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/chat/${conversation.id}`);
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins < 60) {
        return `${Math.max(diffMins, 1)}m ago`;
      } else if (diffMins < 1440) {
        return `${Math.round(diffMins / 60)}h ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return timestamp;
    }
  };

  const unreadCount = conversation.unreadCount || 0;

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri:
              conversation.participantAvatar ||
              conversation.farmerAvatar ||
              'https://randomuser.me/api/portraits/men/1.jpg',
          }}
          style={styles.avatar}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {conversation.participantName || conversation.farmerName || 'Farmer'}
          </Text>
          <Text style={styles.time}>
            {formatTime(conversation.timestamp || conversation.lastMessageTime)}
          </Text>
        </View>

        <Text
          style={[styles.message, unreadCount > 0 && styles.unread]}
          numberOfLines={1}
        >
          {conversation.lastMessage || 'Tap to chat'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.text.light,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  time: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  message: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  unread: {
    fontWeight: '600',
    color: Colors.text.primary,
  },
});