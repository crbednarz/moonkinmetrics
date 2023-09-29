import asyncio
import json
import os
import requests
import time

from aiohttp import ClientSession, TCPConnector
from pathlib import Path
from urllib.parse import urlparse
from typing import Any, AsyncGenerator, Optional, TypeVar

from .util import batched


T = TypeVar('T')
MAX_EXCEPTION_RETRIES = 5


class _ApiCache:
    def __init__(self, path: str, region: str):
        self.path = path
        self.region = region
        Path(path).mkdir(parents=True, exist_ok=True)

    def get(self, url: str) -> Optional[Any]:
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
        region = self.region
        return f"{urlparse(url).path.replace('/', '-')}.{region}.json"


class Client:
    def __init__(self, client_id: str, client_secret: str,
                 cache_path: str = '.cache',
                 region: str = 'us'):
        token = self._create_token(client_id, client_secret)
        self.headers = {
            'accept': 'application/json',
            "Authorization": f"Bearer {token}"
        }
        self._locale = 'en_US' if str == 'us' else 'en_GB'
        self._cache = _ApiCache(cache_path, region)
        self.region = region

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
        use_cache: bool = True,
    ) -> AsyncGenerator[tuple[dict, int, T], None]:
        region = self.region
        urls = [
            (f"https://{region}.api.blizzard.com{resource}", context)
            for resource, context in resources_with_context
        ]
        return self.get_urls(urls, "static", use_cache)

    def get_static_resource(self, resource: str,
                            params: Optional[dict[str, Any]] = None,
                            use_cache: bool = True) -> dict:
        region = self.region
        url = f"https://{region}.api.blizzard.com{resource}"
        return self.get_url(url, params, "static", use_cache)

    def get_dynamic_resource(self, resource: str,
                             params: Optional[dict[str, Any]] = None,
                             use_cache: bool = True) -> dict:
        region = self.region
        url = f"https://{region}.api.blizzard.com{resource}"
        return self.get_url(url, params, "dynamic", use_cache)

    def get_profile_resources(
        self,
        resources_with_context: list[tuple[str, T]],
        use_cache: bool = True,
    ) -> AsyncGenerator[tuple[dict, int, T], None]:
        region = self.region
        urls = [
            (f"https://{region}.api.blizzard.com{resource}", context)
            for resource, context in resources_with_context
        ]
        return self.get_urls(urls, "profile", use_cache)

    def get_profile_resource(self, resource: str,
                             params: Optional[dict[str, Any]] = None,
                             use_cache: bool = True) -> dict:
        region = self.region
        url = f"https://{region}.api.blizzard.com{resource}"
        return self.get_url(url, params, "profile", use_cache)

    def get_url(self, url: str,
                params: Optional[dict[str, Any]] = None,
                namespace: str = "static",
                use_cache: bool = True) -> dict:
        namespace = f"{namespace}-{self.region}"

        if params is None:
            params = {}

        response_json = None
        if use_cache:
            response_json = self._cache.get(url)

        if response_json is None:
            while True:
                response = requests.get(
                    url,
                    headers=self.headers,
                    params=params | {
                        'namespace': namespace,
                        'locale': self._locale,
                    }
                )

                if (response.status_code == 429 or
                   response.status_code == 500):
                    time.sleep(2)
                    continue
                break

            if response.status_code != 200:
                text = response.text
                raise RuntimeError(f"Failed to get \"{url}\": {text}")

            response_json = response.json()

        if use_cache:
            self._cache.put(url, response_json)

        return response_json

    async def get_urls(
        self,
        urls_with_context: list[tuple[str, T]],
        namespace: str = "static",
        use_cache: bool = True,
    ) -> AsyncGenerator[tuple[dict, int, T], None]:
        namespace = f"{namespace}-{self.region}"

        uncached_urls_with_context = []
        for url, context in urls_with_context:
            response_json = None
            if use_cache:
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
                        self._async_fetch(url, context, namespace, session))
                    tasks.append(task)

                for task in asyncio.as_completed(tasks):
                    response_json, status, url, context = await task
                    if start_time == 0:
                        start_time = time.monotonic()

                    if use_cache and status == 200:
                        self._cache.put(url, response_json)

                    yield response_json, status, context

                time_elapsed = time.monotonic() - start_time
                if time_elapsed < 1.2:
                    await asyncio.sleep(1.2 - time_elapsed)

    async def _async_fetch(
        self,
        url: str,
        context: T,
        namespace: str,
        session: ClientSession,
    ) -> tuple[Optional[dict], int, str, T]:
        exception_count = 0
        while True:
            try:
                async with session.get(
                    url,
                    headers=self.headers,
                    params={
                        'namespace': namespace,
                        'locale': self._locale,
                    },
                ) as response:
                    json = None
                    if (response.status == 429 or
                       response.status == 500):
                        await asyncio.sleep(2)
                        continue

                    if response.status == 200:
                        json = await response.json()

                    return json, response.status, url, context
            except Exception as e:
                exception_count += 1
                if exception_count > MAX_EXCEPTION_RETRIES:
                    raise e
                await asyncio.sleep(5)
