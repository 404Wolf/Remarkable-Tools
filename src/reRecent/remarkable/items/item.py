blank_metadata = {
    "Bookmarked": False,
    "ID": None,
    "ModifiedClient": None,
    "Parent": None,
    "Type": None,
    "VissibleName": None,
    "tags": [],
}


class Item:
    """
    An item on the remarkable.

    metadata: The raw metadata of the item.
    is_dummy: Whether this item is a dummy item.
    """

    def __init__(self, metadata: dict, is_dummy: bool = False):
        self.metadata = metadata
        self.is_dummy = is_dummy

    def __getitem__(self, item: str):
        return self.metadata[item]

    @classmethod
    def dummy(cls):
        """A dummy item."""
        return cls(blank_metadata, is_dummy=True)

    @property
    def type(self):
        """The item's type."""
        return self["Type"]

    @property
    def id(self):
        """The item's UUID."""
        return self["ID"]

    @property
    def name(self):
        """The item's name."""
        return self["VissibleName"]

    @property
    def bookmarked(self):
        """Whether the item is bookmarked."""
        return self["Bookmarked"]

    @property
    def tags(self):
        """The item's tags."""
        return self["tags"]
