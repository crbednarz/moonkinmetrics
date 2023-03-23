import base64
import dataclasses

from .player import LoadoutNode, LoadoutPvpTalent, PlayerLoadout
from .pvp import RatedLoadout
from .talents import Talent, TalentNode, TalentTree


NODE_FILTER = set([
    91046,
    91047,
])


def create_pvp_index_map(talents: list[Talent]) -> dict[int, int]:
    sorted_ids = sorted([talent.id for talent in talents])
    return {talent_id: index for index, talent_id in enumerate(sorted_ids)}


def create_talent_encode_map(nodes: list[TalentNode]) -> dict[int, int]:
    talent_ids = []
    for node in nodes:
        for talent in node.talents:
            talent_ids.append(talent.id)

    talent_ids.sort()
    talent_map = {}
    for index, talent_id in enumerate(talent_ids):
        talent_map[talent_id] = index

    return talent_map


def encode_loadouts(loadouts: list[RatedLoadout],
                    tree: TalentTree) -> list[str]:
    talent_map = create_talent_encode_map(tree.class_nodes + tree.spec_nodes)
    pvp_talent_map = create_pvp_index_map(tree.pvp_talents)

    return [
        '|'.join([
            encode_talents(
                entry.loadout.class_nodes + entry.loadout.spec_nodes,
                talent_map
            ),
            encode_pvp_talents(entry.loadout.pvp_talents, pvp_talent_map),
            str(entry.rating),
        ])
        for entry in loadouts
    ]


def encode_talents(nodes: list[LoadoutNode],
                   talent_map: dict[int, int]) -> str:
    talent_bytes = bytearray()
    for node in nodes:
        talent_bytes.append(talent_map[node.talent_id])
        talent_bytes.append(node.rank)
    return base64.b64encode(talent_bytes).decode('ascii')


def encode_pvp_talents(talents: list[LoadoutPvpTalent],
                       pvp_talent_map: dict[int, int]) -> str:
    talent_bytes = bytearray()
    for talent in talents:
        talent_bytes.append(pvp_talent_map[talent.id])
    return base64.b64encode(talent_bytes).decode('ascii')


def rated_loadout_to_dict(loadout: PlayerLoadout, rating: int) -> dict:
    return {
        'class_nodes': [
            dataclasses.asdict(node) for node in loadout.class_nodes
        ],
        'spec_nodes': [
            dataclasses.asdict(node) for node in loadout.spec_nodes
        ],
        'pvp_talents': [
            dataclasses.asdict(talent) for talent in loadout.pvp_talents
        ],
        'rating': rating,
    }


def talent_tree_to_dict(tree: TalentTree, spell_media: dict[int, str]) -> dict:
    return {
        'class_name': tree.class_name,
        'spec_name': tree.spec_name,
        'class_nodes': _nodes_to_json(_filter_nodes(tree.class_nodes),
                                      spell_media),
        'spec_nodes': _nodes_to_json(_filter_nodes(tree.spec_nodes),
                                     spell_media),
        'pvp_talents': _pvp_talents_to_json(tree.pvp_talents, spell_media),
    }


def _nodes_to_json(nodes: list[TalentNode],
                   spell_media: dict[int, str]) -> list[dict]:
    output = []
    for node in nodes:
        node_dict = dataclasses.asdict(node)
        for talent in node_dict['talents']:
            talent['icon'] = spell_media[talent['spell']['id']]
        output.append(node_dict)
    return output


def _pvp_talents_to_json(talents: list[Talent],
                         spell_media: dict[int, str]) -> list[dict]:
    output = []
    for talent in talents:
        talent_dict = dataclasses.asdict(talent)
        talent_dict['icon'] = spell_media[talent.spell.id]
        output.append(talent_dict)

    return output


def _filter_nodes(nodes: list[TalentNode]) -> list[TalentNode]:
    return list(filter(
        lambda node: (node.id not in NODE_FILTER),
        nodes,
    ))
