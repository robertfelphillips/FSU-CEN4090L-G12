import requests


def search_recipes_by_ingredient(ingredient: str):
    url = f"https://www.themealdb.com/api/json/v1/1/filter.php?i={ingredient}"
    res = requests.get(url, timeout=10)
    res.raise_for_status()
    data = res.json()
    meals = data.get("meals") or []
    return meals


def get_recipe_details(meal_id: str):
    url = f"https://www.themealdb.com/api/json/v1/1/lookup.php?i={meal_id}"
    res = requests.get(url, timeout=10)
    res.raise_for_status()
    data = res.json()
    meals = data.get("meals") or []
    return meals[0] if meals else None


def normalize_mealdb_recipe(meal: dict):
    ingredients = []

    for i in range(1, 21):
        name = meal.get(f"strIngredient{i}")
        if name and name.strip():
            ingredients.append(name.strip().lower())

    return {
        "recipe": meal.get("strMeal", "Unknown"),
        "ingredients": ingredients,
        "source": meal.get("strSource") or meal.get("strYoutube") or "",
        "image": meal.get("strMealThumb") or "",
    }