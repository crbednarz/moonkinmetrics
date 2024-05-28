from .bnet import Client


async def get_spell_icons(client: Client, spell_ids: list[int]) -> dict[int, str]:
    spells_with_context = [
        (f"/data/wow/media/spell/{spell_id}", spell_id) for spell_id in spell_ids
    ]

    media = {}
    requests = client.get_static_resources(spells_with_context)
    async for response, _, spell_id in requests:
        for asset in response["assets"]:
            if asset["key"] == "icon":
                media[spell_id] = asset["value"]
                break
        else:
            raise RuntimeError(f"Unable to find icon for {spell_id}.")
    return media


def get_spell_icon(client: Client, spell_id: int) -> str:
    response = client.get_static_resource(f"/data/wow/media/spell/{spell_id}")
    for asset in response["assets"]:
        if asset["key"] == "icon":
            return asset["value"]
    raise RuntimeError(f"Unable to find icon for {spell_id}.")
