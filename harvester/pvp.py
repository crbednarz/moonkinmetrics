from dataclasses import dataclass
from typing import Generator

from .bnet import Client
from .constants import CURRENT_PVP_SEASON
from .player import PlayerLink, PlayerLoadout, get_player_loadout


@dataclass
class LeaderboardEntry:
    player: PlayerLink
    rating: int


@dataclass
class RatedLoadout:
    loadout: PlayerLoadout
    rating: int


def get_pvp_leaderboard(client: Client,
                        bracket: str) -> list[LeaderboardEntry]:
    resource = ("/data/wow/"
                f"pvp-season/{CURRENT_PVP_SEASON}/"
                f"pvp-leaderboard/{bracket}")
    response = client.get_dynamic_resource(resource)
    leaderboard = []

    for player in response["entries"]:
        name = player["character"]["name"]
        realm = player["character"]["realm"]["slug"]
        rating = player["rating"]
        leaderboard.append(
            LeaderboardEntry(PlayerLink(realm, name), rating)
        )

    return leaderboard
