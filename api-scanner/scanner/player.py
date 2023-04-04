from dataclasses import dataclass
from enum import Enum
from typing import AsyncGenerator, Optional, TypeVar

from .bnet import Client
from .constants import CLASS_SPEC_BY_SPEC_ID


@dataclass
class RealmLink:
    slug: str
    url: str


@dataclass
class Realm:
    id: int
    name: str
    slug: str
    url: str


@dataclass
class PlayerLink:
    realm: RealmLink
    name: str

    @property
    def full_name(self) -> str:
        return f"{self.name} - {self.realm.slug}"

    @property
    def specialization_resource(self) -> str:
        return (f"/profile/wow/character/"
                f"{self.realm.slug}/{self.name.lower()}/specializations")

    @property
    def profile_resource(self) -> str:
        return (f"/profile/wow/character/"
                f"{self.realm.slug}/{self.name.lower()}")


@dataclass
class LoadoutNode:
    node_id: int
    talent_id: int
    rank: int


@dataclass
class LoadoutPvpTalent:
    id: int


@dataclass
class PlayerLoadout:
    class_name: str
    spec_name: str
    class_nodes: list[LoadoutNode]
    spec_nodes: list[LoadoutNode]
    pvp_talents: list[LoadoutPvpTalent]


class MissingPlayerError(Exception):
    def __init__(self, player: PlayerLink):
        self._player = player
        super().__init__(f"Cannot find {player.full_name}")


class LoadoutRequestStatus(Enum):
    SUCCESS = 1
    MISSING_PLAYER = 2
    ERROR = 3


T = TypeVar('T')


async def get_player_loadouts(
    client: Client,
    players_with_context: list[tuple[PlayerLink, T]],
    override_spec: Optional[str] = None
) -> AsyncGenerator[
    tuple[Optional[PlayerLoadout], PlayerLink, T, LoadoutRequestStatus],
    None,
]:
    urls_with_context = [
        (
            player.specialization_resource,
            (player, context)
        ) for player, context in players_with_context
    ]

    async for result in client.get_profile_resources(
        urls_with_context,
        use_cache=False,
    ):
        response, status, (player, context) = result
        if status != 200:
            yield None, player, context, LoadoutRequestStatus.MISSING_PLAYER
            continue

        spec_id = response['active_specialization']['id']
        (class_name, spec_name) = CLASS_SPEC_BY_SPEC_ID[spec_id]
        if override_spec is not None:
            spec_name = override_spec

        try:
            json_loadout = _get_active_loadout(player, spec_name, response)
            loadout = _deserialize_json_loadout(json_loadout, class_name,
                                                spec_name)
        except (RuntimeError, KeyError):
            yield None, player, context, LoadoutRequestStatus.ERROR
            continue

        yield loadout, player, context, LoadoutRequestStatus.SUCCESS


def get_player_loadout(client: Client, player: PlayerLink,
                       override_spec: Optional[str] = None) -> PlayerLoadout:
    try:
        response = client.get_profile_resource(player.specialization_resource)
    except RuntimeError:
        raise MissingPlayerError(player)
    spec_id = response['active_specialization']['id']
    (class_name, spec_name) = CLASS_SPEC_BY_SPEC_ID[spec_id]
    if override_spec is not None:
        spec_name = override_spec
    json_loadout = _get_active_loadout(player, spec_name, response)
    return _deserialize_json_loadout(json_loadout, class_name, spec_name)


def _deserialize_json_loadout(json_loadout: dict, class_name: str,
                              spec_name: str) -> PlayerLoadout:
    class_nodes = []
    for raw_node in json_loadout['selected_class_talents']:
        class_nodes.append(LoadoutNode(
            raw_node['id'],
            raw_node['tooltip']['talent']['id'],
            raw_node['rank'],
        ))

    spec_nodes = []
    for raw_node in json_loadout['selected_spec_talents']:
        spec_nodes.append(LoadoutNode(
            raw_node['id'],
            raw_node['tooltip']['talent']['id'],
            raw_node['rank'],
        ))

    pvp_talents = []
    for raw_talent in json_loadout['pvp_talent_slots']:
        pvp_talents.append(LoadoutPvpTalent(
            raw_talent['selected']['talent']['id']
        ))

    return PlayerLoadout(
        class_name, spec_name,
        class_nodes, spec_nodes,
        pvp_talents
    )


def _get_active_loadout(player: PlayerLink, spec_name: str,
                        specialization_resource_response: dict) -> dict:
    response = specialization_resource_response

    loadouts = None
    pvp_talents = None
    for spec in response['specializations']:
        if spec['specialization']['name'] == spec_name:
            loadouts = spec['loadouts']
            pvp_talents = spec.get('pvp_talent_slots', [])
            break

    if loadouts is None:
        raise RuntimeError(f"Unable to find loadouts for {player.full_name}")

    if pvp_talents is None:
        raise RuntimeError(
            f"Unable to find pvp talents for {player.full_name}")

    for loadout in loadouts:
        if loadout['is_active']:
            loadout['pvp_talent_slots'] = pvp_talents
            return loadout

    raise RuntimeError(f"No active loadout for {player.full_name}")


def get_realms(client: Client) -> list[Realm]:
    realms = client.get_dynamic_resource('/data/wow/realm/index')
    return [
        Realm(
            realm['id'],
            realm['name'],
            realm['slug'],
            realm['key']['href']
        ) for realm in realms['realms']
    ]
