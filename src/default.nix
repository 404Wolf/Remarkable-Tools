{pkgs, ...}: {
  postProcess = pkgs.callPackage ./postProcess {};
  reSnap = pkgs.callPackage ./reSnap {};
  setupRemarkable = pkgs.callPackage ./setupRemarkable {};
}
