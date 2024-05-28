import base64
import dataclasses

from .player import Realm
from .pvp import RatedLoadout
from .talents import Talent, TalentNode, TalentTree


class LoadoutEncoder:
    VERSION = 1

    def __init__(self, tree: TalentTree, realms: list[Realm]):
        self._talent_map = LoadoutEncoder._create_talent_encode_map(
            tree.class_nodes + tree.spec_nodes
        )
        self._pvp_talent_map = LoadoutEncoder._create_pvp_index_map(tree.pvp_talents)

        self._multi_rank_nodes = set(
            [
                node.id
                for node in tree.class_nodes + tree.spec_nodes
                if node.max_rank > 1
            ]
        )
        self._realm_map: dict[str, int] = {}
        self._realm_names: dict[str, str] = {}
        for realm in realms:
            self._realm_names[realm.slug] = realm.name

    def metadata(self) -> dict:
        realm_list = [""] * len(self._realm_map)
        for realm, index in self._realm_map.items():
            realm_list[index] = realm

        return {
            "version": LoadoutEncoder.VERSION,
            "realms": [
                {
                    "slug": slug,
                    "name": self._realm_names[slug],
                }
                for slug in realm_list
            ],
        }

    def encode_loadout(self, rated_loadout: RatedLoadout) -> str:
        """Encodes a rated loadout into a base64 compact string."""
        output = bytearray()

        loadout = rated_loadout.loadout
        nodes = loadout.class_nodes + loadout.spec_nodes

        output.append(len(nodes))
        for node in nodes:
            output.append(self._talent_map[node.talent_id])
            if node.node_id in self._multi_rank_nodes:
                output.append(node.rank)

        output.append(len(loadout.pvp_talents))
        for talent in loadout.pvp_talents:
            output.append(self._pvp_talent_map[talent.id])

        rating = rated_loadout.rating
        output.append(rating & 0xFF)
        output.append((rating >> 8) & 0xFF)

        realm = rated_loadout.player.realm.slug
        realm_index = self._realm_map.setdefault(realm, len(self._realm_map))
        output.append(realm_index & 0xFF)
        output.append((realm_index >> 8) & 0xFF)
        output.append(1 if rated_loadout.faction == "HORDE" else 0)

        return "|".join(
            [
                base64.b64encode(output).decode("ascii"),
                rated_loadout.player.name,
                rated_loadout.loadout.code,
            ]
        )

    @staticmethod
    def _create_pvp_index_map(talents: list[Talent]) -> dict[int, int]:
        sorted_ids = sorted([talent.id for talent in talents])
        return {talent_id: index for index, talent_id in enumerate(sorted_ids)}

    @staticmethod
    def _create_talent_encode_map(nodes: list[TalentNode]) -> dict[int, int]:
        talent_ids = []
        for node in nodes:
            for talent in node.talents:
                talent_ids.append(talent.id)

        talent_ids.sort()
        talent_map = {}
        for index, talent_id in enumerate(talent_ids):
            talent_map[talent_id] = index

        return talent_map


def encode_loadouts(
    loadouts: list[RatedLoadout], tree: TalentTree, realms: list[Realm]
) -> dict:
    encoder = LoadoutEncoder(tree, realms)
    entries = [encoder.encode_loadout(loadout) for loadout in loadouts]
    return {
        "encoding": encoder.metadata(),
        "entries": entries,
    }


def talent_tree_to_dict(tree: TalentTree, spell_media: dict[int, str]) -> dict:
    return {
        "class_name": tree.class_name,
        "class_id": tree.class_id,
        "spec_name": tree.spec_name,
        "spec_id": tree.spec_id,
        "class_nodes": _nodes_to_json(tree.class_nodes, spell_media),
        "spec_nodes": _nodes_to_json(tree.spec_nodes, spell_media),
        "pvp_talents": _pvp_talents_to_json(tree.pvp_talents, spell_media),
    }


def _nodes_to_json(nodes: list[TalentNode], spell_media: dict[int, str]) -> list[dict]:
    output = []
    for node in nodes:
        node_dict = dataclasses.asdict(node)
        for talent in node_dict["talents"]:
            talent["icon"] = spell_media[talent["spell"]["id"]]
        output.append(node_dict)
    return output


def _pvp_talents_to_json(
    talents: list[Talent], spell_media: dict[int, str]
) -> list[dict]:
    output = []
    for talent in talents:
        talent_dict = dataclasses.asdict(talent)
        talent_dict["icon"] = spell_media[talent.spell.id]
        output.append(talent_dict)

    return output
