#!/usr/bin/env bash
# Compile a release zip version where you can just drag and drop the files and a json file

cd js;
echo "Compiling javascript...";
bash ./compress.sh;
cd ..;

cd css;
echo "Compiling CSS...";
node-sass --output-style compressed ./app.sass > ./app.min.css;
cd ..

echo "Compiling HTML...";

printf "player.load(" > ./player.json;
cat demo/demo.json | tr -d ' \t\n\r\f' >> ./player.json;
printf ");\n" >> ./player.json;

echo > index.min.html;

# Include the json
sed -e '/player.load({})/rplayer.json' index.html | sed -e 's/\/\/.*$//' > index.min.html;

# Remove other scripts
cat index.min.html | sed -e 's/<script .*><\/script>//' | tee index.min.html;

# Add the ./js/app.min.js we just compiled
echo "<script src='./js/app.min.js'></script>" > append.html;

echo "basdbasbd";
html=$(sed -e '/<!-- App scripts -->/rappend.html' index.min.html);
echo $html > index.min.html;

# Remove comments and whitespace
# TODO: Remove comments
html=$(cat index.min.html | tr -d '\t\n\r\f');
echo $html > index.min.html;

# remove the temp files
rm index.min.html append.html player.json;
