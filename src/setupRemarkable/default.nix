{pkgs, ...}:
pkgs.writeShellApplication {
  name = "setup-remarkable";
  runtimeInputs = with pkgs; [sshpass];
  checkPhase = "";
  text = ''
    lz4=${./lz4.arm.static}
    echo lz4 path: $lz4
    REMARKABLE_PASSWORD=$1
    KEY_TYPE="ed25519"
    KEY_PATH="$HOME/.ssh/remarkable"
    KEY_COMMENT="remarkable_auto_generated_key"
    ${builtins.readFile ./setupRemarkable.sh}
  '';
}
