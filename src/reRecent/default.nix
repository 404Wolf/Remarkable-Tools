{pkgs, ...}: let
  python = pkgs.python3.withPackages (ps:
    with ps; [
      paramiko
    ]);
in
  pkgs.writeShellScriptBin "reRecent" ''
    ${python}/bin/python3 -O ${./rePostProcess.py} "$@"
  ''
