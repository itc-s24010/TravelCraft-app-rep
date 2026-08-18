import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { api, Trip } from '@/lib/api';

// ── Colour chips for member avatars ──────────────────────────────────────────
const CHIP_COLORS = ['#f4622a', '#1f9e9b', '#6366f1', '#ec4899', '#eab308', '#10b981'];
function chipColor(i: number) { return CHIP_COLORS[i % CHIP_COLORS.length]; }

function formatDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`;
}

// ── TripCard ─────────────────────────────────────────────────────────────────
function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const colors = useColors();
  const isOwner = trip.isOwner !== false;
  const memberCount = (trip.memberDetails?.length ?? 0) + 1; // +1 for owner

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: isOwner ? colors.primary : colors.secondary }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Outfit_700Bold' }]} numberOfLines={1}>
            {trip.title}
          </Text>
          {trip.isCompleted && (
            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.badgeText, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>完了</Text>
            </View>
          )}
        </View>

        {(trip.startDate || trip.endDate) && (
          <View style={styles.dateRow}>
            <Feather name="calendar" size={12} color={colors.mutedForeground} />
            <Text style={[styles.dateText, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
              {formatDate(trip.startDate)}{trip.endDate ? ` → ${formatDate(trip.endDate)}` : ''}
            </Text>
          </View>
        )}

        <View style={styles.memberRow}>
          {/* Avatar circles */}
          <View style={styles.avatarGroup}>
            {Array.from({ length: Math.min(memberCount, 4) }).map((_, i) => {
              const names = trip.companionNames ?? [];
              const letter = names[i]?.[0]?.toUpperCase() ?? '?';
              return (
                <View
                  key={i}
                  style={[styles.avatar, { backgroundColor: chipColor(i), marginLeft: i === 0 ? 0 : -8 }]}
                >
                  <Text style={[styles.avatarText, { fontFamily: 'Outfit_700Bold' }]}>{letter}</Text>
                </View>
              );
            })}
            {memberCount > 4 && (
              <View style={[styles.avatar, { backgroundColor: colors.muted, marginLeft: -8 }]}>
                <Text style={[styles.avatarText, { color: colors.mutedForeground, fontFamily: 'Outfit_700Bold' }]}>
                  +{memberCount - 4}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.memberCount, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
            {memberCount}名
          </Text>

          <View style={{ flex: 1 }} />

          <View style={styles.roleChip}>
            <Text style={[styles.roleText, {
              color: isOwner ? colors.primary : colors.secondary,
              fontFamily: 'Outfit_600SemiBold',
            }]}>
              {isOwner ? 'オーナー' : '参加者'}
            </Text>
          </View>
        </View>
      </View>

      <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={styles.chevron} />
    </TouchableOpacity>
  );
}

// ── TripsScreen ───────────────────────────────────────────────────────────────
export default function TripsScreen() {
  const colors = useColors();
  const { token, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: trips, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['trips'],
    queryFn: () => api.trips.list(token!),
    enabled: !!token,
  });

  const handleLogout = useCallback(() => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }, [logout]);

  const handleTripPress = useCallback((trip: Trip) => {
    Haptics.selectionAsync();
    router.push(`/trips/${trip.tripId}`);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ padding: 4, marginRight: 4 }}>
              <Feather name="log-out" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Outfit_700Bold' }]}>
              接続エラー
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
              サーバーに接続できません
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={() => refetch()}
            >
              <Text style={[styles.retryText, { fontFamily: 'Outfit_600SemiBold' }]}>再試行</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={trips ?? []}
            keyExtractor={t => String(t.tripId)}
            renderItem={({ item }) => (
              <TripCard trip={item} onPress={() => handleTripPress(item)} />
            )}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: bottomPad + 16 },
              (trips?.length ?? 0) === 0 && styles.listEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Feather name="map" size={48} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Outfit_700Bold' }]}>
                  旅行がありません
                </Text>
                <Text style={[styles.emptyBody, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
                  ウェブアプリから旅行を作成してください
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },

  card: {
    flexDirection: 'row',
    borderRadius: 16, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  accent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11 },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 12 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarGroup: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarText: { fontSize: 10, color: '#fff' },
  memberCount: { fontSize: 12 },
  roleChip: {},
  roleText: { fontSize: 11 },
  chevron: { alignSelf: 'center', marginRight: 12 },

  emptyTitle: { fontSize: 18, textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  retryText: { color: '#fff', fontSize: 15 },
});
