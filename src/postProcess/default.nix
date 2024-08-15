{pkgs, ...}: let
  python = pkgs.python3.withPackages (ps:
    with ps; [
      numpy
      pillow
    ]);
in
  pkgs.writeShellScriptBin "postProcess" ''
    ${python}/bin/python3 -O ${./postProcess.py} $@
  ''
