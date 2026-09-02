import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export type FarmCardProps = {
  name: string;
  location: string;
  image: string;
  bio?: string;
};

export default function FarmCard({ name, location, image, bio }: FarmCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.location}>{location}</Text>
        {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  image: {
    width: 80,
    height: 80,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: Colors.border,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  bio: {
    fontSize: 12,
    color: Colors.text.primary,
  },
});
