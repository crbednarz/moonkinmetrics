import click
import json
import os

from wow import Client
from talents import get_talent_index, get_talents
from pvp import get_pvp_leaderboard, get_player_spec
from wowconstants import CLASS_NAMES


@click.group()
def cli():
    pass


@cli.command()
@click.option("--client-id", "client_id",
              default=lambda: os.environ.get("WOW_CLIENT_ID", ""))
@click.option("--client-secret", "client_secret",
              default=lambda: os.environ.get("WOW_CLIENT_SECRET", ""))
def ladder(client_id, client_secret):
    client = Client(
        client_id,
        client_secret,
    )
    leaderboard = get_pvp_leaderboard(client, '3v3')

    for player, rating in leaderboard.player_ratings():
        spec = get_player_spec(client, player)
        if spec.class_name.lower() != "hunter":
            continue


@cli.command()
@click.option('--output',
              type=click.Path(exists=True, file_okay=False),
              default='.')
@click.option("--client-id", "client_id",
              default=lambda: os.environ.get("WOW_CLIENT_ID", ""))
@click.option("--client-secret", "client_secret",
              default=lambda: os.environ.get("WOW_CLIENT_SECRET", ""))
def tree(output, client_id, client_secret):
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
                json.dump(talents, file)


def _get_talents_filename(class_name, spec_name):
    return f"{class_name}-{spec_name}.json".lower().replace(' ', '-')


if __name__ == '__main__':
    cli()
