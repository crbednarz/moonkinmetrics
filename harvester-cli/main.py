import base64
import click
import json
import os

from wow import Client
from talents import get_talent_index, get_talents
from pvp import get_pvp_leaderboard, get_player_loadout
from wowconstants import CLASS_NAMES, SPEC_NAMES


@click.group()
def cli():
    pass


@cli.command('ladder')
@click.option('--talents', 'talents_path',
              type=click.Path(exists=True, file_okay=False),
              default='talents')
@click.option('--output', 'output_path',
              type=click.Path(exists=True, file_okay=False),
              default='ladder')
@click.option('--ladder', default='3v3')
@click.option("--client-id", "client_id",
              default=lambda: os.environ.get("WOW_CLIENT_ID", ""))
@click.option("--client-secret", "client_secret",
              default=lambda: os.environ.get("WOW_CLIENT_SECRET", ""))
def ladder_command(talents_path, output_path, ladder,
                   client_id, client_secret):
    client = Client(
        client_id,
        client_secret,
    )
    leaderboard = get_pvp_leaderboard(client, ladder)
    local_talents = _get_local_talents(talents_path)

    output = {}
    for class_name, specs in SPEC_NAMES.items():
        output[class_name] = {}
        for spec_name in specs:
            output[class_name][spec_name] = []

    for player, rating in leaderboard.player_ratings():
        print(f"Getting talents for {player.name}-{player.realm_slug}... ",
              end='')
        try:
            loadout = get_player_loadout(client, player)
            print(f"{loadout.class_name} - {loadout.spec_name} - {rating}")
        except Exception:
            print("Missing")
            continue

        if loadout.spec_name not in local_talents[loadout.class_name]:
            continue

        talents = local_talents[loadout.class_name][loadout.spec_name]
        class_nodes = talents['class_nodes']
        spec_nodes = talents['spec_nodes']

        try:
            encoded_talents = _encode_talents(loadout, class_nodes, spec_nodes)
            output[loadout.class_name][loadout.spec_name].append({
                'talents': encoded_talents,
                'rating': rating,
            })
        except Exception as e:
            print(f"Failed to encode talents!\n{e}")

    for class_name, specs in output.items():
        for spec_name, entries in specs.items():
            filename = _get_talents_filename(class_name, spec_name)
            with open(f'{output_path}/{filename}', 'w') as file:
                json.dump({
                    'entries': entries
                }, file)


@cli.command('talents')
@click.option('--output',
              type=click.Path(exists=True, file_okay=False),
              default='talents')
@click.option("--client-id", "client_id",
              default=lambda: os.environ.get("WOW_CLIENT_ID", ""))
@click.option("--client-secret", "client_secret",
              default=lambda: os.environ.get("WOW_CLIENT_SECRET", ""))
def talents_command(output, client_id, client_secret):
    client = Client(
        client_id,
        client_secret,
    )
    talent_index = get_talent_index(client)

    for class_name in CLASS_NAMES:
        class_talents = get_talents(client, talent_index, class_name)
        for spec_name, talents in class_talents.items():
            filename = _get_talents_filename(class_name, spec_name)
            with open(f'{output}/{filename}', 'w') as file:
                json.dump({
                    'class_nodes': talents.class_nodes,
                    'spec_nodes': talents.spec_nodes,
                }, file)


def _get_talents_filename(class_name, spec_name):
    return f"{class_name}-{spec_name}.json".lower().replace(' ', '-')


def _get_local_talents(talents_path):
    talents = {}
    for class_name, specs in SPEC_NAMES.items():
        talents[class_name] = {}
        for spec_name in specs:
            filename = _get_talents_filename(class_name, spec_name)
            if not os.path.exists(f'{talents_path}/{filename}'):
                continue

            with open(f'{talents_path}/{filename}', 'r') as file:
                talents[class_name][spec_name] = json.load(file)
    return talents


def _encode_talents(player_loadout, class_nodes, spec_nodes):
    encoded_class_talents = _encode_nodes(player_loadout.class_nodes,
                                          class_nodes)
    encoded_spec_talents = _encode_nodes(player_loadout.spec_nodes,
                                         spec_nodes)
    return f"{encoded_class_talents}/{encoded_spec_talents}"


def _encode_nodes(selected_nodes, all_nodes):
    index_map = {}
    for i, node in enumerate(all_nodes):
        index_map[node['id']] = i

    output = bytearray((len(index_map) + 1) // 2)

    for node in selected_nodes:
        index = index_map[node['id']]
        rank = node['rank']
        if index % 2 == 0:
            output[index // 2] |= rank
        else:
            output[index // 2] |= (rank << 2)

    return base64.b64encode(output).decode('utf-8')


if __name__ == '__main__':
    cli()
