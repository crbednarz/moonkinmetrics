from __future__ import annotations
import re

from dataclasses import dataclass
from itertools import chain
from typing import Generator

from .bnet import Client


@dataclass
class Spell:
    id: int
    name: str


@dataclass
class Talent:
    id: int
    name: str
    spell: Spell


@dataclass
class TalentNode:
    id: int
    x: int
    y: int
    row: int
    col: int
    unlocks: list[int]
    locked_by: list[int]
    talents: list[Talent]
    max_rank: int

    def __init__(self, raw_node: dict):
        self.id = raw_node['id']
        self.x = raw_node['raw_position_x']
        self.y = raw_node['raw_position_y']
        self.row = raw_node['display_row']
        self.col = raw_node['display_col']
        self.unlocks = raw_node.get('unlocks', [])
        self.locked_by = raw_node.get('locked_by', [])

        base_rank = raw_node['ranks'][0]
        if 'choice_of_tooltips' in base_rank:
            self.max_rank = 1
            tooltips = base_rank['choice_of_tooltips']
        else:
            self.max_rank = len(raw_node['ranks'])
            tooltips = [base_rank['tooltip']]

        self.talents = []
        for tooltip in tooltips:
            raw_spell = tooltip['spell_tooltip']['spell']
            spell = Spell(
                raw_spell['id'],
                raw_spell['name'],
            )
            self.talents.append(Talent(
                tooltip['talent']['id'],
                tooltip['talent']['name'],
                spell
            ))


@dataclass
class TalentTree:
    class_name: str
    spec_name: str
    class_nodes: list[TalentNode]
    spec_nodes: list[TalentNode]

    def all_spells(self) -> Generator[Spell, None, None]:
        for node in chain(self.class_nodes, self.spec_nodes):
            for talent in node.talents:
                yield talent.spell


@dataclass
class _TalentTreesIndex:
    class_trees: list[_ClassTalentTreeLink]
    spec_trees: list[_SpecTalentTreeLink]


class _ClassTalentTreeLink:
    def __init__(self, url: str, class_name: str):
        result = re.search(r'/talent-tree/(\d+)', url)
        if result is None:
            raise RuntimeError(f"Unable to find id in {url}")
        self.id = result.group(1)
        self.url = url
        self.class_name = class_name


class _SpecTalentTreeLink:
    def __init__(self, url: str, spec_name: str):
        result = re.search(r'/talent-tree/(\d+)/[^/]+/(\d+)', url)
        if result is None:
            raise RuntimeError(f"Unable to find id in {url}")
        self.class_id = result.group(1)
        self.spec_id = result.group(2)
        self.url = url
        self.spec_name = spec_name


def get_talent_trees(client: Client) -> Generator[TalentTree, None, None]:
    trees_index = _get_talent_tree_index(client)

    for tree_link in trees_index.spec_trees:
        class_id = tree_link.class_id
        class_name = _lookup_class_name_from_id(trees_index, class_id)
        yield _get_tree_for_spec(client, class_name, tree_link)


def _lookup_class_name_from_id(trees_index: _TalentTreesIndex, id: str) -> str:
    for tree_link in trees_index.class_trees:
        if tree_link.id == id:
            return tree_link.class_name
    raise RuntimeError(f"Unable to find class with id: {id}")


def _get_talent_tree_index(client: Client) -> _TalentTreesIndex:
    tree_index = client.get_static_resource("/data/wow/talent-tree/index")
    class_links = []
    for entry in tree_index['class_talent_trees']:
        class_links.append(_ClassTalentTreeLink(
            entry['key']['href'].split('?')[0],
            entry['name'],
        ))

    spec_links = []
    for entry in tree_index['spec_talent_trees']:
        spec_links.append(_SpecTalentTreeLink(
            entry['key']['href'].split('?')[0],
            entry['name'],
        ))

    return _TalentTreesIndex(class_links, spec_links)


def _get_tree_for_spec(client: Client, class_name: str,
                       tree_link: _SpecTalentTreeLink) -> TalentTree:
    response = client.get_url(tree_link.url)

    class_nodes = []
    for response_node in response['class_talent_nodes']:
        class_nodes.append(TalentNode(response_node))

    spec_nodes = []
    for response_node in response['spec_talent_nodes']:
        spec_nodes.append(TalentNode(response_node))

    return TalentTree(
        class_name,
        tree_link.spec_name,
        class_nodes,
        spec_nodes,
    )
