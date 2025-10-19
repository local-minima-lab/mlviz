import json
from typing import Dict, Any, Optional
from datetime import datetime
from core.config import settings


class ModelCacheService:
    """Centralized caching service for ML models."""

    def __init__(self):
        self._cache: Dict[str, Any] = {}
        self.max_size = settings.cache_max_size
        self.enabled = settings.cache_enabled

    def generate_model_key(self, params: Dict[str, Any], dataset: Optional[Dict] = None) -> str:
        """Generate a unique key for model caching."""
        cache_data = {
            "params": params,
            "dataset": dataset
        }
        return json.dumps(cache_data, sort_keys=True)

    async def get(self, key: str) -> Optional[Any]:
        """Retrieve cached model data."""
        if not self.enabled:
            return None

        return self._cache.get(key)

    async def set(self, key: str, data: Any) -> None:
        """Store model data in cache."""
        if not self.enabled:
            return

        # Simple LRU-like behavior: remove oldest if at capacity
        if len(self._cache) >= self.max_size:
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]

        # Add timestamp to cached data
        if isinstance(data, dict):
            data = data.copy()
            data["cached_at"] = datetime.now().isoformat()

        self._cache[key] = data

    async def clear(self) -> None:
        """Clear all cached models."""
        self._cache.clear()

    def get_cache_info(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "enabled": self.enabled,
            "current_size": len(self._cache),
            "max_size": self.max_size,
            "keys": list(self._cache.keys()) if len(self._cache) < 20 else f"{len(self._cache)} keys"
        }


# Global cache instance
cache_service = ModelCacheService()
