import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      {/* Replace this with your generated logo file later */}
      <Image
        source={require("../assets/images/stirfry-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>StirFry</Text>
      <Text style={styles.subtitle}>
        Find recipes from ingredients you already have.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(tabs)")}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6E6E73",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#111111",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});