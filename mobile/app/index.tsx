import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.heroGlow} />
      <View style={styles.topBar}>
        <View style={styles.brandMark}>
          <Image
            source={require("../assets/images/stirfry-logo.png")}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandText}>StirFry</Text>
      </View>

      <View style={styles.plate}>
        <Image
          source={require("../assets/images/stirfry-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.floatingChip}>
          <Ionicons name="sparkles" size={15} color="#FDF8EF" />
          <Text style={styles.floatingChipText}>smart picks</Text>
        </View>
      </View>

      <Text style={styles.title}>Turn your pantry into dinner.</Text>
      <Text style={styles.subtitle}>
        Add what you have, skip what you cannot eat, and pull up recipes that are ready to cook.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(tabs)")}
        activeOpacity={0.86}
      >
        <Text style={styles.buttonText}>Start cooking</Text>
        <Ionicons name="arrow-forward" size={18} color="#FDF8EF" />
      </TouchableOpacity>

      <View style={styles.footerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>tap setup</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>food wasted</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>fast</Text>
          <Text style={styles.statLabel}>recipe hunt</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#152018",
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 34,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -110,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#F08A4B",
    opacity: 0.34,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 54,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#FDF8EF",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogo: {
    width: 30,
    height: 30,
  },
  brandText: {
    color: "#FDF8EF",
    fontSize: 18,
    fontWeight: "800",
  },
  plate: {
    alignSelf: "center",
    width: 254,
    height: 254,
    borderRadius: 127,
    backgroundColor: "#FDF8EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  logo: {
    width: 182,
    height: 182,
  },
  floatingChip: {
    position: "absolute",
    right: -4,
    bottom: 30,
    backgroundColor: "#D85F35",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  floatingChipText: {
    color: "#FDF8EF",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 45,
    fontWeight: "900",
    color: "#FDF8EF",
    lineHeight: 50,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 17,
    color: "#C7D0BA",
    lineHeight: 25,
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#D85F35",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#FDF8EF",
    fontSize: 16,
    fontWeight: "800",
  },
  footerStats: {
    marginTop: "auto",
    backgroundColor: "rgba(253, 248, 239, 0.1)",
    borderColor: "rgba(253, 248, 239, 0.16)",
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: "#FDF8EF",
    fontSize: 18,
    fontWeight: "900",
  },
  statLabel: {
    color: "#A9B59D",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(253, 248, 239, 0.16)",
  },
});
