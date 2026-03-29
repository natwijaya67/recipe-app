from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.recipeParser import RecipeParser

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "cookmark-nine.vercel.app",
        "cookmark-mztriba2n-natwijaya67s-projects.vercel.app"
        ],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UrlRequest(BaseModel):
    url: str

@app.post("/api/parse")
def parse_recipe(body: UrlRequest):
    parser = RecipeParser(body.url)
    return parser.parse()