from collections.abc import Callable
from datetime import datetime
from pathlib import Path
from tempfile import NamedTemporaryFile
import logging

from remarkable import Client
from remarkable.items import Collection, Document
from remarkable.items.item import Item


def walk_collection(
    collection: Collection,
    client: Client,
    action: Callable,
    path: Path = Path("."),
):
    for item in collection.items():
        if isinstance(item, Collection):
            walk_collection(item, client, action, path / item.name)
        elif isinstance(item, Document):
            action(item)


def main():
    with Client("10.11.99.1", "22", "root", "EUyAqTSK0Y") as client:
        newest_date = datetime.fromtimestamp(0)
        newest_item: Document = None  # type: ignore

        def _process_item(item: Item):
            nonlocal newest_date, newest_item
            if isinstance(item, Document):
                modified = datetime.fromisoformat(
                    item.metadata["ModifiedClient"]
                ).replace(tzinfo=None)
                if modified > newest_date:
                    newest_date = modified
                    newest_item = item

        walk_collection(Collection.from_root(), client, _process_item)

    if newest_item is None:
        raise ValueError("No items found.")

    with NamedTemporaryFile(delete=False) as file:
        print(file.name)
        newest_item.pdf(Path(file.name))


if __name__ == "__main__":
    # logging.basicConfig(level=logging.DEBUG)

    main()
