from .bnet import Client


def get_spell_icon(client: Client, spell_id: int) -> str:
    response = client.get_static_resource(f'/data/wow/media/spell/{spell_id}')
    for asset in response['assets']:
        if asset['key'] == 'icon':
            return asset['value']
    raise RuntimeError(f'Unable to find icon for {spell_id}.')
