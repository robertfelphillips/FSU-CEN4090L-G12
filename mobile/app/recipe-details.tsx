import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const instructionSteps = (instructions: string) => {
    return instructions
        .split(/\r?\n+/)
        .map((step) => step.trim())
        .filter(Boolean);
};

const firstStringParam = (value: string | string[] | undefined) => {
    return Array.isArray(value) ? value[0] : value || "";
};

type NutritionFacts = {
    calories?: string;
    protein?: string;
    carbohydrates?: string;
    fat?: string;
    saturatedFat?: string;
    fiber?: string;
    sugar?: string;
    sodium?: string;
    servingSize?: string;
};

const NUTRITION_LABELS: { key: keyof NutritionFacts; label: string }[] = [
    { key: "calories", label: "Calories" },
    { key: "protein", label: "Protein" },
    { key: "carbohydrates", label: "Carbs" },
    { key: "fat", label: "Fat" },
    { key: "saturatedFat", label: "Sat fat" },
    { key: "fiber", label: "Fiber" },
    { key: "sugar", label: "Sugar" },
    { key: "sodium", label: "Sodium" },
    { key: "servingSize", label: "Serving" },
];

const textFromHtml = (value: unknown) => {
    return typeof value === "string"
        ? value
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
        : "";
};

const decodeHtmlEntities = (value: string) => {
    return value
        .replace(/&quot;/g, "\"")
        .replace(/&#34;/g, "\"")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'");
};

const normalizeNutrition = (nutrition: Record<string, unknown> | undefined) => {
    if (!nutrition) return null;

    const facts: NutritionFacts = {
        calories: textFromHtml(nutrition.calories),
        protein: textFromHtml(nutrition.proteinContent),
        carbohydrates: textFromHtml(nutrition.carbohydrateContent),
        fat: textFromHtml(nutrition.fatContent),
        saturatedFat: textFromHtml(nutrition.saturatedFatContent),
        fiber: textFromHtml(nutrition.fiberContent),
        sugar: textFromHtml(nutrition.sugarContent),
        sodium: textFromHtml(nutrition.sodiumContent),
        servingSize: textFromHtml(nutrition.servingSize),
    };

    return NUTRITION_LABELS.some(({ key }) => Boolean(facts[key])) ? facts : null;
};

const flattenJsonLd = (value: unknown): Record<string, unknown>[] => {
    if (Array.isArray(value)) {
        return value.flatMap(flattenJsonLd);
    }

    if (value && typeof value === "object") {
        const item = value as Record<string, unknown>;
        const graphItems = Array.isArray(item["@graph"]) ? flattenJsonLd(item["@graph"]) : [];
        return [item, ...graphItems];
    }

    return [];
};

const nutritionFromJsonLd = (html: string) => {
    const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = scriptPattern.exec(html))) {
        try {
            const json = JSON.parse(decodeHtmlEntities(match[1]).trim());
            const items = flattenJsonLd(json);
            const recipeItem = items.find((item) => item.nutrition);
            const facts = normalizeNutrition(recipeItem?.nutrition as Record<string, unknown> | undefined);

            if (facts) return facts;
        } catch (error) {
            console.log("Error parsing nutrition JSON-LD:", error);
        }
    }

    return null;
};

const nutritionFromHtmlText = (html: string) => {
    const pageText = textFromHtml(html);
    const findValue = (label: string) => {
        const pattern = new RegExp(`${label}[^\\d]{0,24}([\\d,.]+\\s?(?:kcal|calories|cal|g|mg)?)`, "i");
        return pageText.match(pattern)?.[1]?.trim();
    };

    const facts: NutritionFacts = {
        calories: findValue("calories|kcal|energy"),
        protein: findValue("protein"),
        carbohydrates: findValue("carbohydrates|carbs"),
        fat: findValue("fat"),
        saturatedFat: findValue("saturated fat|saturates"),
        fiber: findValue("fiber|fibre"),
        sugar: findValue("sugar|sugars"),
        sodium: findValue("sodium|salt"),
    };

    return NUTRITION_LABELS.some(({ key }) => Boolean(facts[key])) ? facts : null;
};

export default function RecipeDetailsScreen() {
    const params = useLocalSearchParams();

    const id = firstStringParam(params.id);
    const recipe = String(params.recipe || "Recipe");
    const initialInstructions = String(params.instructions || "");
    const initialSource = String(params.source || "");
    const image = String(params.image || "");
    const match = String(params.match || "0");
    const [instructions, setInstructions] = useState(initialInstructions);
    const [source, setSource] = useState(initialSource);
    const [loadingInstructions, setLoadingInstructions] = useState(!initialInstructions);
    const [nutrition, setNutrition] = useState<NutritionFacts | null>(null);
    const [checkingNutrition, setCheckingNutrition] = useState(false);
    const [showNutrition, setShowNutrition] = useState(false);
    const steps = instructionSteps(instructions);

    const ingredients = params.ingredients
        ? JSON.parse(String(params.ingredients))
        : [];

    const missing = params.missing
        ? JSON.parse(String(params.missing))
        : [];

    useEffect(() => {
        if (initialInstructions) {
            setLoadingInstructions(false);
            return;
        }

        const loadInstructions = async () => {
            try {
                const fetchMealById = async (mealId: string) => {
                    const res = await fetch(
                        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(mealId)}`
                    );
                    const data = await res.json();
                    return data.meals?.[0];
                };

                const findMealByName = async () => {
                    const res = await fetch(
                        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(recipe)}`
                    );
                    const data = await res.json();
                    const meals = data.meals || [];
                    return (
                        meals.find(
                            (item: { strMeal?: string }) =>
                                item.strMeal?.toLowerCase() === recipe.toLowerCase()
                        ) || meals[0]
                    );
                };

                const findMealByIngredients = async () => {
                    for (const ingredient of ingredients.slice(0, 5)) {
                        const res = await fetch(
                            `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
                        );
                        const data = await res.json();
                        const match = data.meals?.find(
                            (item: { strMeal?: string }) =>
                                item.strMeal?.toLowerCase() === recipe.toLowerCase()
                        );

                        if (match?.idMeal) {
                            return fetchMealById(match.idMeal);
                        }
                    }

                    return null;
                };

                const meal = id
                    ? await fetchMealById(id)
                    : (await findMealByName()) || (await findMealByIngredients());

                if (meal?.strInstructions) {
                    setInstructions(meal.strInstructions);
                }

                if (!initialSource && (meal?.strSource || meal?.strYoutube)) {
                    setSource(meal.strSource || meal.strYoutube);
                }
            } catch (error) {
                console.log("Error loading recipe instructions:", error);
            } finally {
                setLoadingInstructions(false);
            }
        };

        loadInstructions();
    }, [id, initialInstructions, initialSource, recipe]);

    useEffect(() => {
        if (!source) {
            setNutrition(null);
            setCheckingNutrition(false);
            return;
        }

        const loadNutrition = async () => {
            try {
                setCheckingNutrition(true);
                const res = await fetch(source);
                const html = await res.text();
                setNutrition(nutritionFromJsonLd(html) || nutritionFromHtmlText(html));
            } catch (error) {
                console.log("Error loading nutrition facts:", error);
                setNutrition(null);
            } finally {
                setCheckingNutrition(false);
            }
        };

        loadNutrition();
    }, [source]);

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.hero}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.heroImage} />
                ) : (
                    <View style={styles.heroFallback}>
                        <Ionicons name="restaurant-outline" size={38} color="#FDF8EF" />
                    </View>
                )}
                <View style={styles.heroShade} />

                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color="#17351F" />
                </TouchableOpacity>

                <View style={styles.heroText}>
                    <View style={styles.badge}>
                        <Ionicons name="sparkles" size={14} color="#17351F" />
                        <Text style={styles.badgeText}>{match}% Match</Text>
                    </View>
                    <Text style={styles.title}>{recipe}</Text>
                </View>
            </View>

            <View style={styles.quickStats}>
                <View style={styles.statTile}>
                    <Ionicons name="leaf" size={18} color="#17351F" />
                    <Text style={styles.statNumber}>{ingredients.length}</Text>
                    <Text style={styles.statLabel}>ingredients</Text>
                </View>
                <View style={styles.statTile}>
                    <Ionicons name="cart" size={18} color="#A84A2B" />
                    <Text style={styles.statNumber}>{missing.length}</Text>
                    <Text style={styles.statLabel}>missing</Text>
                </View>
            </View>

            <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <View style={styles.chipWrap}>
                    {ingredients.length ? (
                        ingredients.map((item: string, index: number) => (
                            <View key={`${item}-${index}`} style={styles.ingredientChip}>
                                <Text style={styles.ingredientChipText}>{item}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.bodyText}>No ingredients listed.</Text>
                    )}
                </View>
            </View>

            {missing.length ? (
                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Grab Before Cooking</Text>
                    <View style={styles.chipWrap}>
                        {missing.map((item: string, index: number) => (
                            <View key={`${item}-${index}`} style={styles.missingChip}>
                                <Text style={styles.missingChipText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}

            <View style={styles.instructionBlock}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {loadingInstructions ? (
                    <Text style={styles.bodyText}>Loading instructions...</Text>
                ) : steps.length ? (
                    steps.map((step, index) => (
                        <View key={`${index}-${step.slice(0, 18)}`} style={styles.stepRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.stepText}>{step}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.bodyText}>No instructions available.</Text>
                )}
            </View>

            {source ? (
                <>
                {checkingNutrition ? (
                    <View style={styles.nutritionStatus}>
                        <Ionicons name="nutrition-outline" size={18} color="#6F7E67" />
                        <Text style={styles.nutritionStatusText}>Checking nutrition facts...</Text>
                    </View>
                ) : nutrition ? (
                    <View style={styles.nutritionBlock}>
                        <TouchableOpacity
                            style={styles.nutritionHeader}
                            onPress={() => setShowNutrition((current) => !current)}
                            activeOpacity={0.86}
                        >
                            <View style={styles.nutritionHeaderCopy}>
                                <Ionicons name="nutrition" size={20} color="#17351F" />
                                <Text style={styles.nutritionTitle}>Nutrition facts available</Text>
                            </View>
                            <Ionicons
                                name={showNutrition ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#17351F"
                            />
                        </TouchableOpacity>

                        {showNutrition ? (
                            <View style={styles.nutritionGrid}>
                                {NUTRITION_LABELS.filter(({ key }) => nutrition[key]).map(({ key, label }) => (
                                    <View key={key} style={styles.nutritionTile}>
                                        <Text style={styles.nutritionValue}>{nutrition[key]}</Text>
                                        <Text style={styles.nutritionLabel}>{label}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}
                    </View>
                ) : null}

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(source)}
                    activeOpacity={0.86}
                >
                    <Text style={styles.linkButtonText}>Open Recipe Website</Text>
                    <Ionicons name="open-outline" size={18} color="#FDF8EF" />
                </TouchableOpacity>
                </>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F7F1E6",
    },
    content: {
        paddingBottom: 60,
    },
    hero: {
        width: "100%",
        height: 360,
        backgroundColor: "#17351F",
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    heroFallback: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    heroShade: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "rgba(18, 28, 20, 0.32)",
    },
    backButton: {
        position: "absolute",
        top: 54,
        left: 20,
        width: 42,
        height: 42,
        borderRadius: 16,
        backgroundColor: "#FDF8EF",
        alignItems: "center",
        justifyContent: "center",
    },
    heroText: {
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 24,
    },
    title: {
        fontSize: 38,
        fontWeight: "900",
        color: "#FDF8EF",
        lineHeight: 42,
        marginTop: 12,
    },
    badge: {
        alignSelf: "flex-start",
        backgroundColor: "#FDF8EF",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    badgeText: {
        color: "#17351F",
        fontWeight: "900",
        fontSize: 12,
        textTransform: "uppercase",
    },
    quickStats: {
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 20,
        marginTop: -28,
        marginBottom: 8,
    },
    statTile: {
        flex: 1,
        backgroundColor: "#FFFCF6",
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EFE3D0",
    },
    statNumber: {
        color: "#17351F",
        fontSize: 24,
        fontWeight: "900",
        marginTop: 8,
    },
    statLabel: {
        color: "#6F7E67",
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        marginTop: 2,
    },
    sectionBlock: {
        paddingHorizontal: 20,
        paddingTop: 18,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: "#17351F",
        marginBottom: 12,
    },
    bodyText: {
        fontSize: 15,
        color: "#6F7E67",
        lineHeight: 24,
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 9,
    },
    ingredientChip: {
        backgroundColor: "#FFFCF6",
        borderColor: "#EFE3D0",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 13,
        paddingVertical: 9,
    },
    ingredientChipText: {
        color: "#17351F",
        fontSize: 13,
        fontWeight: "800",
        textTransform: "capitalize",
    },
    missingChip: {
        backgroundColor: "#F6D9CC",
        borderRadius: 999,
        paddingHorizontal: 13,
        paddingVertical: 9,
    },
    missingChipText: {
        color: "#7D2E1F",
        fontSize: 13,
        fontWeight: "800",
        textTransform: "capitalize",
    },
    instructionBlock: {
        marginHorizontal: 20,
        marginTop: 22,
        backgroundColor: "#FFFCF6",
        borderRadius: 26,
        padding: 18,
        borderWidth: 1,
        borderColor: "#EFE3D0",
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#D85F35",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    stepNumberText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        color: "#304838",
        lineHeight: 23,
    },
    nutritionStatus: {
        marginHorizontal: 20,
        marginTop: 18,
        backgroundColor: "#FFFCF6",
        borderRadius: 18,
        paddingVertical: 13,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "#EFE3D0",
    },
    nutritionStatusText: {
        color: "#6F7E67",
        fontSize: 14,
        fontWeight: "700",
    },
    nutritionBlock: {
        marginHorizontal: 20,
        marginTop: 18,
        backgroundColor: "#DDEBCB",
        borderRadius: 24,
        padding: 14,
        borderWidth: 1,
        borderColor: "#C9DDB2",
    },
    nutritionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    nutritionHeaderCopy: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    nutritionTitle: {
        color: "#17351F",
        fontSize: 15,
        fontWeight: "900",
    },
    nutritionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 14,
    },
    nutritionTile: {
        width: "47%",
        backgroundColor: "#FDF8EF",
        borderRadius: 16,
        padding: 12,
    },
    nutritionValue: {
        color: "#17351F",
        fontSize: 16,
        fontWeight: "900",
    },
    nutritionLabel: {
        color: "#6F7E67",
        fontSize: 11,
        fontWeight: "800",
        marginTop: 4,
        textTransform: "uppercase",
    },
    linkButton: {
        backgroundColor: "#17351F",
        borderRadius: 20,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 20,
        marginTop: 18,
        flexDirection: "row",
        gap: 8,
    },
    linkButtonText: {
        color: "#FDF8EF",
        fontSize: 15,
        fontWeight: "900",
    },
});
