from fastapi import FastAPI, HTTPException

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.recipeParser import RecipeParser

app = FastAPI(redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://cookmark-nine.vercel.app",
        "https://cookmark-git-main-natwijaya67s-projects.vercel.app"
        ],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UrlRequest(BaseModel):
    url: str

@app.post("/api/parse")
def parse_recipe(body: UrlRequest):
    try:
        parser = RecipeParser(body.url)
        return parser.parse()
    except Exception as e:
        print(f"Parse error: {e}")
        raise HTTPException(status_code=422, detail=str(e))

@app.get("/cron")
def run_cron():
    return {"status": "Cron executed"}