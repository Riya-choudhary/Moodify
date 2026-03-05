from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
from dotenv import load_dotenv
from typing import List, Optional

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["heart_song_forge"]

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# ---------- Models ----------
class User(BaseModel):
    username: str
    password: str


class MoodEntry(BaseModel):
    emotion: str
    playlists: List[str]


class FavoriteEntry(BaseModel):
    username: str
    playlist_title: str
    playlist_url: Optional[str] = None


class RecentEntry(BaseModel):
    username: str
    playlist_title: str
    playlist_url: Optional[str] = None


# ---------- Helpers ----------
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_user(username: str):
    return await db.users.find_one({"username": username})


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        user = await get_user(username)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Routes ----------
@app.post("/register")
async def register(user: User):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = pwd_context.hash(user.password)
    await db.users.insert_one({
        "username": user.username,
        "password": hashed_pw,
        "history": [],
        "favorites": [],
        "recent": []
    })
    return {"msg": "User registered successfully"}


@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"username": form_data.username})
    if not user or not pwd_context.verify(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token(
        {"sub": user["username"]},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer", "username": user["username"]}


# Save a final emotion with an array of playlists (one document per detection)
@app.post("/api/emotion")
async def save_emotion(data: dict):
    username = data.get("username")
    emotion = data.get("emotion")
    playlists = data.get("playlists", [])

    if not username:
        return {"error": "Username required"}

    user = await db.users.find_one({"username": username})
    if not user:
        return {"error": "User not found"}

    history_entry = {
        "emotion": emotion,
        "playlists": playlists,
        "timestamp": datetime.utcnow()
    }
    await db.users.update_one(
        {"username": username},
        {"$push": {"history": history_entry}}
    )

    return {"message": "Emotion history saved"}


# Add a favorite (idempotent)
@app.post("/api/favorite")
async def add_favorite(entry: FavoriteEntry):
    username = entry.username
    if not username:
        raise HTTPException(status_code=400, detail="username required")
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    # Only add if not already present (match by title)
    await db.users.update_one(
        {"username": username, "favorites.title": {"$ne": entry.playlist_title}},
        {"$push": {"favorites": {"title": entry.playlist_title, "url": entry.playlist_url, "added_at": datetime.utcnow()}}}
    )
    return {"message": "Favorite added"}


# Remove favorite
@app.post("/api/favorite/remove")
async def remove_favorite(entry: FavoriteEntry):
    username = entry.username
    await db.users.update_one(
        {"username": username},
        {"$pull": {"favorites": {"title": entry.playlist_title}}}
    )
    return {"message": "Favorite removed"}


# Get favorites
@app.get("/api/favorites/{username}")
async def get_favorites(username: str):
    user = await db.users.find_one({"username": username}, {"_id": 0, "favorites": 1})
    if not user:
        return {"favorites": []}
    return {"favorites": user.get("favorites", [])}


# Add to recent (keep recent list limited to last 20)
@app.post("/api/recent")
async def add_recent(entry: RecentEntry):
    username = entry.username
    if not username:
        raise HTTPException(status_code=400, detail="username required")
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    # push new item and trim to 20
    await db.users.update_one(
        {"username": username},
        {"$push": {"recent": {"$each": [{"title": entry.playlist_title, "url": entry.playlist_url, "played_at": datetime.utcnow()}], "$position": 0}}}
    )
    # trim to 20
    await db.users.update_one({"username": username}, {"$push": {"recent": {"$each": [], "$slice": 20}}})
    return {"message": "Recent updated"}


# Get recent
@app.get("/api/recent/{username}")
async def get_recent(username: str):
    user = await db.users.find_one({"username": username}, {"_id": 0, "recent": 1})
    if not user:
        return {"recent": []}
    return {"recent": user.get("recent", [])}


# Get history for profile (returns list of history entries with playlists array)
@app.get("/api/history/{username}")
async def get_history(username: str):
    user = await db.users.find_one({"username": username}, {"_id": 0, "history": 1})
    if not user:
        return {"history": []}
    return {"history": user.get("history", [])}


# Optional: update password endpoint used by your frontend
@app.post("/api/update-password")
async def update_password(data: dict):
    username = data.get("username")
    new_password = data.get("new_password")
    if not username or not new_password:
        raise HTTPException(status_code=400, detail="username and new_password required")
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    hashed_pw = pwd_context.hash(new_password)
    await db.users.update_one({"username": username}, {"$set": {"password": hashed_pw}})
    return {"message": "Password updated"}
