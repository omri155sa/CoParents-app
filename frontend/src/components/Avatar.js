import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../theme';

const sizeMap = { sm: 32, md: 44, lg: 64, xl: 88 };

export default function Avatar({ uri, name, size = 'md', color, style }) {
  const dim = sizeMap[size] || sizeMap.md;
  const bg = color || colors.primary;
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <View
      style={[
        styles.wrap,
        { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: dim * 0.38 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { color: colors.white, fontWeight: '700' },
});
