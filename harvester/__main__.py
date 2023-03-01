import click
import dataclasses
import json
import os
from pathlib import Path

from harvester.constants import SPEC_BY_CLASS

from .bnet import Client
from .constants import CLASS_SPECS
from .media import get_spell_icon
from .player import MissingPlayerError, PlayerLoadout, get_player_loadout
from .pvp import get_pvp_leaderboard
from .talents import PvpTalent, TalentNode, TalentTree, get_talent_trees


TALENTS_DIRECTORY = 'talents'
PVP_DIRECTORY = 'pvp'

NODE_FILTER = set([
    91046,
    91047,
])


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
@click.argument('ladder',
                type=click.Choice(['2v2', '3v3', 'shuffle']),
                required=True)
@click.option('-m', '--min-shuffle-rating', type=click.INT, default=1800)
@click.pass_context
def ladder(ctx, ladder, min_shuffle_rating):
    client = ctx.obj['client']
    output_path = os.path.join(ctx.obj['output_path'], PVP_DIRECTORY, ladder)
    _create_dir(output_path)

    if ladder == 'shuffle':
        for (class_name, spec_name) in CLASS_SPECS:
            _collect_shuffle_leaderboard(client, class_name,
                                         spec_name, output_path,
                                         min_shuffle_rating)
    else:
        _collect_arena_leaderboard(client, ladder, output_path)


@cli.command()
@click.pass_context
def talents(ctx):
    client = ctx.obj['client']
    output_path = os.path.join(ctx.obj['output_path'], TALENTS_DIRECTORY)
    talent_trees = _collect_talent_trees(client)
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


def _collect_shuffle_leaderboard(client: Client, class_name: str,
                                 spec_name: str, output_path: str,
                                 min_rating: int = 1800) -> None:
    print(("Collecting player talents for "
           f"Solo Shuffle {class_name} - {spec_name}..."))

    output = []
    class_slug = class_name.lower().replace(' ', '')
    spec_slug = spec_name.lower().replace(' ', '')
    ladder = f'shuffle-{class_slug}-{spec_slug}'

    for entry in get_pvp_leaderboard(client, ladder):
        player = entry.player
        rating = entry.rating

        if rating < min_rating:
            break

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

        output.append(_rated_loadout_to_dict(loadout, rating))

    filename = _get_filename(class_name, spec_name)
    path = os.path.join(output_path, filename)
    with open(path, 'w') as file:
        json.dump({
            'entries': output
        }, file, indent=2)


def _collect_arena_leaderboard(client: Client,
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

        output[loadout.class_name][loadout.spec_name].append(
            _rated_loadout_to_dict(loadout, rating)
        )

    for class_name, specs in output.items():
        for spec_name, entries in specs.items():
            if len(entries) == 0:
                continue

            filename = _get_filename(class_name, spec_name)
            path = os.path.join(output_path, filename)
            with open(path, 'w') as file:
                json.dump({
                    'entries': entries
                }, file, indent=2)


def _rated_loadout_to_dict(loadout: PlayerLoadout, rating: int) -> dict:
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


def _collect_talent_trees(client: Client) -> list[TalentTree]:
    print("Collecting talent trees...")
    talent_trees = []
    for tree in get_talent_trees(client):
        print(f"Found {tree.class_name} - {tree.spec_name}")
        talent_trees.append(tree)
    return talent_trees


def _filter_nodes(nodes: list[TalentNode]) -> list[TalentNode]:
    return list(filter(
        lambda node: (node.id not in NODE_FILTER),
        nodes,
    ))


def _save_talent_tree(tree: TalentTree, spell_media: dict[int, str],
                      path: str) -> None:
    with open(path, 'w') as file:
        json.dump({
            'class_name': tree.class_name,
            'spec_name': tree.spec_name,
            'class_nodes': _nodes_to_json(_filter_nodes(tree.class_nodes),
                                          spell_media),
            'spec_nodes': _nodes_to_json(_filter_nodes(tree.spec_nodes),
                                         spell_media),
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


def _create_dir(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)


if __name__ == '__main__':
    cli()
