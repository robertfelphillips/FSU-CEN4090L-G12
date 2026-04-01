import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Linking,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function RecipeDetailsScreen() {
    const params = useLocalSearchParams();

    const recipe = String(params.recipe || "Recipe");
    const instructions = String(params.instructions || "");
    const difficulty = String(params.difficulty || "easy");
    const source = String(params.source || "");
    const image = String(params.image || "");
    const match = String(params.match || "0");

    const ingredients = params.ingredients
        ? JSON.parse(String(params.ingredients))
        : [];

    const missing = params.missing
        ? JSON.parse(String(params.missing))
        : [];

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {image ? <Image source={{ uri: image }} style={styles.image} /> : null}

            <Text style={styles.title}>{recipe}</Text>

            <View style={styles.metaRow}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{match}% Match</Text>
                </View>
                <View style={styles.badgeLight}>
                    <Text style={styles.badgeLightText}>{difficulty}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <Text style={styles.bodyText}>
                    {ingredients.length ? ingredients.join(", ") : "No ingredients listed."}
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Missing</Text>
                <Text style={styles.bodyText}>
                    {missing.length ? missing.join(", ") : "None"}
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.bodyText}>
                    {instructions || "No instructions available."}
                </Text>
            </View>

            {source ? (
                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(source)}
                >
                    <Text style={styles.linkButtonText}>Open Recipe Website</Text>
                </TouchableOpacity>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F5F5F7",
    },
    content: {
        padding: 20,
        paddingTop: 24,
        paddingBottom: 60,
    },
    image: {
        width: "100%",
        height: 240,
        borderRadius: 24,
        marginBottom: 18,
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#111111",
        letterSpacing: -0.6,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 18,
    },
    badge: {
        backgroundColor: "#111111",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    badgeText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },
    badgeLight: {
        backgroundColor: "#E9E9ED",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    badgeLightText: {
        color: "#111111",
        fontWeight: "600",
        fontSize: 13,
        textTransform: "capitalize",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#111111",
        marginBottom: 10,
    },
    bodyText: {
        fontSize: 15,
        color: "#3A3A3C",
        lineHeight: 24,
    },
    linkButton: {
        backgroundColor: "#111111",
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 6,
    },
    linkButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
});