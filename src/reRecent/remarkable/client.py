import os
import stat
from contextlib import suppress
from pathlib import Path

import paramiko
from paramiko.client import AutoAddPolicy


class Client:
    """
    Client to access remarkable over ssh.

    Use context manager syntax.

    Attributes:
        ip: The IP of the tablet.
        port: The port of the tablet.
        username: The tablet's SSH username.
        password: The SSH password to access the tablet.
    """

    base_path = Path(".local") / "share" / "remarkable" / "xochitl"

    def __init__(self, ip: str, port: str, username: str, password: str):
        self.ip = ip
        self.port = port
        self.username, self.password = username, password
        self._ssh_client = paramiko.SSHClient()
        self._sftp_client: paramiko.SFTPClient = None # type: ignore

    def __enter__(self):
        self._ssh_client.set_missing_host_key_policy(AutoAddPolicy)
        self._ssh_client.connect(
            self.ip,
            username=self.username,
            password=self.password,
        )
        self._sftp_client = self._ssh_client.open_sftp()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._ssh_client.close()

    def list_dir(self, path: Path = Path(".")):
        """List the files of a directory."""
        return self._sftp_client.listdir(path.as_posix())

    def exists(self, file: Path):
        """Check whether a file exists."""
        try:
            self._sftp_client.stat(file.as_posix())
            return True
        except FileNotFoundError:
            return False

    def download_file(self, rm_path: Path, out_path: Path):
        """Download a file from the tablet."""
        while True:
            try:
                if self.exists(rm_path):
                    self._sftp_client.get(rm_path.as_posix(), str(out_path))
                else:
                    raise FileNotFoundError(f"Unable to locate file at {rm_path}.")
                break
            except paramiko.SSHException:
                input("Lost connection to tablet. Please reconnect and press enter to continue.")
                self.__enter__()

    def download_dir(self, rm_path: Path, out_path: Path):
        """Download a directory from the tablet."""

        # Recursively download the remote directory
        def _download_dir(remote_dir: Path, local_dir: Path):
            with suppress(FileNotFoundError):
                os.makedirs(local_dir, exist_ok=True)
                print(remote_dir.as_posix())
                for item in self._sftp_client.listdir_attr(remote_dir.as_posix()):
                    remote_path = remote_dir / item.filename
                    local_path = local_dir / item.filename

                    # It's a subdirectory
                    if stat.S_ISDIR(item.st_mode):
                        _download_dir(remote_path, local_path)
                    # It's a file
                    else:
                        self.download_file(remote_path, local_path)

        _download_dir(rm_path, out_path)
