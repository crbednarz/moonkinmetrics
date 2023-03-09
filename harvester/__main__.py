import asyncio
import click
import json
import os
from itertools import chain
from pathlib import Path

from .bnet import Client
from .media import get_spell_icon
from .player import (LoadoutRequestStatus, MissingPlayerError, PlayerLoadout,
                     get_player_loadout, get_player_loadouts)
from .pvp import get_pvp_leaderboard
from .serializer import talent_tree_to_dict, rated_loadout_to_dict
from .talents import TalentTree, get_talent_trees


TALENTS_DIRECTORY = 'talents'
PVP_DIRECTORY = 'pvp'


@click.group()
@click.option("--output", "-o", "output_path",
              type=click.Path(file_okay=False),
              default='ui/wow/')
@click.option("--client-id", "client_id",
              default=lambda: os.environ.get("WOW_CLIENT_ID", ""))
@click.option("--client-secret", "client_secret",
              default=lambda: os.environ.get("WOW_CLIENT_SECRET", ""))
@click.option("--cache-path", "cache_path", default=".cache")
@click.pass_context
def cli(ctx, output_path, client_id, client_secret, cache_path):
    client = Client(
        client_id,
        client_secret,
        cache_path=cache_path,
    )

    ctx.obj = {
        'client': client,
        'output_path': output_path,
    }


@cli.command()
@click.argument('bracket',
                type=click.Choice(['2v2', '3v3', 'shuffle']),
                required=True)
@click.option('-m', '--shuffle-min-rating', type=click.INT, default=1800)
@click.option('--shuffle-class', type=click.STRING)
@click.option('--shuffle-spec', type=click.STRING)
@click.pass_context
def ladder(ctx, bracket, shuffle_min_rating, shuffle_class, shuffle_spec):
    client = ctx.obj['client']
    output_path = os.path.join(ctx.obj['output_path'], PVP_DIRECTORY, bracket)
    talent_trees = _fetch_talent_trees(client)
    _create_dir(output_path)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    if bracket == 'shuffle':
        for tree in talent_trees:
            if shuffle_class and tree.class_name.lower() != shuffle_class.lower():
                continue

            if shuffle_spec and tree.spec_name.lower() != shuffle_spec.lower():
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
        _collect_arena_leaderboard(
            client,
            bracket,
            output_path,
            talent_trees,
        )


@cli.command()
@click.pass_context
def talents(ctx):
    client = ctx.obj['client']
    output_path = os.path.join(ctx.obj['output_path'], TALENTS_DIRECTORY)
    talent_trees = _fetch_talent_trees(client)
    _create_dir(output_path)

    for tree in talent_trees:
        print(f"Getting media for {tree.class_name} - {tree.spec_name}...")
        media = {}
        for spell in tree.all_spells():
            if spell.id not in media:
                print(f"Fetching icon for {spell.name}...")
                media[spell.id] = get_spell_icon(client, spell.id)
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
        rated_loadouts.append((loadout, rating))

    rated_loadouts.sort(key=lambda entry: entry[1], reverse=True)

    filename = _get_filename(class_name, spec_name)
    path = os.path.join(output_path, filename)
    with open(path, 'w') as file:
        json.dump({
            'entries': [
                rated_loadout_to_dict(loadout, rating)
            ] for loadout, rating in rated_loadouts
        }, file, indent=2)


def _collect_arena_leaderboard(
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

    for entry in get_pvp_leaderboard(client, bracket):
        player = entry.player
        rating = entry.rating

        print(f"Getting talents for {player.full_name}... ",
              end='')
        try:
            loadout = get_player_loadout(client, player)
            print(f"{loadout.class_name} - {loadout.spec_name} - {rating}")
        except MissingPlayerError:
            print("Missing")
            continue
        except RuntimeError:
            print("Error")
            continue

        talent_tree = tree_map[(loadout.class_name, loadout.spec_name)]
        if not _validate_talents(loadout, talent_tree):
            print(f"{player.full_name} failed talent validation.")
            continue

        output[(loadout.class_name, loadout.spec_name)].append(
            rated_loadout_to_dict(loadout, rating)
        )

    for (class_name, spec_name), entries in output.items():
        if len(entries) == 0:
            continue

        filename = _get_filename(class_name, spec_name)
        path = os.path.join(output_path, filename)
        with open(path, 'w') as file:
            json.dump({
                'entries': entries
            }, file, indent=2)


def _shuffle_bracket(class_name: str, spec_name: str) -> str:
    class_slug = class_name.lower().replace(' ', '')
    spec_slug = spec_name.lower().replace(' ', '')
    return f'shuffle-{class_slug}-{spec_slug}'


def _validate_talents(loadout: PlayerLoadout, talent_tree: TalentTree):
    max_ranks = {}
    for node in talent_tree.class_nodes:
        max_ranks[node.id] = node.max_rank
    for node in talent_tree.spec_nodes:
        max_ranks[node.id] = node.max_rank

    for node in chain(loadout.class_nodes, loadout.spec_nodes):
        max_rank = max_ranks.get(node.node_id)
        if max_rank is None:
            return False
        if node.rank > max_ranks[node.node_id]:
            return False

    return True


def _fetch_talent_trees(client: Client) -> list[TalentTree]:
    print("Collecting talent trees...")
    talent_trees = []
    for tree in get_talent_trees(client):
        print(f"Found {tree.class_name} - {tree.spec_name}")
        talent_trees.append(tree)
    return talent_trees


def _save_talent_tree(tree: TalentTree, spell_media: dict[int, str],
                      path: str) -> None:
    with open(path, 'w') as file:
        json.dump(talent_tree_to_dict(tree, spell_media), file, indent=2)


def _get_filename(class_name: str, spec_name: str) -> str:
    return f"{class_name}-{spec_name}.json".lower().replace(' ', '-')


def _create_dir(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)


if __name__ == '__main__':
    cli()
