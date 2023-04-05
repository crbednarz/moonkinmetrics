import dataclasses
import json
import os

from scanner.player import LoadoutNode, LoadoutPvpTalent, PlayerLink, PlayerLoadout, RealmLink
from scanner.pvp import RatedLoadout

from dacite import from_dict

from scanner.serializer import LoadoutEncoder, talent_tree_to_dict
from scanner.talents import TalentTree


def get_resource(resource: str):
    path = os.path.join(os.path.dirname(__file__), 'resources', resource)
    with open(path, 'r', encoding='utf-8') as file:
        return json.load(file)


def get_test_tree():
    tree_json = get_resource('druid-balance.json')
    return from_dict(data_class=TalentTree, data=tree_json)


def spell_media_from_tree_json(tree_json: dict) -> dict[int, str]:
    spell_media = {}
    for node in tree_json['class_nodes']:
        for talent in node['talents']:
            spell_media[talent['spell']['id']] = talent['icon']
    for node in tree_json['spec_nodes']:
        for talent in node['talents']:
            spell_media[talent['spell']['id']] = talent['icon']
    for talent in tree_json['pvp_talents']:
        spell_media[talent['spell']['id']] = talent['icon']
    return spell_media


def create_loadout(tree: TalentTree, size: int) -> PlayerLoadout:
    class_nodes = []
    for i in range(size):
        node = tree.class_nodes[i % len(tree.class_nodes)]
        class_nodes.append(LoadoutNode(
            node.id,
            node.talents[0].id,
            1,
        ))

    spec_nodes = []
    for i in range(size):
        node = tree.spec_nodes[i % len(tree.spec_nodes)]
        spec_nodes.append(LoadoutNode(
            node.id,
            node.talents[0].id,
            1,
        ))

    loadout = PlayerLoadout(
        class_name='Druid',
        spec_name='Balance',
        class_nodes=class_nodes,
        spec_nodes=spec_nodes,
        pvp_talents=[
            LoadoutPvpTalent(tree.pvp_talents[i % len(tree.pvp_talents)].id)
            for i in range(size)
        ],
    )
    return loadout


def test_can_get_test_tree():
    tree = get_test_tree()
    assert tree.class_name == 'Druid'
    assert tree.spec_name == 'Balance'
    assert len(tree.class_nodes) == 48


def test_can_serialize_tree():
    tree = get_test_tree()
    expected = get_resource('druid-balance.json')
    spell_media = spell_media_from_tree_json(expected)
    actual = talent_tree_to_dict(tree, spell_media)

    assert actual == expected


def test_can_serialize_loadout():
    tree = get_test_tree()
    loadout = create_loadout(tree, 20)
    rated_loadout = RatedLoadout(
        PlayerLink(
            RealmLink('dalaran', ''),
            'player',
        ),
        loadout,
        'HORDE',
        2000,
    )
    encoder = LoadoutEncoder(tree, [])
    actual = encoder.encode_loadout(rated_loadout)
    expected = ("KAMUEQQXExAJBRYaEioGDRUZARsPAQxMT1Q1Pj8zO1A8PTYBQ0cBNAFTQEpLV"
                "QEUBAECAwYFBwsACQgKDA0OBAECAwbQBwAAAQ==|player")
    assert actual == expected
