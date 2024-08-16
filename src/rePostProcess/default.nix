{pkgs, ...}: let
  python = pkgs.python3.withPackages (ps:
    with ps; [
      numpy
      pillow
    ]);
in
  pkgs.writeShellScriptBin "rePostProcess" ''
    ${python}/bin/python3 -O ${./rePostProcess.py} "$@"
  ''
