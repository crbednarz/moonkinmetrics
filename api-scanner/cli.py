import click
import os

from scanner.bnet import Client
from scanner.main import scan_pvp_ladder, scan_talents


@click.group()
@click.option("--output", "-o", "output_path",
              type=click.Path(file_okay=False),
              default='ui/wow/')
@click.option("--client-id", "client_id",
              default=lambda: os.environ.get("WOW_CLIENT_ID", ""))
@click.option("--client-secret", "client_secret",
              default=lambda: os.environ.get("WOW_CLIENT_SECRET", ""))
@click.option("--cache-path", "cache_path", default=".cache")
@click.option("--region", "-r", "region", default="us")
@click.pass_context
def cli(ctx, output_path, client_id, client_secret, cache_path, region):
    client = Client(
        client_id,
        client_secret,
        cache_path=cache_path,
        region=region,
    )

    ctx.obj = {
        'client': client,
        'output_path': output_path,
    }


@cli.command()
@click.argument('bracket',
                type=click.Choice(['2v2', '3v3', 'shuffle', 'rbg']),
                required=True)
@click.option('-m', '--min-rating', type=click.INT, default=1600)
@click.option('-l', '--max-entries', type=click.INT, default=7500)
@click.option('--shuffle-class', type=click.STRING)
@click.option('--shuffle-spec', type=click.STRING)
@click.pass_context
def ladder(ctx, bracket, min_rating, max_entries, shuffle_class, shuffle_spec):
    scan_pvp_ladder(
        ctx.obj['client'],
        ctx.obj['output_path'],
        bracket,
        min_rating,
        max_entries,
        shuffle_class,
        shuffle_spec,
    )


@cli.command()
@click.pass_context
def talents(ctx):
    scan_talents(
        ctx.obj['client'],
        ctx.obj['output_path'],
    )


if __name__ == '__main__':
    cli()
