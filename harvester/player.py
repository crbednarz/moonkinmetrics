import base64
from dataclasses import dataclass

from .bnet import Client
from .talents import TalentNode, TalentTree


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
    id: int
    rank: int


class PlayerLoadout:
    def __init__(self, class_name: str, spec_name: str,
                 class_nodes: list[LoadoutNode],
                 spec_nodes: list[LoadoutNode]):
        self.class_name = class_name
        self.spec_name = spec_name
        self.class_nodes = class_nodes
        self.spec_nodes = spec_nodes

    def encode(self, talent_tree: TalentTree) -> str:
        encoded_class_talents = _encode_nodes(self.class_nodes,
                                              talent_tree.class_nodes)
        encoded_spec_talents = _encode_nodes(self.spec_nodes,
                                             talent_tree.spec_nodes)
        return f"{encoded_class_talents}/{encoded_spec_talents}"


def get_player_loadout(client: Client, player: PlayerLink):
    profile = client.get_profile_resource(player.profile_resource)
    class_name = profile['character_class']['name']
    spec_name = profile['active_spec']['name']
    response = _get_active_loadout(client, player, spec_name)

    class_nodes = []
    for raw_node in response['selected_class_talents']:
        class_nodes.append(LoadoutNode(raw_node['id'], raw_node['rank']))

    spec_nodes = []
    for raw_node in response['selected_spec_talents']:
        spec_nodes.append(LoadoutNode(raw_node['id'], raw_node['rank']))

    return PlayerLoadout(
        class_name, spec_name,
        class_nodes, spec_nodes,
    )


def _get_active_loadout(client: Client, player: PlayerLink,
                        spec_name: str) -> dict:
    response = client.get_profile_resource(player.specialization_resource)
    loadouts = None
    for spec in response['specializations']:
        if spec['specialization']['name'] == spec_name:
            loadouts = spec['loadouts']
            break

    if loadouts is None:
        raise RuntimeError(f"Unable to find loadouts for {player.full_name}")

    for loadout in loadouts:
        if loadout['is_active']:
            return loadout

    raise RuntimeError(f"No active loadout for {player.full_name}")


def _encode_nodes(selected_nodes: list[LoadoutNode],
                  all_nodes: list[TalentNode]) -> str:
    index_map = {}
    for i, node in enumerate(all_nodes):
        index_map[node.id] = i

    output = bytearray((len(index_map) + 1) // 2)

    for node in selected_nodes:
        index = index_map[node.id]
        rank = node.rank
        if index % 2 == 0:
            output[index // 2] |= rank
        else:
            output[index // 2] |= (rank << 2)

    return base64.b64encode(output).decode('utf-8')
