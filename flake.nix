{
  description = "Take screnshots of your reMarkable tablet over SSH";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: (
        let
          pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };
          packages = pkgs.callPackage ./src {};
        in {
          packages = {
            default = packages.reSnap;
            reSnap = packages.reSnap;
            rePostProcess = packages.rePostProcess;
            reSetup = packages.reSetup;
          };
          apps = rec {
            default = reSnap;
            reSnap = flake-utils.lib.mkApp {
              name = "reSnap";
              drv = packages.reSnap;
            };
            rePostProcess = flake-utils.lib.mkApp {
              name = "rePostProcess";
              drv = packages.rePostProcess;
            };
            reSetup = flake-utils.lib.mkApp {
              name = "reSetup";
              drv = packages.reSetup;
            };
          };
          devShells.default = pkgs.mkShell {
            packages = [
              pkgs.obsidian
              pkgs.feh
              pkgs.ffmpeg
              pkgs.jq
              pkgs.bun
              pkgs.typescript
              packages.reSnap
              packages.reSetup
              packages.rePostProcess
              (pkgs.python3.withPackages (ps:
                with ps; [
                  numpy
                  pillow
                ]))
            ];
          };
        }
      )
    );
}
