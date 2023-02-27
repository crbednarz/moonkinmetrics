from dataclasses import dataclass

from .bnet import Client


class PlayerLink:
    def __init__(self, realm_slug: str, name: str):
        self.realm_slug = realm_slug
        self.name = name

    @property
    def full_name(self) -> str:
        return f"{self.name} - {self.realm_slug}"

    @property
    def specialization_resource(self) -> str:
        return (f"/profile/wow/character/"
                f"{self.realm_slug}/{self.name.lower()}/specializations")

    @property
    def profile_resource(self) -> str:
        return (f"/profile/wow/character/"
                f"{self.realm_slug}/{self.name.lower()}")


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


def get_player_loadout(client: Client, player: PlayerLink,
                       override_spec: str | None = None) -> PlayerLoadout:
    try:
        profile = client.get_profile_resource(player.profile_resource)
    except RuntimeError:
        raise MissingPlayerError(player)
    class_name = profile['character_class']['name']
    spec_name = profile['active_spec']['name']
    if override_spec is not None:
        spec_name = override_spec
    response = _get_active_loadout(client, player, spec_name)

    class_nodes = []
    for raw_node in response['selected_class_talents']:
        class_nodes.append(LoadoutNode(
            raw_node['id'],
            raw_node['tooltip']['talent']['id'],
            raw_node['rank'],
        ))

    spec_nodes = []
    for raw_node in response['selected_spec_talents']:
        spec_nodes.append(LoadoutNode(
            raw_node['id'],
            raw_node['tooltip']['talent']['id'],
            raw_node['rank'],
        ))

    pvp_talents = []
    for raw_talent in response['pvp_talent_slots']:
        pvp_talents.append(LoadoutPvpTalent(
            raw_talent['selected']['talent']['id']
        ))

    return PlayerLoadout(
        class_name, spec_name,
        class_nodes, spec_nodes,
        pvp_talents
    )


def _get_active_loadout(client: Client, player: PlayerLink,
                        spec_name: str) -> dict:
    response = client.get_profile_resource(player.specialization_resource)

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
