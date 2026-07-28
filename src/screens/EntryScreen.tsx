import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

interface Props {
  onStart: () => void;
}

export default function EntryScreen({ onStart }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>I'm done.</Text>
        <Text style={styles.title}>Reset me.</Text>
        <Text style={styles.subtitle}>
          A few quick questions, then your first day gets built for you.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onStart}
        >
          <Text style={styles.buttonText}>Start my Reset</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  content: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { color: '#ffffff', fontSize: 34, fontWeight: '700', lineHeight: 40 },
  subtitle: { color: '#8a8f98', fontSize: 16, marginTop: 16, marginBottom: 40 },
  button: { backgroundColor: '#5b8cff', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
});
