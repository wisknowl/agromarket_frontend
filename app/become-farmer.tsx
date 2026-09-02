import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function BecomeFarmerScreen() {
  const router = useRouter();
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = () => {
    // TODO: Send data to backend
    Alert.alert('Application Submitted', 'Your request to become a farmer has been sent!');
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Become a Farmer</Text>
      <Text style={styles.subtitle}>
        Fill in the details below to apply as a farmer on AgroLink.
      </Text>

      <Text style={styles.label}>Farm Name</Text>
      <TextInput
        style={styles.input}
        value={farmName}
        onChangeText={setFarmName}
        placeholder="Enter your farm name"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Enter your farm location"
      />

      <Text style={styles.label}>Short Bio</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell us about your farm"
        multiline
      />

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Application</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.card,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: Colors.text.light,
    fontWeight: '600',
    fontSize: 16,
  },
});