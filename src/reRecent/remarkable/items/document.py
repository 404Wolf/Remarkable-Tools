import tempfile
from contextlib import suppress
from pathlib import Path
from tarfile import TarFile

import requests

from remarkable.client import Client
from remarkable.items.item import Item


class Document(Item):
    """
    A document on the remarkable.
    """

    def pdf(self, path: Path):
        """Obtain document as PDF."""
        while True:
            try:
                document = requests.get(f"http://10.11.99.1/download/{self.id}/placeholder")
                with open(path, "wb") as f:
                    f.write(document.content)
                break
            except requests.exceptions.ConnectionError:
                    input("Lost connection to tablet. Please reconnect and press enter to continue.")

    def rmn(self, client: Client, path: Path):
        with tempfile.TemporaryDirectory() as tempdir:
            # Base directories
            tempdir = Path(tempdir)
            base_path = client.base_path

            client.download_dir(base_path / self.id, Path(tempdir) / tempdir / self.id)

            extra_data_files = (
                "metadata",
                "pagedata",
                "content",
                "pdf",
                "epub",
            )

            for extra_data_file in extra_data_files:
                filename = f"{self.id}.{extra_data_file}"
                with suppress(FileNotFoundError):
                    client.download_file(base_path / filename, tempdir / filename)

            with TarFile(path, "w") as output:
                output.add(tempdir, "")
