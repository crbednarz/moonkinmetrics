from __future__ import annotations
import re

from dataclasses import dataclass
from itertools import chain
from typing import AsyncGenerator, Generator, Optional

from .bnet import Client
from .constants import CLASS_SPECS, INGAME_SPEC_NODES, CLASS_SPEC_BY_SPEC_ID


NODE_FILTER = set([
    91046,
    91047,
])


@dataclass
class Spell:
    id: int
    name: str
    ranks: list[Rank]


@dataclass
class Rank:
    description: str
    cast_time: Optional[str]
    power_cost: Optional[str]
    range: Optional[str]
    cooldown: Optional[str]


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
    node_type: str

    def __init__(self, raw_node: dict):
        self.id = raw_node['id']
        self.x = raw_node['raw_position_x']
        self.y = raw_node['raw_position_y']
        self.row = raw_node['display_row']
        self.col = raw_node['display_col']
        self.unlocks = raw_node.get('unlocks', [])
        self.locked_by = raw_node.get('locked_by', [])
        self.node_type = raw_node['node_type']['type']

        base_rank = raw_node['ranks'][0]
        if 'choice_of_tooltips' in base_rank:
            self.max_rank = 1
            tooltips = [
                [base_rank['choice_of_tooltips'][0]],
                [base_rank['choice_of_tooltips'][1]],
            ]
        else:
            self.max_rank = len(raw_node['ranks'])
            tooltips = [
                [rank['tooltip'] for rank in raw_node['ranks']]
            ]

        self.talents = []
        for tooltip_ranks in tooltips:
            base_tooltip = tooltip_ranks[0]
            base_spell_tooltip = base_tooltip['spell_tooltip']
            base_spell = base_spell_tooltip['spell']

            ranks = []
            for tooltip in tooltip_ranks:
                spell_tooltip = tooltip['spell_tooltip']
                ranks.append(Rank(
                    spell_tooltip['description'],
                    spell_tooltip.get('cast_time'),
                    spell_tooltip.get('power_cost'),
                    spell_tooltip.get('range'),
                    spell_tooltip.get('cooldown'),
                ))

            spell = Spell(
                base_spell['id'],
                base_spell['name'],
                ranks,
            )
            self.talents.append(Talent(
                base_tooltip['talent']['id'],
                base_tooltip['talent']['name'],
                spell,
            ))


@dataclass
class TalentTree:
    class_name: str
    spec_name: str
    class_nodes: list[TalentNode]
    spec_nodes: list[TalentNode]
    pvp_talents: list[Talent]

    def all_spells(self) -> Generator[Spell, None, None]:
        for node in chain(self.class_nodes, self.spec_nodes):
            for talent in node.talents:
                yield talent.spell

        for pvp_talent in self.pvp_talents:
            yield pvp_talent.spell


@dataclass
class _TalentTreesIndex:
    class_trees: list[_ClassTalentTreeLink]
    spec_trees: list[_SpecTalentTreeLink]

    def get_class_link(self, class_name: str) -> _ClassTalentTreeLink:
        for tree in self.class_trees:
            if tree.class_name == class_name:
                return tree

        raise RuntimeError(f"Unable to find class {class_name}")


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


async def get_talent_trees(client: Client) -> AsyncGenerator[TalentTree, None]:
    trees_index = _get_talent_tree_index(client)

    specs_remaining = CLASS_SPECS.copy()
    for tree_link in trees_index.spec_trees:
        class_id = tree_link.class_id
        class_name = _lookup_class_name_from_id(trees_index, class_id)
        if (class_name, tree_link.spec_name) not in specs_remaining:
            continue
        specs_remaining.remove((class_name, tree_link.spec_name))
        yield await _get_tree_for_spec(client, class_name, tree_link)

    for class_name, spec_name in specs_remaining:
        tree_link = trees_index.get_class_link(class_name)
        yield await _get_tree_for_missing_spec(client, class_name, spec_name,
                                               trees_index)


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


async def _get_tree_for_spec(client: Client, class_name: str,
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
        _filter_nodes(class_nodes),
        _filter_nodes(spec_nodes),
        await _get_pvp_talents(client, class_name, tree_link.spec_name)
    )


async def _get_pvp_talents(client: Client, class_name: str,
                           spec_name: str) -> list[Talent]:
    index = client.get_static_resource('/data/wow/pvp-talent/index')
    talents = []

    urls_with_context = [
        (entry['key']['href'], entry) for entry in index['pvp_talents']
    ]

    async for response, status, entry in client.get_urls(urls_with_context):
        if status != 200:
            raise RuntimeError(f"Unable to get pvp talent {entry['id']}: "
                               f"{status}")
        if response['playable_specialization']['name'] != spec_name:
            continue

        spec_id = response['playable_specialization']['id']
        (found_class_name, _) = CLASS_SPEC_BY_SPEC_ID[spec_id]

        if found_class_name != class_name:
            continue

        talents.append(Talent(
            response['id'],
            response['spell']['name'],
            Spell(
                response['spell']['id'],
                response['spell']['name'],
                [Rank(
                    response['description'],
                    cast_time=None,
                    power_cost=None,
                    range=None,
                    cooldown=None,
                )]
            ),
        ))

    return talents


async def _get_tree_for_missing_spec(
    client: Client,
    class_name: str, spec_name: str,
    tree_index: _TalentTreesIndex
) -> TalentTree:
    game_nodes = {}
    for game_node in INGAME_SPEC_NODES[class_name][spec_name]:
        game_nodes[game_node['id']] = game_node

    tree_link = tree_index.get_class_link(class_name)

    class_nodes = []
    spec_nodes = []

    response = client.get_url(tree_link.url)
    urls_with_context = []
    for response_node in response['talent_nodes']:
        node = TalentNode(response_node)
        base_rank = response_node['ranks'][0]
        if 'choice_of_tooltips' in base_rank:
            tooltip = base_rank['choice_of_tooltips'][0]
        else:
            tooltip = base_rank['tooltip']

        if node.id not in game_nodes:
            continue

        node.locked_by = game_nodes[node.id]['locked_by']

        url = tooltip['talent']['key']['href']
        urls_with_context.append((url, node))

    async for response, _, node in client.get_urls(urls_with_context):
        if 'playable_specialization' in response:
            spec_nodes.append(node)
        else:
            class_nodes.append(node)

    return TalentTree(
        class_name,
        spec_name,
        _filter_nodes(class_nodes),
        _filter_nodes(spec_nodes),
        await _get_pvp_talents(client, class_name, spec_name)
    )


def _filter_nodes(nodes: list[TalentNode]) -> list[TalentNode]:
    ids = set([node.id for node in nodes])

    def filter_node(node: TalentNode) -> bool:
        missing_parent = True
        for locked_by in node.locked_by:
            if locked_by in ids:
                missing_parent = False
                break
        if missing_parent and len(node.locked_by) > 0:
            return False

        return node.id not in NODE_FILTER

    return list(filter(filter_node, nodes))
