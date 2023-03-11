import asyncio
import json
import os
import requests
import time

from aiohttp import ClientSession, TCPConnector
from pathlib import Path
from urllib.parse import urlparse
from typing import Any, AsyncGenerator, TypeVar

from .util import batched


T = TypeVar('T')


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
            data={"grant_type": "client_credentials"},
        )
        if response.status_code != 200:
            raise RuntimeError("Failed to authorize.")
        return response.json()['access_token']

    def get_static_resources(
        self,
        resources_with_context: list[tuple[str, T]],
        force: bool = False,
    ) -> AsyncGenerator[tuple[dict, int, T], None]:
        urls = [
            (f"https://us.api.blizzard.com{resource}", context)
            for resource, context in resources_with_context
        ]
        return self.get_urls(urls, "static-us", force)

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

    async def get_urls(
        self,
        urls_with_context: list[tuple[str, T]],
        namespace: str = "static-us",
        force: bool = False,
    ) -> AsyncGenerator[tuple[dict, int, T], None]:

        uncached_urls_with_context = []
        for url, context in urls_with_context:
            response_json = None
            if not force:
                response_json = self._cache.get(url)

            if response_json is None:
                uncached_urls_with_context.append((url, context))
            else:
                yield response_json, 200, context

        connector = TCPConnector(limit_per_host=100)
        if len(uncached_urls_with_context) == 0:
            return
        await asyncio.sleep(1)
        async with ClientSession(connector=connector) as session:
            for urls in batched(uncached_urls_with_context, 100):
                start_time = 0
                tasks = []
                for url, context in urls:
                    task = asyncio.create_task(
                        self._fetch(url, context, namespace, session))
                    tasks.append(task)

                for task in asyncio.as_completed(tasks):
                    response_json, status, url, context = await task
                    if start_time == 0:
                        start_time = time.monotonic()

                    yield response_json, status, context

                time_elapsed = time.monotonic() - start_time
                if time_elapsed < 1.2:
                    await asyncio.sleep(1.2 - time_elapsed)

    async def _fetch(
        self,
        url: str,
        context: T,
        namespace: str,
        session: ClientSession,
    ) -> tuple[dict | None, int, str, T]:
        while True:
            async with session.get(
                url,
                headers=self.headers,
                params={
                    'namespace': namespace,
                    'locale': 'en_US',
                }
            ) as response:
                json = None
                if response.status == 429:
                    print("Rate limited. Retrying in 2 seconds.")
                    await asyncio.sleep(2)
                    continue

                if response.status == 200:
                    json = await response.json()
                    self._cache.put(url, json)
                return json, response.status, url, context
