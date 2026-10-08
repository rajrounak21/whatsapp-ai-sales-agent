from functools import lru_cache

from pymongo import MongoClient
from pymongo.database import Database

from .config import settings


@lru_cache(maxsize=1)

def get_client() -> MongoClient:
    return MongoClient(settings.mongo_uri,serverSelectionTimeoutMS=5000)

def get_db() -> Database:
    return get_client()[settings.db_name]



def tenants():
    return get_db()["tenants"]

def leads():
    return get_db()["leads"]
def messages():
    return get_db()["messages"]



def close_db() -> None:
    get_client().close()
    get_client.cache_clear()