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
          packages = rec {
            reSnap = packages.reSnap;
            rePostProcess = packages.rePostProcess;
            reSetup = packages.reSetup;
            obsidian = pkgs.obsidian.overrideAttrs (oldAttrs: {
              postInstall = ''
                wrapProgram $out/bin/obsidian --prefix PATH : "${pkgs.lib.makeBinPath ((with pkgs;
                  [pandoc texliveTeTeX typst]
                  ++ [reSnap rePostProcess])
                ++ [reSnap rePostProcess])}"
              '';
            });
          };
          apps = {
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
            packages = with packages;
              [
                reSnap
                reSetup
                rePostProcess
                (pkgs.python3.withPackages (ps:
                  with ps; [
                    numpy
                    pillow
                    paramiko
                    requests
                  ]))
              ]
              ++ (with pkgs; [
                feh
                ffmpeg
                jq
                bun
                typescript
                obsidian
                sqlite
              ]);
          };
        }
      )
    );
}
