import click
import os

from .bnet import Client
from .talents import get_talent_trees


@click.command()
@click.option('--output', 'output_path',
              type=click.Path(exists=True, file_okay=False),
              default='out')
@click.option('--ladder', default='3v3')
@click.option("--client-id", "client_id",
              default=lambda: os.environ.get("WOW_CLIENT_ID", ""))
@click.option("--client-secret", "client_secret",
              default=lambda: os.environ.get("WOW_CLIENT_SECRET", ""))
def cli(output_path, ladder, client_id, client_secret):
    client = Client(
        client_id,
        client_secret,
    )

    print("Collecting talent trees...")
    talent_trees = []
    for tree in get_talent_trees(client):
        print(f"Found {tree.class_name} - {tree.spec_name}")
        talent_trees.append(tree)


def _get_filename(class_name: str, spec_name: str) -> str:
    return f"{class_name}-{spec_name}.json".lower().replace(' ', '-')


if __name__ == '__main__':
    cli()
