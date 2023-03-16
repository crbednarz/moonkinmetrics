import asyncio
import json
import math
import os
from datetime import datetime
from itertools import chain
from pathlib import Path

from .bnet import Client
from .media import get_spell_icons
from .player import (LoadoutRequestStatus, PlayerLoadout, get_player_loadouts)
from .pvp import RatedLoadout, get_pvp_leaderboard
from .serializer import encode_loadouts, talent_tree_to_dict
from .talents import TalentTree, get_talent_trees


TALENTS_DIRECTORY = 'talents'
PVP_DIRECTORY = 'pvp'


def scan_pvp_ladder(
    client: Client,
    output_path: str,
    bracket: str,
    shuffle_min_rating: int = 1800,
    shuffle_class: str = '',
    shuffle_spec: str = '',
) -> None:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    output_path = os.path.join(output_path, PVP_DIRECTORY, bracket)
    talent_trees = loop.run_until_complete(_fetch_talent_trees(client))
    _create_dir(output_path)

    if bracket == 'shuffle':
        for tree in talent_trees:
            if (shuffle_class and
                    tree.class_name.lower() != shuffle_class.lower()):
                continue

            if (shuffle_spec and
                    tree.spec_name.lower() != shuffle_spec.lower()):
                continue

            print(("Collecting player talents for "
                   f"Solo Shuffle {tree.class_name} - {tree.spec_name}..."))
            loop.run_until_complete(_collect_shuffle_leaderboard(
                client,
                tree.class_name,
                tree.spec_name,
                output_path,
                tree,
                shuffle_min_rating,
            ))
    else:
        print(f"Collecting player talents for {bracket}...")
        loop.run_until_complete(_collect_arena_leaderboard(
            client,
            bracket,
            output_path,
            talent_trees,
        ))


def scan_talents(client: Client, output_path: str) -> None:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    output_path = os.path.join(output_path, TALENTS_DIRECTORY)
    talent_trees = loop.run_until_complete(_fetch_talent_trees(client))
    _create_dir(output_path)

    for tree in talent_trees:
        print(f"Getting media for {tree.class_name} - {tree.spec_name}...")
        media = loop.run_until_complete(
            get_spell_icons(client, [spell.id for spell in tree.all_spells()])
        )
        filename = _get_filename(tree.class_name, tree.spec_name)
        path = os.path.join(output_path, filename)
        _save_talent_tree(tree, media, path)


async def _collect_shuffle_leaderboard(
    client: Client,
    class_name: str,
    spec_name: str,
    output_path: str,
    talent_tree: TalentTree,
    min_rating: int = 1800,
) -> None:
    bracket = _shuffle_bracket(class_name, spec_name)
    scan_targets = []
    for entry in get_pvp_leaderboard(client, bracket):
        if entry.rating < min_rating:
            break
        scan_targets.append((entry.player, entry.rating))

    rated_loadouts = []
    async for result in get_player_loadouts(client, scan_targets, spec_name):
        loadout, player, rating, status = result
        print(f"Requested talents for {player.full_name}... ", end='')
        if status != LoadoutRequestStatus.SUCCESS or loadout is None:
            print("Failed")
            continue

        print(f"{loadout.class_name} - {loadout.spec_name} - {rating}")

        if not _validate_talents(loadout, talent_tree):
            print(f"{player.full_name} failed talent validation.")
            continue
        rated_loadouts.append(RatedLoadout(loadout, rating))

    rated_loadouts.sort(key=lambda entry: entry.rating, reverse=True)

    filename = _get_regional_filename(class_name, spec_name, client.region)
    path = os.path.join(output_path, filename)
    print(f"Writing to path: {path}")
    with open(path, 'w') as file:
        json.dump(_with_timestamp({
            'entries': encode_loadouts(rated_loadouts, talent_tree),
        }), file, indent=2)


async def _collect_arena_leaderboard(
    client: Client,
    bracket: str,
    output_path: str,
    talent_trees: list[TalentTree]
) -> None:
    tree_map = {}
    output = {}
    for tree in talent_trees:
        tree_map[(tree.class_name, tree.spec_name)] = tree
        output[(tree.class_name, tree.spec_name)] = []

    scan_targets = []
    for entry in get_pvp_leaderboard(client, bracket):
        scan_targets.append((entry.player, entry.rating))

    async for result in get_player_loadouts(client, scan_targets):
        loadout, player, rating, status = result
        print(f"Requested talents for {player.full_name}... ", end='')
        if status != LoadoutRequestStatus.SUCCESS or loadout is None:
            print("Failed")
            continue

        print(f"{loadout.class_name} - {loadout.spec_name} - {rating}")

        talent_tree = tree_map[(loadout.class_name, loadout.spec_name)]
        if not _validate_talents(loadout, talent_tree):
            print(f"{player.full_name} failed talent validation.")
            continue

        output[(loadout.class_name, loadout.spec_name)].append(
            RatedLoadout(loadout, rating))

    for (class_name, spec_name), entries in output.items():
        if len(entries) == 0:
            continue
        entries.sort(key=lambda entry: entry.rating, reverse=True)

        filename = _get_regional_filename(class_name, spec_name, client.region)
        path = os.path.join(output_path, filename)
        talent_tree = tree_map[(class_name, spec_name)]
        print(f"Writing to path: {path}")
        with open(path, 'w') as file:
            json.dump(_with_timestamp({
                'entries': encode_loadouts(entries, talent_tree),
            }), file, indent=2)


def _shuffle_bracket(class_name: str, spec_name: str) -> str:
    class_slug = class_name.lower().replace(' ', '')
    spec_slug = spec_name.lower().replace(' ', '')
    return f'shuffle-{class_slug}-{spec_slug}'


def _validate_talents(loadout: PlayerLoadout, talent_tree: TalentTree):
    max_ranks = {}
    for node in chain(talent_tree.class_nodes, talent_tree.spec_nodes):
        for talent in node.talents:
            max_ranks[talent.id] = node.max_rank

    for node in chain(loadout.class_nodes, loadout.spec_nodes):
        max_rank = max_ranks.get(node.talent_id)
        if max_rank is None:
            return False
        if node.rank > max_rank:
            return False

    return True


async def _fetch_talent_trees(client: Client) -> list[TalentTree]:
    print("Collecting talent trees...")
    talent_trees = []
    async for tree in get_talent_trees(client):
        print(f"Found {tree.class_name} - {tree.spec_name}")
        talent_trees.append(tree)
    return talent_trees


def _save_talent_tree(tree: TalentTree, spell_media: dict[int, str],
                      path: str) -> None:
    with open(path, 'w') as file:
        json_output = talent_tree_to_dict(tree, spell_media)
        json.dump(_with_timestamp(json_output), file, indent=2)


def _get_filename(class_name: str, spec_name: str) -> str:
    return f"{class_name}-{spec_name}.json".lower().replace(' ', '-')


def _get_regional_filename(class_name: str, spec_name: str, region: str) -> str:
    return f"{class_name}-{spec_name}.{region}.json".lower().replace(' ', '-')


def _create_dir(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)


def _with_timestamp(obj: dict) -> dict:
    obj['timestamp'] = math.floor(datetime.now().timestamp() * 1000)
    return obj
