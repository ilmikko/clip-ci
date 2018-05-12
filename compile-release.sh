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

echo > index.html;

# Include the json
sed -e '/player.load({})/rplayer.json' html/index.template.html | sed -e 's/\/\/.*$//' > index.html;

# Remove other scripts
cat index.html | sed -e 's/<script .*><\/script>//' | tee index.html;

# Add the ./js/app.min.js we just compiled
echo "<script src='./js/app.min.js'></script>" > append.html;

echo "basdbasbd";
html=$(sed -e '/<!-- App scripts -->/rappend.html' index.html);
echo $html > index.html;

# Remove comments and whitespace
# TODO: Remove comments
html=$(cat index.html | tr -d '\t\n\r\f');
echo $html > index.html;

# remove the temp files
rm append.html player.json;
