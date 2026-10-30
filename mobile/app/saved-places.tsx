// Saved places — patient manages named locations used to pre-fill SOS label.

import { useState, useEffect, useCallback } from "react"

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native"

import { SafeAreaView } from "react-native-safe-area-context"

import { router } from "expo-router"

import * as Location from "expo-location"

import { colors, fonts, radius, spacing } from "../lib/theme"

import { useAuth } from "./_layout"

import { supabase } from "../lib/supabase"

type SavedPlace = {
  id: string
  patient_id: string
  label: string
  latitude: number
  longitude: number
  created_at: string
}

export default function SavedPlacesScreen() {
  const { session } = useAuth()

  const [places, setPlaces] = useState<SavedPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Inline label input used on Android (Alert.prompt is iOS-only)
  const [pendingLabel, setPendingLabel] = useState<string | null>(null)
  const [pendingCoords, setPendingCoords] = useState<{
    lat: number
    lon: number
  } | null>(null)
  const [labelInput, setLabelInput] = useState("")

  const fetchPlaces = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from("saved_places")
        .select("*")
        .eq("patient_id", session.user.id)
        .order("created_at", { ascending: true })
      setPlaces((data as SavedPlace[]) ?? [])
    } catch {
      // ignore — empty list is a safe fallback
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  async function handleAddCurrentLocation() {
    setAdding(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(
          "Location permission needed",
          "Please allow location access to save your current position.",
        )
        setAdding(false)
        return
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const coords = {
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      }

      if (Platform.OS === "ios") {
        // iOS supports Alert.prompt
        Alert.prompt(
          "Label this place",
          "Give this location a name (e.g. Home, Work, School).",
          async (label) => {
            const trimmed = label?.trim()
            if (!trimmed) {
              setAdding(false)
              return
            }
            await insertPlace(coords, trimmed)
          },
          "plain-text",
          "",
        )
      } else {
        // Android — show inline input below the button
        setPendingCoords(coords)
        setPendingLabel("")
        setLabelInput("")
        setAdding(false)
      }
    } catch {
      Alert.alert("Could not get location", "Please try again.")
      setAdding(false)
    }
  }

  async function insertPlace(
    coords: { lat: number; lon: number },
    label: string,
  ) {
    if (!session?.user) return
    try {
      await supabase.from("saved_places").insert({
        patient_id: session.user.id,
        label,
        latitude: coords.lat,
        longitude: coords.lon,
      })
      await fetchPlaces()
    } catch {
      Alert.alert("Could not save place", "Please try again.")
    } finally {
      setAdding(false)
    }
  }

  async function handleConfirmAndroidLabel() {
    const trimmed = labelInput.trim()
    if (!trimmed || !pendingCoords) return
    setPendingLabel(null)
    setPendingCoords(null)
    setLabelInput("")
    await insertPlace(pendingCoords, trimmed)
  }

  async function handleDelete(id: string) {
    setDeleteLoading(id)
    try {
      await supabase.from("saved_places").delete().eq("id", id)
      setPlaces((prev) => prev.filter((p) => p.id !== id))
    } catch {
      Alert.alert("Could not delete place", "Please try again.")
    } finally {
      setDeleteLoading(null)
    }
  }

  function fmtCoords(lat: number, lon: number) {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.text}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Places</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.teal} size="large" />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No saved places yet.</Text>
              <Text style={styles.emptySubtitle}>
                Tap below to add your current location.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconWrap}>
                  <Text style={styles.iconText}>
                    {item.label.toLowerCase() === "home"
                      ? "H"
                      : item.label.toLowerCase() === "work"
                        ? "W"
                        : item.label.toLowerCase() === "school"
                          ? "S"
                          : item.label.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardCoords}>
                    {fmtCoords(item.latitude, item.longitude)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
                disabled={deleteLoading === item.id}
                activeOpacity={0.7}
              >
                {deleteLoading === item.id ? (
                  <ActivityIndicator color={colors.emergency} size="small" />
                ) : (
                  <Text style={styles.deleteBtnText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Android inline label input */}
      {pendingCoords !== null && (
        <View style={styles.inlineLabelCard}>
          <Text style={styles.inlineLabelHeading}>Label this place</Text>
          <Text style={styles.inlineLabelSub}>
            Give this location a name (e.g. Home, Work, School).
          </Text>
          <TextInput
            style={styles.inlineLabelInput}
            value={labelInput}
            onChangeText={setLabelInput}
            placeholder="Home"
            placeholderTextColor={colors.textMuted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleConfirmAndroidLabel}
          />
          <View style={styles.inlineLabelActions}>
            <TouchableOpacity
              style={styles.inlineCancelBtn}
              onPress={() => {
                setPendingCoords(null)
                setLabelInput("")
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.inlineCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.inlineSaveBtn,
                !labelInput.trim() && styles.inlineSaveBtnDisabled,
              ]}
              onPress={handleConfirmAndroidLabel}
              disabled={!labelInput.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.inlineSaveBtnText}>Save place</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={handleAddCurrentLocation}
          disabled={adding || pendingCoords !== null}
          activeOpacity={0.85}
        >
          {adding ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.addBtnText}>Add current location</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
  },

  headerSpacer: { width: 36 },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xxxl * 2,
  },

  emptyTitle: {
    fontSize: fonts.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.tealDim,
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    fontSize: fonts.md,
    fontWeight: "800",
    color: colors.teal,
  },

  cardInfo: { flex: 1 },

  cardLabel: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
  },

  cardCoords: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },

  deleteBtn: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.emergency + "33",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 60,
    alignItems: "center",
  },

  deleteBtnText: {
    fontSize: fonts.sm,
    fontWeight: "600",
    color: colors.emergency,
  },

  inlineLabelCard: {
    margin: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  inlineLabelHeading: {
    fontSize: fonts.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },

  inlineLabelSub: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  inlineLabelInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.base,
    color: colors.text,
    marginBottom: spacing.md,
  },

  inlineLabelActions: {
    flexDirection: "row",
    gap: spacing.md,
  },

  inlineCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  inlineCancelBtnText: {
    fontSize: fonts.base,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  inlineSaveBtn: {
    flex: 1,
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  inlineSaveBtnDisabled: { opacity: 0.4 },

  inlineSaveBtnText: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: "#000",
  },

  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  addBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },

  addBtnDisabled: { opacity: 0.5 },

  addBtnText: {
    fontSize: fonts.md,
    fontWeight: "800",
    color: "#000",
  },
})
