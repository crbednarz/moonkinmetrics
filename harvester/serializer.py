import dataclasses
from .player import PlayerLoadout
from .talents import PvpTalent, TalentNode, TalentTree


NODE_FILTER = set([
    91046,
    91047,
])


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


def _pvp_talents_to_json(talents: list[PvpTalent],
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
