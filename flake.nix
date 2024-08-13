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
    flake-utils.lib.eachDefaultSystem
    (
      system: let
        pkgs = import nixpkgs {
          inherit system;
        };
        requirements = with pkgs; [
          ffmpeg
          feh
          imagemagick_light
        ];
      in rec {
        packages = {
          reSnap = import ./resnap.nix {inherit pkgs requirements;};
        };
        apps = rec {
          default = reSnap;
          reSnap = flake-utils.lib.mkApp {
            name = "reSnap";
            drv = packages.reSnap;
          };
          setup-remarkable = flake-utils.lib.mkApp {
            name = "setup-remarkable";
            drv = pkgs.writeShellApplication {
              name = "setup-remarkable";
              runtimeInputs = [pkgs.sshpass];
              checkPhase = "";
              text = ''
                lz4=${./lz4.arm.static}
                echo lz4 path: $lz4
                REMARKABLE_PASSWORD=$1
                KEY_TYPE="ed25519"
                KEY_PATH="$HOME/.ssh/remarkable"
                KEY_COMMENT="remarkable_auto_generated_key"
                ${builtins.readFile ./setup-remarkable.sh}
              '';
            };
          };
        };
        devShells.default = pkgs.mkShell {
          packages =
            requirements
            ++ (with pkgs; [
              lz4
            ]);
        };
      }
    );
}
