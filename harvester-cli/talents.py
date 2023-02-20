from wowconstants import SPEC_NAMES

import re


class TalentTreeIndex:
    def __init__(self, class_links, spec_links):
        self.class_links = class_links
        self.spec_links = spec_links

    def get_class_link(self, class_name):
        for class_link in self.class_links:
            if class_link.class_name.lower() == class_name.lower():
                return class_link

        return None

    def get_spec_link(self, class_name, spec_name):
        class_link = self.get_class_link(class_name)
        if class_link is None:
            return None

        for spec_link in self.spec_links:
            if (spec_link.class_id == class_link.id and
                    spec_link.spec_name.lower() == spec_name.lower()):
                return spec_link
        return None

    def get_spec_links(self, class_name):
        class_link = self.get_class_link(class_name)
        if class_link is None:
            return None

        links = []
        for spec_link in self.spec_links:
            if spec_link.class_id == class_link.id:
                links.append(spec_link)
        return links


class ClassTalentTreeLink:
    def __init__(self, url, class_name):
        result = re.search(r'/talent-tree/(\d+)', url)
        if result is None:
            raise RuntimeError(f"Unable to find id in {url}")
        self.id = result.group(1)
        self.url = url
        self.class_name = class_name


class SpecTalentTreeLink:
    def __init__(self, url, spec_name):
        result = re.search(r'/talent-tree/(\d+)/[^/]+/(\d+)', url)
        if result is None:
            raise RuntimeError(f"Unable to find id in {url}")
        self.class_id = result.group(1)
        self.spec_id = result.group(2)
        self.url = url
        self.spec_name = spec_name


class TalentTree:
    def __init__(self, class_nodes, spec_nodes):
        self.class_nodes = class_nodes
        self.spec_nodes = spec_nodes


def _get_talent_tree_links(client):
    tree_index = client.get_static_resource("/data/wow/talent-tree/index")
    class_links = []
    for entry in tree_index['class_talent_trees']:
        class_links.append(ClassTalentTreeLink(
            entry['key']['href'].split('?')[0],
            entry['name'],
        ))

    spec_links = []
    for entry in tree_index['spec_talent_trees']:
        spec_links.append(SpecTalentTreeLink(
            entry['key']['href'].split('?')[0],
            entry['name'],
        ))

    return (class_links, spec_links)


def get_talent_index(client):
    (class_links, spec_links) = _get_talent_tree_links(client)
    return TalentTreeIndex(class_links, spec_links)


def get_talents(client, talent_index, class_name):
    print(f"Getting talents for {class_name}...")
    spec_names = SPEC_NAMES[class_name]
    talent_trees = _get_listed_talents(client, talent_index, class_name)

    if len(spec_names) != len(talent_trees):
        print(f"Skipping missing specs for {class_name}...")

    return talent_trees


def _get_listed_talents(client, talent_index, class_name):
    """Returns dict containing the talents nodes for each spec with a listing
    within the talent index."""
    spec_links = talent_index.get_spec_links(class_name)

    talent_trees = {}
    for spec_link in spec_links:
        print(f"Getting talents for {class_name} - {spec_link.spec_name}...")
        talents = _get_spec_talents(client, spec_link)
        talent_trees[spec_link.spec_name] = talents

    return talent_trees


def _get_spec_talents(client, link):
    response = client.get_url(link.url)
    return TalentTree(response['class_talent_nodes'],
                      response['spec_talent_nodes'])
