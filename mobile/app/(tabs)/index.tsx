import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

type Difficulty = "easy" | "intermediate" | "pro";

type Recipe = {
    recipe: string;
    ingredients: string[];
    missing: string[];
    match: number;
    difficulty?: Difficulty;
    instructions?: string;
    source?: string;
    image?: string;
};

export default function HomeScreen() {
    const [ingredient, setIngredient] = useState("");
    const [pantry, setPantry] = useState<string[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [allergyInput, setAllergyInput] = useState("");
    const [allergies, setAllergies] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [difficulty] = useState<Difficulty>("easy");

    const loadInventory = async () => {
        try {
            const res = await fetch(`${API_URL}/inventory`);
            const data = await res.json();
            setPantry(data);
        } catch (error) {
            console.log("Error loading inventory:", error);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const addItem = async () => {
        if (!ingredient.trim()) return;

        try {
            const res = await fetch(`${API_URL}/inventory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: ingredient.trim() }),
            });

            const data = await res.json();
            setPantry(data.pantry);
            setIngredient("");
        } catch (error) {
            console.log("Error adding item:", error);
        }
    };

    const removeItem = async (itemName: string) => {
        try {
            const res = await fetch(
                `${API_URL}/inventory/${encodeURIComponent(itemName)}`,
                { method: "DELETE" }
            );

            const data = await res.json();
            setPantry(data.pantry);
        } catch (error) {
            console.log("Error removing item:", error);
        }
    };

    const addAllergy = () => {
        if (!allergyInput.trim()) return;
        setAllergies([...allergies, allergyInput.trim().toLowerCase()]);
        setAllergyInput("");
    };

    const removeAllergy = (name: string) => {
        setAllergies(allergies.filter((a) => a !== name));
    };

    const openRecipeDetails = (item: Recipe) => {
        router.push({
            pathname: "/recipe-details",
            params: {
                recipe: item.recipe,
                ingredients: JSON.stringify(item.ingredients || []),
                missing: JSON.stringify(item.missing || []),
                instructions: item.instructions || "",
                difficulty: item.difficulty || "easy",
                source: item.source || "",
                image: item.image || "",
                match: String(Math.round(item.match * 100)),
            },
        });
    };

    const fetchRecipes = async () => {
        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/suggest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pantry, allergies, difficulty }),
            });

            const data = await res.json();
            setRecipes(data);
        } catch (error) {
            console.log("Error fetching recipes:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>StirFry</Text>
            <Text style={styles.subtitle}>Find meals from what you already have.</Text>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Pantry</Text>

                <TextInput
                    value={ingredient}
                    onChangeText={setIngredient}
                    placeholder="Add an ingredient"
                    placeholderTextColor="#8E8E93"
                    style={styles.input}
                />

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.primaryButton} onPress={addItem}>
                        <Text style={styles.primaryButtonText}>Add Item</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, loading && styles.disabledButton]}
                        onPress={fetchRecipes}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#111111" />
                        ) : (
                            <Text style={styles.secondaryButtonText}>Suggest</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {pantry.length === 0 ? (
                    <Text style={styles.emptyText}>No pantry items yet.</Text>
                ) : (
                    pantry.map((item, index) => (
                        <View key={`${item}-${index}`} style={styles.pillRow}>
                            <Text style={styles.pillText}>{item}</Text>
                            <TouchableOpacity
                                onPress={() => removeItem(item)}
                                style={styles.removeChip}
                            >
                                <Text style={styles.removeChipText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Allergies</Text>

                <TextInput
                    value={allergyInput}
                    onChangeText={setAllergyInput}
                    placeholder="Add an allergy"
                    placeholderTextColor="#8E8E93"
                    style={styles.input}
                />

                <TouchableOpacity
                    style={styles.secondaryButtonFull}
                    onPress={addAllergy}
                >
                    <Text style={styles.secondaryButtonText}>Add Allergy</Text>
                </TouchableOpacity>

                {allergies.length === 0 ? (
                    <Text style={styles.emptyText}>No allergies added.</Text>
                ) : (
                    allergies.map((item, index) => (
                        <View key={`${item}-${index}`} style={styles.pillRow}>
                            <Text style={styles.pillText}>{item}</Text>
                            <TouchableOpacity
                                onPress={() => removeAllergy(item)}
                                style={styles.removeChip}
                            >
                                <Text style={styles.removeChipText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Recipes</Text>

                {recipes.length === 0 ? (
                    <Text style={styles.emptyText}>No suggestions yet.</Text>
                ) : (
                    recipes.map((item, index) => (
                        <TouchableOpacity
                            key={`${item.recipe}-${index}`}
                            style={styles.recipeCard}
                            onPress={() => openRecipeDetails(item)}
                            activeOpacity={0.85}
                        >
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.recipeImage} />
                            ) : null}

                            <View style={styles.recipeHeader}>
                                <Text style={styles.recipeTitle}>{item.recipe}</Text>
                                <View style={styles.matchBadge}>
                                    <Text style={styles.matchBadgeText}>
                                        {Math.round(item.match * 100)}%
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.recipeDifficulty}>
                                Difficulty: {item.difficulty || "easy"}
                            </Text>

                            <Text style={styles.recipeMeta}>
                                Ingredients: {item.ingredients.join(", ")}
                            </Text>

                            <Text style={styles.recipeMissing}>
                                Missing: {item.missing.length ? item.missing.join(", ") : "None"}
                            </Text>

                            <Text style={styles.tapHint}>Tap to view instructions</Text>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F5F5F7",
    },
    content: {
        paddingTop: 72,
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    title: {
        fontSize: 34,
        fontWeight: "700",
        color: "#111111",
        letterSpacing: -0.8,
    },
    subtitle: {
        fontSize: 15,
        color: "#6E6E73",
        marginTop: 6,
        marginBottom: 24,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 18,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "600",
        color: "#111111",
        marginBottom: 14,
        letterSpacing: -0.4,
    },
    input: {
        backgroundColor: "#F2F2F7",
        color: "#111111",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 10,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: "#111111",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: "#E9E9ED",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButtonFull: {
        backgroundColor: "#E9E9ED",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        marginBottom: 8,
    },
    secondaryButtonText: {
        color: "#111111",
        fontSize: 15,
        fontWeight: "600",
    },
    emptyText: {
        color: "#8E8E93",
        fontSize: 15,
        marginTop: 8,
    },
    pillRow: {
        backgroundColor: "#F2F2F7",
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    pillText: {
        color: "#111111",
        fontSize: 15,
        flex: 1,
        textTransform: "capitalize",
    },
    removeChip: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
    },
    removeChipText: {
        color: "#FF3B30",
        fontWeight: "600",
        fontSize: 13,
    },
    recipeCard: {
        backgroundColor: "#F2F2F7",
        borderRadius: 20,
        padding: 16,
        marginTop: 12,
    },
    recipeImage: {
        width: "100%",
        height: 180,
        borderRadius: 16,
        marginBottom: 12,
    },
    recipeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    recipeTitle: {
        color: "#111111",
        fontSize: 18,
        fontWeight: "600",
        flex: 1,
        marginRight: 10,
    },
    matchBadge: {
        backgroundColor: "#111111",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    matchBadgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    recipeDifficulty: {
        color: "#6E6E73",
        fontSize: 14,
        marginTop: 10,
        textTransform: "capitalize",
    },
    recipeMeta: {
        color: "#3A3A3C",
        fontSize: 14,
        marginTop: 10,
        lineHeight: 20,
    },
    recipeMissing: {
        color: "#FF3B30",
        fontSize: 14,
        marginTop: 8,
        lineHeight: 20,
    },
    tapHint: {
        color: "#007AFF",
        fontSize: 13,
        marginTop: 10,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.7,
    },
});