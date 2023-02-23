import click
import json
import os
from pathlib import Path

from harvester.constants import SPEC_BY_CLASS

from .bnet import Client
from .player import PlayerLoadout, get_player_loadout
from .pvp import get_pvp_leaderboard
from .talents import TalentTree, get_talent_trees


TALENTS_DIRECTORY = 'talents'
PVP_DIRECTORY = 'pvp'


@click.command()
@click.option('--output', 'output_path',
              type=click.Path(file_okay=False),
              default='out')
@click.option('--ladder')
@click.option("--client-id", "client_id",
              default=lambda: os.environ.get("WOW_CLIENT_ID", ""))
@click.option("--client-secret", "client_secret",
              default=lambda: os.environ.get("WOW_CLIENT_SECRET", ""))
def cli(output_path, ladder, client_id, client_secret):
    client = Client(
        client_id,
        client_secret,
    )

    _ensure_output_directories(output_path)
    talent_trees = _collect_talent_trees(client, output_path)

    if ladder is None:
        return

    _collect_leadboard_loadouts(client, ladder, talent_trees, output_path)


def _collect_leadboard_loadouts(client: Client,
                                ladder: str,
                                talent_trees: list[TalentTree],
                                output_path: str) -> None:
    print(f"Collecting player talents for {ladder}...")
    output = {}
    for class_name, specs in SPEC_BY_CLASS.items():
        output[class_name] = {}
        for spec_name in specs:
            output[class_name][spec_name] = []

    count = 0
    for entry in get_pvp_leaderboard(client, ladder):
        player = entry.player
        rating = entry.rating

        print(f"Getting talents for {player.full_name}... ",
              end='')
        try:
            loadout = get_player_loadout(client, player)
            print(f"{loadout.class_name} - {loadout.spec_name} - {rating}")
        except Exception:
            print("Missing")
            continue

        talent_tree = _lookup_loadout_tree(loadout, talent_trees)
        if talent_tree is None:
            continue

        try:
            encoded_talents = loadout.encode(talent_tree)
            output[loadout.class_name][loadout.spec_name].append({
                'talents': encoded_talents,
                'rating': rating,
            })
        except Exception as e:
            print(f"Failed to encode talents: {e}")
        count += 1
        if count > 100:
            break

    for class_name, specs in output.items():
        for spec_name, entries in specs.items():
            filename = _get_filename(class_name, spec_name)
            path = os.path.join(output_path, PVP_DIRECTORY, filename)
            with open(path, 'w') as file:
                json.dump({
                    'entries': entries
                }, file)


def _collect_talent_trees(client: Client,
                          output_path: str) -> list[TalentTree]:
    print("Collecting talent trees...")
    talent_trees = []
    for tree in get_talent_trees(client):
        print(f"Found {tree.class_name} - {tree.spec_name}")
        talent_trees.append(tree)
        filename = _get_filename(tree.class_name, tree.spec_name)
        path = os.path.join(output_path, TALENTS_DIRECTORY, filename)
        _save_talent_tree(tree, path)
    return talent_trees


def _lookup_loadout_tree(loadout: PlayerLoadout,
                         trees: list[TalentTree]) -> TalentTree | None:
    for tree in trees:
        if (tree.spec_name == loadout.spec_name and
                tree.class_name == loadout.class_name):
            return tree

    return None


def _save_talent_tree(tree: TalentTree, path: str) -> None:
    with open(path, 'w') as file:
        json.dump({
            'class_name': tree.class_name,
            'spec_name': tree.spec_name,
            'class_nodes': [node.raw for node in tree.class_nodes],
            'spec_nodes': [node.raw for node in tree.spec_nodes],
        }, file)


def _get_filename(class_name: str, spec_name: str) -> str:
    return f"{class_name}-{spec_name}.json".lower().replace(' ', '-')


def _ensure_output_directories(path: str) -> None:
    Path(os.path.join(path, TALENTS_DIRECTORY)).mkdir(parents=True,
                                                      exist_ok=True)
    Path(os.path.join(path, PVP_DIRECTORY)).mkdir(parents=True,
                                                  exist_ok=True)


if __name__ == '__main__':
    cli()
