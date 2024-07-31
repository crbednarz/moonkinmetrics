from typing import Optional


def fix_raw_node(raw_node: dict) -> Optional[dict]:
    """Attempts to correct missing or incomplete data in raw talent node."""

    if "ranks" not in raw_node or len(raw_node["ranks"]) == 0:
        # Augmentation seems to have an invisible node with no ranks.
        # For now we'll just ignore it.
        return None

    if (
        "tooltip" not in raw_node["ranks"][0]
        and "choice_of_tooltips" not in raw_node["ranks"][0]
    ):
        # 11.0 seems to have added empty nodes. For now they'll be ignored.
        return None

    return raw_node


def is_spec_api_incorrect(class_name: str, spec_name: str) -> bool:
    """Returns True if spec is expected to be incorrect in the API.
    This is not the same as a spec being missing."""

    return False
