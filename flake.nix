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
            postProcess = packages.postProcess;
            setupRemarkable = packages.setupRemarkable;
          };
          apps = rec {
            default = reSnap;
            reSnap = flake-utils.lib.mkApp {
              name = "reSnap";
              drv = packages.reSnap;
            };
            postProcess = flake-utils.lib.mkApp {
              name = "postProcess";
              drv = packages.postProcess;
            };
            setupRemarkable = flake-utils.lib.mkApp {
              name = "setupRemarkable";
              drv = packages.setupRemarkable;
            };
          };
          devShells.default = pkgs.mkShell {
            packages = with packages; (with pkgs; [
              feh
              (pkgs.symlinkJoin {
                name = "obsidian";
                paths = [pkgs.obsidian reSnap postProcess];
                buildInputs = [pkgs.makeWrapper];
                postBuild = ''
                  wrapProgram $out/bin/obsidian \
                    --set PATH $PATH:${pkgs.lib.makeBinPath [
                    reSnap
                    postProcess
                    pkgs.openssh
                  ]}
                '';
              })
              (pkgs.python3.withPackages (ps:
                with ps; [
                  numpy
                  pillow
                ]))
            ]);
            inputsFrom = with packages; [
              reSnap
              postProcess
              setupRemarkable
            ];
          };
        }
      )
    );
}
