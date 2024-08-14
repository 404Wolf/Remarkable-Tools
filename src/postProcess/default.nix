{python3Packages, ...}:
python3Packages.buildPythonApplication {
  pname = "postProcess";
  src = ./postProcess.py;
  version = "1.0";
  buildInputs = with python3Packages; [
    numpy
    pillow
  ];
}
