New-Item -ItemType Directory -Force -Path backend, mobile | Out-Null

@'
fastapi
uvicorn
pydantic
'@ | Set-Content backend\requirements.txt

@'
from pydantic import BaseModel
from typing import List

class PantryItem(BaseModel):
    name: str

class SuggestRequest(BaseModel):
    pantry: List[str]
'@ | Set-Content backend\models.py

@'
from fastapi import FastAPI
from models import PantryItem, SuggestRequest

app = FastAPI()

pantry = []

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/inventory")
def get_inventory():
    return pantry

@app.post("/inventory")
def add_item(item: PantryItem):
    pantry.append(item.name)
    return {"pantry": pantry}

@app.post("/suggest")
def suggest(req: SuggestRequest):
    recipes = [
        {"name": "Omelette", "ingredients": ["egg", "milk"]},
        {"name": "Grilled Cheese", "ingredients": ["bread", "cheese"]},
        {"name": "Pasta", "ingredients": ["pasta", "tomato"]}
    ]

    results = []

    for r in recipes:
        match = len(set(req.pantry) & set(r["ingredients"]))
        score = match / len(r["ingredients"])

        results.append({
            "recipe": r["name"],
            "match": score
        })

    results.sort(key=lambda x: x["match"], reverse=True)
    return results
'@ | Set-Content backend\main.py

@'
const API_URL = "http://localhost:8000";

export async function getSuggestions(pantry) {
  const res = await fetch(`${API_URL}/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pantry }),
  });

  return res.json();
}
'@ | Set-Content mobile\api.js

@'
import React, { useState } from "react";
import { View, Text, Button, TextInput, FlatList } from "react-native";
import { getSuggestions } from "./api";

export default function App() {
  const [ingredient, setIngredient] = useState("");
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);

  const addItem = () => {
    if (!ingredient.trim()) return;
    setPantry([...pantry, ingredient]);
    setIngredient("");
  };

  const fetchRecipes = async () => {
    const data = await getSuggestions(pantry);
    setRecipes(data);
  };

  return (
    <View style={{ padding: 40 }}>
      <Text>Add Ingredient</Text>

      <TextInput
        value={ingredient}
        onChangeText={setIngredient}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <Button title="Add to Pantry" onPress={addItem} />
      <View style={{ height: 10 }} />
      <Button title="Suggest Meals" onPress={fetchRecipes} />

      <FlatList
        data={recipes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text>{item.recipe} (match {item.match})</Text>
        )}
      />
    </View>
  );
}
'@ | Set-Content mobile\App.js

Write-Host "Done! Project files created."