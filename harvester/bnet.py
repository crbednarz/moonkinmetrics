import json
import os
import requests

from pathlib import Path
from urllib.parse import urlparse
from typing import Any


class _ApiCache:
    def __init__(self, path: str):
        self.path = path
        Path(path).mkdir(parents=True, exist_ok=True)

    def get(self, url: str) -> Any | None:
        filename = self._url_to_cache_name(url)
        path = os.path.join(self.path, filename)
        if not os.path.exists(path):
            return None

        with open(path, 'r', encoding='utf-8') as file:
            return json.load(file)

    def put(self, url: str, obj: Any) -> None:
        filename = self._url_to_cache_name(url)
        path = os.path.join(self.path, filename)
        with open(path, 'w', encoding='utf-8') as file:
            return json.dump(obj, file)

    def _url_to_cache_name(self, url: str) -> str:
        return f"{urlparse(url).path.replace('/', '-')}.json"


class Client:
    def __init__(self, client_id: str, client_secret: str,
                 cache_path: str = '.cache'):
        token = self._create_token(client_id, client_secret)
        self.headers = {
            'accept': 'application/json',
            "Authorization": f"Bearer {token}"
        }
        self.data = {
            "namespace": "static-us",
        }
        self._cache = _ApiCache(cache_path)

    def _create_token(self, client_id: str, client_secret: str) -> str:
        response = requests.post(
            "https://oauth.battle.net/token",
            auth=(client_id, client_secret),
            data={
                "grant_type": "client_credentials",
            },
        )
        if response.status_code != 200:
            raise RuntimeError("Failed to authorize.")
        return response.json()['access_token']

    def get_static_resource(self, resource: str,
                            params: dict[str, Any] | None = None,
                            force: bool = False) -> dict:
        url = f"https://us.api.blizzard.com{resource}"
        return self.get_url(url, params, "static-us", force)

    def get_dynamic_resource(self, resource: str,
                             params: dict[str, Any] | None = None,
                             force: bool = False) -> dict:
        url = f"https://us.api.blizzard.com{resource}"
        return self.get_url(url, params, "dynamic-us", force)

    def get_profile_resource(self, resource: str,
                             params: dict[str, Any] | None = None,
                             force: bool = False) -> dict:
        url = f"https://us.api.blizzard.com{resource}"
        return self.get_url(url, params, "profile-us", force)

    def get_url(self, url: str,
                params: dict[str, Any] | None = None,
                namespace: str = "static-us",
                force: bool = False) -> dict:
        if params is None:
            params = {}

        response_json = None
        if not force:
            response_json = self._cache.get(url)

        if response_json is None:
            response = requests.get(
                url,
                headers=self.headers,
                params=params | {
                    'namespace': namespace,
                    'locale': 'en_US',
                }
            )

            if response.status_code != 200:
                raise RuntimeError(f"Failed to get \"{url}\": {response.text}")

            response_json = response.json()

        self._cache.put(url, response_json)

        return response_json
