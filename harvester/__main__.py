import click
import dataclasses
import json
import os
from pathlib import Path

from harvester.constants import SPEC_BY_CLASS

from .bnet import Client
from .media import get_spell_icon
from .player import MissingPlayerError, get_player_loadout
from .pvp import get_pvp_leaderboard
from .talents import PvpTalent, TalentNode, TalentTree, get_talent_trees


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
@click.pass_context
def cli(ctx, output_path, client_id, client_secret):
    client = Client(
        client_id,
        client_secret,
    )

    ctx.obj = {
        'client': client,
        'output_path': output_path,
    }


@cli.command()
@click.argument('ladder', required=True)
@click.pass_context
def ladder(ctx, ladder):
    client = ctx.obj['client']
    output_path = ctx.obj['output_path']
    _create_dir(output_path, f'{PVP_DIRECTORY}/{ladder}')

    _collect_leadboard_loadouts(client, ladder, output_path)


@cli.command()
@click.pass_context
def talents(ctx):
    client = ctx.obj['client']
    output_path = ctx.obj['output_path']
    talent_trees = _collect_talent_trees(client)
    _create_dir(output_path, TALENTS_DIRECTORY)

    for tree in talent_trees:
        print(f"Getting media for {tree.class_name} - {tree.spec_name}...")
        media = {}
        for spell in tree.all_spells():
            if spell.id not in media:
                print(f"Fetching icon for {spell.name}...")
                media[spell.id] = get_spell_icon(client, spell.id)
        filename = _get_filename(tree.class_name, tree.spec_name)
        path = os.path.join(output_path, TALENTS_DIRECTORY, filename)
        _save_talent_tree(tree, media, path)


def _collect_leadboard_loadouts(client: Client,
                                ladder: str,
                                output_path: str) -> None:
    print(f"Collecting player talents for {ladder}...")
    output = {}
    for class_name, specs in SPEC_BY_CLASS.items():
        output[class_name] = {}
        for spec_name in specs:
            output[class_name][spec_name] = []

    for entry in get_pvp_leaderboard(client, ladder):
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

        output[loadout.class_name][loadout.spec_name].append({
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
        })

    for class_name, specs in output.items():
        for spec_name, entries in specs.items():
            filename = _get_filename(class_name, spec_name)
            path = os.path.join(output_path, PVP_DIRECTORY, ladder, filename)
            with open(path, 'w') as file:
                json.dump({
                    'entries': entries
                }, file, indent=2)


def _collect_talent_trees(client: Client) -> list[TalentTree]:
    print("Collecting talent trees...")
    talent_trees = []
    for tree in get_talent_trees(client):
        print(f"Found {tree.class_name} - {tree.spec_name}")
        talent_trees.append(tree)
    return talent_trees


def _save_talent_tree(tree: TalentTree, spell_media: dict[int, str],
                      path: str) -> None:
    with open(path, 'w') as file:
        json.dump({
            'class_name': tree.class_name,
            'spec_name': tree.spec_name,
            'class_nodes': _nodes_to_json(tree.class_nodes, spell_media),
            'spec_nodes': _nodes_to_json(tree.spec_nodes, spell_media),
            'pvp_talents': _pvp_talents_to_json(tree.pvp_talents, spell_media),
        }, file, indent=2)


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


def _get_filename(class_name: str, spec_name: str) -> str:
    return f"{class_name}-{spec_name}.json".lower().replace(' ', '-')


def _create_dir(base_path: str, sub_dir: str) -> None:
    Path(
        os.path.join(base_path, sub_dir)
    ).mkdir(parents=True, exist_ok=True)


if __name__ == '__main__':
    cli()
