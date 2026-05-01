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
import { Ionicons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

type Recipe = {
    id?: string;
    recipe: string;
    ingredients: string[];
    missing: string[];
    match: number;
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
    const strongMatches = recipes.filter((item) => item.match >= 0.2).length;

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
                id: item.id || "",
                recipe: item.recipe,
                ingredients: JSON.stringify(item.ingredients || []),
                missing: JSON.stringify(item.missing || []),
                instructions: item.instructions || "",
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
                body: JSON.stringify({ pantry, allergies }),
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
            <View style={styles.hero}>
                <View style={styles.heroCopy}>
                    <Text style={styles.eyebrow}>Pantry to plate</Text>
                    <Text style={styles.title}>What are we making?</Text>
                    <Text style={styles.subtitle}>
                        Build a tiny pantry list and StirFry will surface recipes worth cooking.
                    </Text>
                </View>
                <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeNumber}>{pantry.length}</Text>
                    <Text style={styles.heroBadgeLabel}>items</Text>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Pantry</Text>
                        <Text style={styles.sectionSubtitle}>Ingredients you have right now</Text>
                    </View>
                    <View style={styles.sectionIcon}>
                        <Ionicons name="basket" size={20} color="#17351F" />
                    </View>
                </View>

                <TextInput
                    value={ingredient}
                    onChangeText={setIngredient}
                    placeholder="Add an ingredient"
                    placeholderTextColor="#8E8E93"
                    style={styles.input}
                />

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.primaryButton} onPress={addItem}>
                        <Ionicons name="add" size={18} color="#FDF8EF" />
                        <Text style={styles.primaryButtonText}>Add Item</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, loading && styles.disabledButton]}
                        onPress={fetchRecipes}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#17351F" />
                        ) : (
                            <>
                            <Ionicons name="restaurant" size={17} color="#17351F" />
                            <Text style={styles.secondaryButtonText}>Suggest</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {pantry.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="leaf-outline" size={22} color="#6F7E67" />
                        <Text style={styles.emptyText}>Add a few ingredients to get started.</Text>
                    </View>
                ) : (
                    <View style={styles.chipWrap}>
                        {pantry.map((item, index) => (
                            <View key={`${item}-${index}`} style={styles.ingredientChip}>
                                <Text style={styles.ingredientChipText}>{item}</Text>
                                <TouchableOpacity
                                    onPress={() => removeItem(item)}
                                    style={styles.chipRemoveButton}
                                >
                                    <Ionicons name="close" size={14} color="#17351F" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Allergies</Text>
                        <Text style={styles.sectionSubtitle}>Foods to keep out</Text>
                    </View>
                    <View style={[styles.sectionIcon, styles.warningIcon]}>
                        <Ionicons name="shield-checkmark" size={20} color="#7D2E1F" />
                    </View>
                </View>

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
                    <Ionicons name="add-circle-outline" size={17} color="#17351F" />
                    <Text style={styles.secondaryButtonText}>Add Allergy</Text>
                </TouchableOpacity>

                {allergies.length === 0 ? (
                    <Text style={styles.emptyText}>No allergies added.</Text>
                ) : (
                    <View style={styles.chipWrap}>
                        {allergies.map((item, index) => (
                            <View key={`${item}-${index}`} style={styles.allergyChip}>
                                <Text style={styles.allergyChipText}>{item}</Text>
                                <TouchableOpacity
                                    onPress={() => removeAllergy(item)}
                                    style={styles.allergyRemoveButton}
                                >
                                    <Ionicons name="close" size={14} color="#7D2E1F" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.recipeSectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Recipes</Text>
                    <Text style={styles.sectionSubtitle}>
                        {recipes.length ? `${strongMatches} strong matches found` : "Suggestions will appear here"}
                    </Text>
                </View>
                <View style={styles.recipeCounter}>
                    <Text style={styles.recipeCounterText}>{recipes.length}</Text>
                </View>
            </View>

            {recipes.length === 0 ? (
                <View style={styles.emptyRecipePanel}>
                    <Ionicons name="sparkles-outline" size={28} color="#D85F35" />
                    <Text style={styles.emptyRecipeTitle}>Ready when your pantry is.</Text>
                    <Text style={styles.emptyRecipeText}>
                        Add ingredients, tap Suggest, and your recipe shortlist will land here.
                    </Text>
                </View>
            ) : (
                recipes.map((item, index) => {
                    const matchPercent = Math.round(item.match * 100);

                    return (
                    <TouchableOpacity
                        key={`${item.recipe}-${index}`}
                        style={styles.recipeCard}
                        onPress={() => openRecipeDetails(item)}
                        activeOpacity={0.88}
                    >
                        {item.image ? (
                            <View style={styles.recipeImageWrap}>
                                <Image source={{ uri: item.image }} style={styles.recipeImage} />
                                <View style={styles.matchBadge}>
                                    <Text style={styles.matchBadgeText}>{matchPercent}% match</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.recipeImageFallback}>
                                <Ionicons name="restaurant-outline" size={30} color="#FDF8EF" />
                                <View style={styles.matchBadge}>
                                    <Text style={styles.matchBadgeText}>{matchPercent}% match</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.recipeBody}>
                            <Text style={styles.recipeTitle}>{item.recipe}</Text>

                            <Text style={styles.recipeMeta}>
                                {item.ingredients.slice(0, 6).join(", ")}
                                {item.ingredients.length > 6 ? "..." : ""}
                            </Text>

                            <View style={styles.recipeFooter}>
                                <View style={styles.missingPill}>
                                    <Ionicons
                                        name={item.missing.length ? "cart-outline" : "checkmark-circle"}
                                        size={15}
                                        color={item.missing.length ? "#A84A2B" : "#17351F"}
                                    />
                                    <Text
                                        style={[
                                            styles.missingPillText,
                                            !item.missing.length && styles.completePillText,
                                        ]}
                                    >
                                        {item.missing.length
                                            ? `${item.missing.length} missing`
                                            : "Ready to cook"}
                                    </Text>
                                </View>

                                <View style={styles.tapHint}>
                                    <Text style={styles.tapHintText}>Cook</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#FDF8EF" />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                    );
                })
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F7F1E6",
    },
    content: {
        paddingTop: 64,
        paddingHorizontal: 20,
        paddingBottom: 132,
    },
    hero: {
        backgroundColor: "#17351F",
        borderRadius: 30,
        padding: 22,
        minHeight: 184,
        marginBottom: 18,
        flexDirection: "row",
        alignItems: "flex-end",
        overflow: "hidden",
    },
    heroCopy: {
        flex: 1,
        paddingRight: 18,
    },
    eyebrow: {
        color: "#F0B36A",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        marginBottom: 10,
    },
    title: {
        fontSize: 34,
        fontWeight: "900",
        color: "#FDF8EF",
        lineHeight: 38,
    },
    subtitle: {
        fontSize: 15,
        color: "#C8D3BE",
        marginTop: 12,
        lineHeight: 22,
    },
    heroBadge: {
        width: 76,
        height: 76,
        borderRadius: 24,
        backgroundColor: "#FDF8EF",
        alignItems: "center",
        justifyContent: "center",
    },
    heroBadgeNumber: {
        color: "#D85F35",
        fontSize: 26,
        fontWeight: "900",
    },
    heroBadgeLabel: {
        color: "#17351F",
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    card: {
        backgroundColor: "#FFFCF6",
        borderRadius: 24,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#EFE3D0",
        shadowColor: "#1B170F",
        shadowOpacity: 0.07,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: "#17351F",
    },
    sectionSubtitle: {
        color: "#6F7E67",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 4,
    },
    sectionIcon: {
        width: 42,
        height: 42,
        borderRadius: 16,
        backgroundColor: "#DDEBCB",
        alignItems: "center",
        justifyContent: "center",
    },
    warningIcon: {
        backgroundColor: "#F6D9CC",
    },
    input: {
        backgroundColor: "#F7F1E6",
        color: "#17351F",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E8DCC9",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 10,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: "#D85F35",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
    },
    primaryButtonText: {
        color: "#FDF8EF",
        fontSize: 15,
        fontWeight: "800",
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: "#DDEBCB",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 7,
    },
    secondaryButtonFull: {
        backgroundColor: "#DDEBCB",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 7,
        marginBottom: 8,
    },
    secondaryButtonText: {
        color: "#17351F",
        fontSize: 15,
        fontWeight: "800",
    },
    emptyState: {
        backgroundColor: "#F7F1E6",
        borderRadius: 18,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    emptyText: {
        color: "#6F7E67",
        fontSize: 15,
        fontWeight: "600",
        marginTop: 8,
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 9,
        marginTop: 10,
    },
    ingredientChip: {
        backgroundColor: "#17351F",
        borderRadius: 999,
        paddingVertical: 9,
        paddingLeft: 14,
        paddingRight: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    ingredientChipText: {
        color: "#FDF8EF",
        fontSize: 14,
        fontWeight: "800",
        textTransform: "capitalize",
    },
    chipRemoveButton: {
        width: 22,
        height: 22,
        borderRadius: 999,
        backgroundColor: "#DDEBCB",
        alignItems: "center",
        justifyContent: "center",
    },
    allergyChip: {
        backgroundColor: "#F6D9CC",
        borderRadius: 999,
        paddingVertical: 9,
        paddingLeft: 14,
        paddingRight: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    allergyChipText: {
        color: "#7D2E1F",
        fontSize: 14,
        fontWeight: "800",
        textTransform: "capitalize",
    },
    allergyRemoveButton: {
        width: 22,
        height: 22,
        borderRadius: 999,
        backgroundColor: "#FFFCF6",
        alignItems: "center",
        justifyContent: "center",
    },
    recipeSectionHeader: {
        marginTop: 6,
        marginBottom: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    recipeCounter: {
        minWidth: 42,
        height: 42,
        borderRadius: 16,
        backgroundColor: "#17351F",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
    },
    recipeCounterText: {
        color: "#FDF8EF",
        fontSize: 16,
        fontWeight: "900",
    },
    emptyRecipePanel: {
        backgroundColor: "#FFFCF6",
        borderRadius: 24,
        padding: 22,
        marginTop: 14,
        borderWidth: 1,
        borderColor: "#EFE3D0",
    },
    emptyRecipeTitle: {
        color: "#17351F",
        fontSize: 18,
        fontWeight: "900",
        marginTop: 12,
    },
    emptyRecipeText: {
        color: "#6F7E67",
        fontSize: 14,
        lineHeight: 21,
        marginTop: 6,
    },
    recipeCard: {
        backgroundColor: "#FFFCF6",
        borderRadius: 24,
        marginTop: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#EFE3D0",
        shadowColor: "#1B170F",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 2,
    },
    recipeImageWrap: {
        height: 184,
        backgroundColor: "#17351F",
    },
    recipeImage: {
        width: "100%",
        height: "100%",
    },
    recipeImageFallback: {
        height: 156,
        backgroundColor: "#17351F",
        alignItems: "center",
        justifyContent: "center",
    },
    recipeBody: {
        padding: 16,
    },
    recipeTitle: {
        color: "#17351F",
        fontSize: 20,
        fontWeight: "900",
        lineHeight: 24,
    },
    matchBadge: {
        position: "absolute",
        top: 12,
        left: 12,
        backgroundColor: "#FDF8EF",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    matchBadgeText: {
        color: "#17351F",
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
    },
    recipeMeta: {
        color: "#6F7E67",
        fontSize: 14,
        marginTop: 9,
        lineHeight: 21,
    },
    recipeFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 16,
        gap: 10,
    },
    missingPill: {
        flex: 1,
        backgroundColor: "#F7F1E6",
        borderRadius: 999,
        paddingVertical: 9,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    missingPillText: {
        color: "#A84A2B",
        fontSize: 13,
        fontWeight: "800",
    },
    completePillText: {
        color: "#17351F",
    },
    tapHint: {
        backgroundColor: "#D85F35",
        borderRadius: 999,
        paddingVertical: 9,
        paddingHorizontal: 13,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    tapHintText: {
        color: "#FDF8EF",
        fontSize: 13,
        fontWeight: "900",
    },
    disabledButton: {
        opacity: 0.7,
    },
});
