from typing import Optional


def fix_raw_node(raw_node: dict) -> Optional[dict]:
    """Attempts to correct missing or incomplete data in raw talent node."""

    if 'ranks' not in raw_node or len(raw_node['ranks']) == 0:
        # Augmentation seems to have an invisible node with no ranks.
        # For now we'll just ignore it.
        return None

    base_rank = raw_node['ranks'][0]

    if False and raw_node['id'] == 93539 and len(base_rank['choice_of_tooltips']) == 1:
        description = (
            "Summon Demonic Tyrant empowers 5 additional Wild Imps and deals "
            "10% increased damage for each demon he empowers.")
        name = "Reign of Tyrrany"
        spell_id = 427684
        talent_id = 96511
        talent_url = f"https://us.api.blizzard.com/data/wow/talent/{talent_id}"
        spell_url = f"https://us.api.blizzard.com/data/wow/spell/{spell_id}"

        base_rank['choice_of_tooltips'] += [{
            "talent": {
                "key": {
                    "href": talent_url,
                },
                "name": name,
                "id": talent_id,
            },
            "spell_tooltip": {
                "spell": {
                    "key": {
                        "href": spell_url,
                    },
                    "name": name,
                    "id": spell_id,
                },
                "description": description,
                "cast_time": "Passive",
            },
        }]

    return raw_node


def is_spec_api_incorrect(class_name: str, spec_name: str) -> bool:
    """Returns True if spec is expected to be incorrect in the API.
    This is not the same as a spec being missing."""

    if class_name == "Warlock" and (spec_name == "Demonology" or
                                    spec_name == "Destruction"):
        # Unfortunately Demonology and Destruction seems to have incorrect
        # data in the API, so we'll rely on the node list scanned from the
        # game instead.
        return True

    return False
