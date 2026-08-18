import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { api, MemberDetail, Trip } from '@/lib/api';

const AVATAR_COLORS = ['#f4622a', '#1f9e9b', '#6366f1', '#ec4899', '#eab308', '#10b981', '#78716c', '#06b6d4'];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`;
}

// ── MemberRow ─────────────────────────────────────────────────────────────────
function MemberRow({
  member,
  isOwner: amOwner,
  index,
  onRemove,
}: {
  member: { userId: number; displayName: string; isOwner?: boolean };
  isOwner: boolean;
  index: number;
  onRemove?: () => void;
}) {
  const colors = useColors();
  const letter = member.displayName[0]?.toUpperCase() ?? '?';
  const bg = avatarColor(member.displayName);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.avatar, { backgroundColor: bg }]}>
        <Text style={[styles.avatarLetter, { fontFamily: 'Outfit_700Bold' }]}>{letter}</Text>
      </View>

      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: colors.foreground, fontFamily: 'Outfit_600SemiBold' }]}>
          {member.displayName}
        </Text>
        {member.isOwner && (
          <View style={[styles.ownerBadge, { backgroundColor: colors.accent }]}>
            <Feather name="star" size={10} color={colors.primary} />
            <Text style={[styles.ownerBadgeText, { color: colors.primary, fontFamily: 'Outfit_600SemiBold' }]}>
              オーナー
            </Text>
          </View>
        )}
      </View>

      {amOwner && !member.isOwner && onRemove && (
        <TouchableOpacity
          style={[styles.removeBtn, { backgroundColor: '#fef2f2' }]}
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <Feather name="user-minus" size={16} color={colors.destructive} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function MembersScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const colors = useColors();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: trip, isLoading, isError, refetch, isFetching } = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => api.trips.get(Number(tripId), token!),
    enabled: !!token && !!tripId,
  });

  const removeMutation = useMutation({
    mutationFn: ({ userId }: { userId: number }) =>
      api.trips.removeMember(Number(tripId), userId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('エラー', 'メンバーの削除に失敗しました');
    },
  });

  const handleRemove = useCallback((member: MemberDetail) => {
    Alert.alert(
      'メンバーを削除',
      `「${member.displayName}」を旅行から外しますか？\nこの操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => removeMutation.mutate({ userId: member.userId }),
        },
      ],
    );
  }, [removeMutation]);

  const isOwner = trip?.isOwner !== false;

  // Build unified member list: owner first (with isOwner flag), then other members
  const memberList = React.useMemo(() => {
    if (!trip) return [];
    const ownerEntry = {
      userId: trip.userId,
      displayName: trip.companionNames?.[0] ?? 'オーナー',
      isOwner: true,
    };
    const others = (trip.memberDetails ?? []).map(m => ({ ...m, isOwner: false }));
    return [ownerEntry, ...others];
  }, [trip]);

  // Trip info summary
  const dateRange = (() => {
    const s = formatDate(trip?.startDate);
    const e = formatDate(trip?.endDate);
    if (s && e) return `${s} 〜 ${e}`;
    return s || e || null;
  })();

  return (
    <>
      <Stack.Screen options={{ title: trip ? trip.title : 'メンバー管理' }} />

      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
            <Text style={[styles.errTitle, { color: colors.foreground, fontFamily: 'Outfit_700Bold' }]}>
              読み込みエラー
            </Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
              <Text style={[styles.retryText, { fontFamily: 'Outfit_600SemiBold' }]}>再試行</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={memberList}
            keyExtractor={m => String(m.userId)}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 16 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            ListHeaderComponent={() => (
              <View style={styles.header}>
                {/* Trip summary card */}
                <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.summaryAccent, { backgroundColor: isOwner ? colors.primary : colors.secondary }]} />
                  <View style={styles.summaryBody}>
                    <Text style={[styles.summaryTitle, { color: colors.foreground, fontFamily: 'Outfit_700Bold' }]}>
                      {trip?.title}
                    </Text>
                    {dateRange && (
                      <View style={styles.dateRow}>
                        <Feather name="calendar" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.dateText, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
                          {dateRange}
                        </Text>
                      </View>
                    )}
                    <View style={styles.dateRow}>
                      <Feather name="users" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.dateText, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
                        {memberList.length}名参加
                      </Text>
                    </View>
                    {trip?.isCompleted && (
                      <View style={[styles.completedBadge, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.completedText, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
                          ✓ 完了済み
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Section title */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Outfit_700Bold' }]}>
                    メンバー
                  </Text>
                  <Text style={[styles.sectionCount, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
                    {memberList.length}名
                  </Text>
                </View>

                {isOwner && memberList.length > 1 && (
                  <Text style={[styles.ownerHint, { color: colors.mutedForeground, fontFamily: 'Outfit_400Regular' }]}>
                    <Feather name="info" size={12} /> メンバーを長押しで削除できます
                  </Text>
                )}
              </View>
            )}
            renderItem={({ item, index }) => (
              <MemberRow
                member={item}
                isOwner={isOwner}
                index={index}
                onRemove={!item.isOwner ? () => handleRemove(item) : undefined}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  list: { padding: 16 },
  header: { marginBottom: 8 },

  summaryCard: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 8, elevation: 3,
  },
  summaryAccent: { width: 4 },
  summaryBody: { flex: 1, padding: 14, gap: 6 },
  summaryTitle: { fontSize: 18 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13 },
  completedBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  completedText: { fontSize: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 17 },
  sectionCount: { fontSize: 14 },
  ownerHint: { fontSize: 12, marginBottom: 12 },

  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04,
    shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, color: '#fff' },
  memberInfo: { flex: 1, gap: 4 },
  memberName: { fontSize: 15 },
  ownerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  ownerBadgeText: { fontSize: 11 },
  removeBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  errTitle: { fontSize: 18 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontSize: 15 },
});
