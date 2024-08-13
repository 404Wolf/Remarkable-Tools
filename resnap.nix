{
  pkgs,
  requirements,
}:
pkgs.writeShellApplication {
  name = "reSnap";
  runtimeInputs = requirements;
  text = builtins.readFile ./reSnap.sh;
}
