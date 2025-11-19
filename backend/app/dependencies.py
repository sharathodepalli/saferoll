"""Simple dependency container for routers."""

from functools import lru_cache

from .policy import PolicyEngine
from .store import Store

@lru_cache
def get_store() -> Store:
    return Store()

@lru_cache
def get_policy() -> PolicyEngine:
    return PolicyEngine(store=get_store())
