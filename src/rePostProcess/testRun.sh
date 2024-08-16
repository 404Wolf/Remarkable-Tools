cp test.png testOut.png
python3 rePostProcess.py ./testOut.png "$@"

FEH_ZOOM=30
feh test.png --zoom $FEH_ZOOM & :
feh testOut.png --zoom $FEH_ZOOM & :
feh transient.png --zoom $FEH_ZOOM & :

