{pkgs, ...}: let
  python = pkgs.python3.withPackages (ps:
    with ps; [
      numpy
      pillow
      scikit-image
      scipy
      opencv4
    ]);
in
  pkgs.writeShellScriptBin "postProcess" ''
    ${python}/bin/python3 -O ${./postProcess.py} $@
  ''
