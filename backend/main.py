from fastapi import FastAPI
from models import PantryItem, SuggestRequest, Preferences
import recipe_service
from local_recipes import LOCAL_RECIPES

app = FastAPI()

pantry = []
preferences = {"allergies": []}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/inventory")
def get_inventory():
    return pantry


@app.post("/inventory")
def add_item(item: PantryItem):
    pantry.append(item.name.lower())
    return {"pantry": pantry}


@app.delete("/inventory/{item_name}")
def delete_item(item_name: str):
    global pantry
    pantry = [item for item in pantry if item != item_name.lower()]
    return {"pantry": pantry}


@app.get("/preferences")
def get_preferences():
    return preferences


@app.post("/preferences")
def set_preferences(prefs: Preferences):
    global preferences
    preferences = {"allergies": [a.lower() for a in prefs.allergies]}
    return preferences


@app.post("/suggest")
def suggest(req: SuggestRequest):
    external_recipes = []

    try:
        seen_ids = set()

        for item in req.pantry[:3]:
            meals = recipe_service.search_recipes_by_ingredient(item)

            for meal in meals[:5]:
                meal_id = meal.get("idMeal")

                if meal_id and meal_id not in seen_ids:
                    seen_ids.add(meal_id)
                    details = recipe_service.get_recipe_details(meal_id)

                    if details:
                        external_recipes.append(recipe_service.normalize_mealdb_recipe(details))


    except Exception as e:
        print("External API failed, using local fallback:", e)
        external_recipes = []

    recipes = external_recipes if external_recipes else LOCAL_RECIPES

    results = []

    pantry_set = set(x.lower() for x in req.pantry)
    allergy_set = set(x.lower() for x in req.allergies)

    for r in recipes:
        ingredients = [x.lower() for x in r["ingredients"]]

        blocked = any(ingredient in allergy_set for ingredient in ingredients)
        if blocked:
            continue

        ingredient_set = set(ingredients)
        match_count = len(pantry_set & ingredient_set)
        score = match_count / len(ingredients) if ingredients else 0
        missing = [item for item in ingredients if item not in pantry_set]

        results.append({
            "recipe": r["recipe"],
            "ingredients": ingredients,
            "missing": missing,
            "match": score,
            "source": r.get("source", ""),
            "image": r.get("image", ""),
        })

    results.sort(key=lambda x: x["match"], reverse=True)
    return results

    
@app.get("/")
def root():
    return {"message": "Backend is running"}