from wowconstants import CURRENT_PVP_SEASON


class PlayerSpecialization:
    def __init__(self, class_name, spec_name, talents):
        self.class_name = class_name
        self.spec_name = spec_name
        self.talents = talents


class Player:
    def __init__(self, realm_slug, name):
        self.realm_slug = realm_slug
        self.name = name

    @property
    def specialization_resource(self):
        return (f"/profile/wow/character/"
                f"{self.realm_slug}/{self.name}/specializations")

    @property
    def profile_resource(self):
        return (f"/profile/wow/character/"
                f"{self.realm_slug}/{self.name}")


class PvPLeaderboard:
    def __init__(self, players):
        self._players = players

    def player_ratings(self):
        for player in self._players:
            name = player["character"]["name"]
            realm = player["character"]["realm"]["slug"]
            rating = player["rating"]
            yield (Player(realm, name), rating)


def get_pvp_leaderboard(client, bracket):
    resource = ("/data/wow/"
                f"pvp-season/{CURRENT_PVP_SEASON}/"
                f"pvp-leaderboard/{bracket}")
    leaderboard = client.get_dynamic_resource(resource)
    return PvPLeaderboard(leaderboard["entries"])


def get_player_spec(client, player):
    profile = client.get_profile_resource(player.profile_resource)
    class_name = profile['character_class']['name']
    spec_name = profile['active_spec']['name']
    loadout = _get_active_load_for_player(client, player, spec_name)

    loadout_code = loadout['talent_loadout_code']
    return PlayerSpecialization(class_name, spec_name, loadout_code)


def _get_active_load_for_player(client, player, spec_name):
    response = client.get_profile_resource(player.specialization_resource)
    loadouts = None
    for spec in response['specializations']:
        if spec['specialization']['name'] == spec_name:
            loadouts = spec['loadouts']
            break

    if loadouts is None:
        raise RuntimeError(f"Unable to find loadouts for {player.name}")

    for loadout in loadouts:
        if loadout['is_active']:
            return loadout

    raise RuntimeError(f"No active loadout for {player.name}")
