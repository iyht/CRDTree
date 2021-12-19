cd crdtree && yarn install && yarn build && yarn link || (echo "FAILED" && exit)

echo "Done with CRDTree installation"

cd ../network && yarn link crdtree && yarn install && yarn build && yarn link || (echo "FAILED" && exit)

echo "Done with Network installation"

cd ../eval && yarn link crdtree && yarn link network && yarn install || (echo "FAILED" && exit)

echo "Done with eval installation"

node bin/eval

mkdir ../out || echo "Tried to make an output directory. I hope that worked"
mv bin/*.log ../out
