import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { COLORS } from '@/lib/constants';

const DEBOUNCE_MS = 300;

type Props = {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  defaultValue?: string;
};

export function SearchBar({
  onSearch,
  placeholder = 'Search by @username or name...',
  isLoading = false,
  defaultValue = '',
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchRef = useRef(onSearch);

  // Keep onSearch ref up to date
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Sync with defaultValue changes (but only if value is empty to avoid overriding user input)
  useEffect(() => {
    if (!value && defaultValue) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed) {
        onSearchRef.current(trimmed.startsWith('@') ? trimmed.slice(1) : trimmed);
      } else {
        onSearchRef.current('');
      }
      debounceRef.current = null;
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleClear = useCallback(() => {
    setValue('');
    onSearchRef.current('');
  }, []);

  return (
    <View style={styles.container}>
      <FontAwesome name="search" size={16} color={COLORS.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.clearButton} />
      ) : value.length > 0 ? (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton} hitSlop={8}>
          <FontAwesome name="times-circle" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 10,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
});
