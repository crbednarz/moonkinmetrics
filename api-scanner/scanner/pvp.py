from dataclasses import dataclass

from .bnet import Client
from .constants import CURRENT_PVP_SEASON
from .player import PlayerLink, PlayerLoadout, RealmLink


@dataclass
class LeaderboardEntry:
    player: PlayerLink
    faction: str
    rating: int


@dataclass
class RatedLoadout:
    player: PlayerLink
    loadout: PlayerLoadout
    faction: str
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
        realm = RealmLink(
            player["character"]["realm"]["slug"],
            player["character"]["realm"]["key"]["href"],
        )
        rating = player["rating"]
        faction = player["faction"]["type"]
        leaderboard.append(
            LeaderboardEntry(PlayerLink(realm, name), faction, rating)
        )

    return leaderboard
