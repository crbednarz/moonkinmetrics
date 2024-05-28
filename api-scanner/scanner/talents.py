from __future__ import annotations
import re

from dataclasses import dataclass
from itertools import chain
from typing import AsyncGenerator, Generator, Optional

from . import hack
from .bnet import Client
from .constants import (
    CLASS_SPECS,
    INGAME_SPEC_NODES,
    CLASS_SPEC_BY_SPEC_ID,
    SPEC_ID_BY_CLASS_SPEC,
)


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
class _GameNodeRepairInfo:
    node_info: dict
    raw_talents: list[dict]


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

    @staticmethod
    def from_broken_node(node_repair: _GameNodeRepairInfo):
        node_info = node_repair.node_info
        raw_talents = node_repair.raw_talents

        talents = []
        for raw_talent in raw_talents:
            raw_spell = raw_talent["spell"]

            ranks = []
            for rank_description in raw_talent["rank_descriptions"]:
                ranks.append(
                    Rank(rank_description["description"], None, None, None, None)
                )

            talents.append(
                Talent(
                    id=raw_talent["id"],
                    name=raw_spell["name"],
                    spell=Spell(
                        id=raw_spell["id"],
                        name=raw_spell["name"],
                        ranks=ranks,
                    ),
                )
            )

        return TalentNode(
            id=node_info["id"],
            x=node_info["pos_x"],
            y=node_info["pos_y"],
            row=0,
            col=0,
            unlocks=[],
            locked_by=node_info["locked_by"],
            node_type="MISSING",
            talents=talents,
            max_rank=len(raw_talents[0]["rank_descriptions"]),
        )

    @staticmethod
    def from_raw_node(raw_node: dict):
        fixed_node = hack.fix_raw_node(raw_node)
        if fixed_node is None:
            return None

        raw_node = fixed_node
        base_rank = raw_node["ranks"][0]

        if "choice_of_tooltips" in base_rank:
            max_rank = 1
            tooltips = [
                [base_rank["choice_of_tooltips"][0]],
                [base_rank["choice_of_tooltips"][1]],
            ]
        else:
            max_rank = len(raw_node["ranks"])
            tooltips = [[rank["tooltip"] for rank in raw_node["ranks"]]]

        talents = []
        for tooltip_ranks in tooltips:
            base_tooltip = tooltip_ranks[0]
            base_spell_tooltip = base_tooltip["spell_tooltip"]
            base_spell = base_spell_tooltip["spell"]

            ranks = []
            for tooltip in tooltip_ranks:
                spell_tooltip = tooltip["spell_tooltip"]
                ranks.append(
                    Rank(
                        spell_tooltip["description"],
                        spell_tooltip.get("cast_time"),
                        spell_tooltip.get("power_cost"),
                        spell_tooltip.get("range"),
                        spell_tooltip.get("cooldown"),
                    )
                )

            spell = Spell(
                base_spell["id"],
                base_spell["name"],
                ranks,
            )
            talents.append(
                Talent(
                    base_tooltip["talent"]["id"],
                    base_tooltip["talent"]["name"],
                    spell,
                )
            )
        node = TalentNode(
            id=raw_node["id"],
            x=raw_node["raw_position_x"],
            y=raw_node["raw_position_y"],
            row=raw_node["display_row"],
            col=raw_node["display_col"],
            unlocks=raw_node.get("unlocks", []),
            locked_by=raw_node.get("locked_by", []),
            node_type=raw_node["node_type"]["type"],
            talents=talents,
            max_rank=max_rank,
        )
        return node


@dataclass
class TalentTree:
    class_name: str
    class_id: int
    spec_name: str
    spec_id: int
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
        result = re.search(r"/talent-tree/(\d+)", url)
        if result is None:
            raise RuntimeError(f"Unable to find id in {url}")
        self.id = int(result.group(1))
        self.url = url
        self.class_name = class_name


class _SpecTalentTreeLink:
    def __init__(self, url: str, spec_name: str):
        result = re.search(r"/talent-tree/(\d+)/[^/]+/(\d+)", url)
        if result is None:
            raise RuntimeError(f"Unable to find id in {url}")
        self.class_id = int(result.group(1))
        self.spec_id = int(result.group(2))
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

        if hack.is_spec_api_incorrect(class_name, tree_link.spec_name):
            yield await _get_tree_for_broken_spec(client, class_name, tree_link)
        else:
            yield await _get_tree_for_spec(client, class_name, tree_link)

    for class_name, spec_name in specs_remaining:
        tree_link = trees_index.get_class_link(class_name)
        yield await _get_tree_for_missing_spec(
            client, class_name, spec_name, trees_index
        )


def _lookup_class_name_from_id(trees_index: _TalentTreesIndex, id: int) -> str:
    for tree_link in trees_index.class_trees:
        if tree_link.id == id:
            return tree_link.class_name
    raise RuntimeError(f"Unable to find class with id: {id}")


def _get_talent_tree_index(client: Client) -> _TalentTreesIndex:
    tree_index = client.get_static_resource("/data/wow/talent-tree/index")
    class_links = []
    for entry in tree_index["class_talent_trees"]:
        class_links.append(
            _ClassTalentTreeLink(
                entry["key"]["href"].split("?")[0],
                entry["name"],
            )
        )

    spec_links = []
    for entry in tree_index["spec_talent_trees"]:
        spec_links.append(
            _SpecTalentTreeLink(
                entry["key"]["href"].split("?")[0],
                entry["name"],
            )
        )

    return _TalentTreesIndex(class_links, spec_links)


async def _get_tree_for_spec(
    client: Client, class_name: str, tree_link: _SpecTalentTreeLink
) -> TalentTree:
    response = client.get_url(tree_link.url)

    class_nodes = []
    for response_node in response["class_talent_nodes"]:
        node = TalentNode.from_raw_node(response_node)
        if node:
            class_nodes.append(node)

    spec_nodes = []
    for response_node in response["spec_talent_nodes"]:
        try:
            node = TalentNode.from_raw_node(response_node)
            if node:
                spec_nodes.append(node)
        except Exception as e:
            print(f"Failed to parse talent for {tree_link.spec_name} {class_name}")
            raise e

    return TalentTree(
        class_name,
        tree_link.class_id,
        tree_link.spec_name,
        tree_link.spec_id,
        _filter_nodes(class_nodes),
        _filter_nodes(spec_nodes),
        await _get_pvp_talents(client, class_name, tree_link.spec_name),
    )


async def _get_pvp_talents(
    client: Client, class_name: str, spec_name: str
) -> list[Talent]:
    index = client.get_static_resource("/data/wow/pvp-talent/index")
    talents = []

    urls_with_context = [
        (entry["key"]["href"], entry) for entry in index["pvp_talents"]
    ]

    async for response, status, entry in client.get_urls(urls_with_context):
        if status != 200:
            raise RuntimeError(
                f"Unable to get pvp talent {entry['id']}: {status} / {entry}"
            )
        if response["playable_specialization"]["name"] != spec_name:
            continue

        spec_id = response["playable_specialization"]["id"]
        (found_class_name, _) = CLASS_SPEC_BY_SPEC_ID[spec_id]

        if found_class_name != class_name:
            continue

        talents.append(
            Talent(
                response["id"],
                response["spell"]["name"],
                Spell(
                    response["spell"]["id"],
                    response["spell"]["name"],
                    [
                        Rank(
                            response["description"],
                            cast_time=None,
                            power_cost=None,
                            range=None,
                            cooldown=None,
                        )
                    ],
                ),
            )
        )

    return talents


async def _get_tree_for_missing_spec(
    client: Client, class_name: str, spec_name: str, tree_index: _TalentTreesIndex
) -> TalentTree:
    print(f"Warning: Using fallback for {class_name} - {spec_name}")
    game_nodes = {}
    for game_node in INGAME_SPEC_NODES[class_name][spec_name]:
        game_nodes[game_node["id"]] = game_node

    tree_link = tree_index.get_class_link(class_name)

    class_nodes = []
    spec_nodes = []

    response = client.get_url(tree_link.url)
    urls_with_context = []
    for response_node in response["talent_nodes"]:
        node = TalentNode.from_raw_node(response_node)
        if not node:
            continue
        base_rank = response_node["ranks"][0]
        if "choice_of_tooltips" in base_rank:
            tooltip = base_rank["choice_of_tooltips"][0]
        else:
            tooltip = base_rank["tooltip"]

        if node.id not in game_nodes:
            continue

        node.locked_by = game_nodes[node.id]["locked_by"]
        del game_nodes[node.id]

        url = tooltip["talent"]["key"]["href"]
        urls_with_context.append((url, node))

    for node_id in game_nodes.keys():
        print(f"Warning: Missing node {node_id} for {spec_name} {class_name}")

    async for response, _, node in client.get_urls(urls_with_context):
        if "playable_specialization" in response:
            spec_nodes.append(node)
        else:
            class_nodes.append(node)

    return TalentTree(
        class_name,
        tree_link.id,
        spec_name,
        SPEC_ID_BY_CLASS_SPEC[(class_name, spec_name)],
        _filter_nodes(class_nodes),
        _filter_nodes(spec_nodes),
        await _get_pvp_talents(client, class_name, spec_name),
    )


async def _get_tree_for_broken_spec(
    client: Client, class_name: str, tree_link: _SpecTalentTreeLink
) -> TalentTree:
    spec_name = tree_link.spec_name
    print(f"Warning: Using fallback for {class_name} - {spec_name}")

    class_nodes = []
    spec_nodes = []

    resources_with_context = []
    game_nodes = []
    for i, node_info in enumerate(INGAME_SPEC_NODES[class_name][spec_name]):
        game_nodes.append(
            {
                "node_info": node_info,
                "talent_nodes": [],
            }
        )
        for talent_id in node_info["talent_ids"]:
            resource = f"/data/wow/talent/{talent_id}"
            resources_with_context.append((resource, i))

    async for response, _, id in client.get_static_resources(resources_with_context):
        node_info = game_nodes[id]
        node_info["talent_nodes"].append(response)

    for game_node in game_nodes:
        node_info = game_node["node_info"]

        repair = _GameNodeRepairInfo(
            node_info=node_info,
            raw_talents=game_node["talent_nodes"],
        )
        node = TalentNode.from_broken_node(repair)
        if "playable_specialization" in repair.raw_talents[0]:
            spec_nodes.append(node)
        else:
            class_nodes.append(node)

    return TalentTree(
        class_name,
        tree_link.class_id,
        tree_link.spec_name,
        tree_link.spec_id,
        _filter_nodes(class_nodes),
        _filter_nodes(spec_nodes),
        await _get_pvp_talents(client, class_name, tree_link.spec_name),
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

        return True

    return list(filter(filter_node, nodes))
