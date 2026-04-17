import React from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SP, RAD, FS } from '../utils/theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}

export default function MiniSearch({
  value,
  onChangeText,
  placeholder = 'Search drinks, moods, ingredients…',
}: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={16} color="rgba(255,255,255,0.55)" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="close-circle"
            size={16}
            color="rgba(255,255,255,0.55)"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm + 2,
    borderRadius: RAD.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: SP.md,
  },
  input: {
    flex: 1,
    fontSize: FS.md,
    padding: 0,
    color: 'white',
  },
});
