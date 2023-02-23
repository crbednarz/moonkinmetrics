import requests

from typing import Any


class Client:
    def __init__(self, client_id: str, client_secret: str):
        token = self._create_token(client_id, client_secret)
        self.headers = {
            'accept': 'application/json',
            "Authorization": f"Bearer {token}"
        }
        self.data = {
            "namespace": "static-us",
        }

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
                            params: dict[str, Any] | None = None) -> dict:
        url = f"https://us.api.blizzard.com{resource}"
        return self.get_url(url, params, "static-us")

    def get_dynamic_resource(self, resource: str,
                             params: dict[str, Any] | None = None) -> dict:
        url = f"https://us.api.blizzard.com{resource}"
        return self.get_url(url, params, "dynamic-us")

    def get_profile_resource(self, resource: str,
                             params: dict[str, Any] | None = None) -> dict:
        url = f"https://us.api.blizzard.com{resource}"
        return self.get_url(url, params, "profile-us")

    def get_url(self, url: str,
                params: dict[str, Any] | None = None,
                namespace: str = "static-us") -> dict:
        if params is None:
            params = {}

        response = requests.get(
            url,
            headers=self.headers,
            params=params | {
                'namespace': namespace,
                'locale': 'en_US',
            }
        )

        if response.status_code != 200:
            raise RuntimeError(f"Failed to get \"{url}\" - {response.text}")

        return response.json()
