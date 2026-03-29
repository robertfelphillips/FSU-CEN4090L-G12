from pydantic import BaseModel
from typing import List

class PantryItem(BaseModel):
    name: str

class SuggestRequest(BaseModel):
    pantry: List[str]
    allergies: List[str] = []

class Preferences(BaseModel):
    allergies: List[str]