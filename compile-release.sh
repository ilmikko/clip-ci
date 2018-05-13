#!/usr/bin/env bash
# Compile a release zip version where you can just drag and drop the files and a json file

# Consistent directory
cd $(dirname $0);

# Get the directory that we want to compile
json=$1;
[ -z "$json" ] && echo "Please specify which json file you want to compile."  && exit 1;

dir=$(dirname "$json");
html="./html/index.template.html";

# Check that $html exists
[ ! -f "$html" ] && echo "Cannot find html template from $html" && exit 1;

# Check that $json exists
[ ! -f "$json" ] && echo "Cannot find json file from $json" && exit 1;

echo "Compiling $json...";

get_files_from() {
	file=$1;
	cat "$file" | grep -o "\"[./].*\"" | tr -d '"';
}

clone_release_dir() {
	echo "Creating directory structure...";
	mkdir -p release/js release/css release/font;

	# Copy some files over
	cp -rv font release;
}

compile_js() {
	cd js;
	echo "Compiling javascript...";
	bash ./compress.sh > ../release/js/app.min.js;
	cd ..;
}

compile_css() {
	cd css;
	echo "Compiling CSS...";
	node-sass --output-style compressed ./app.sass > ../release/css/app.min.css;
	cd ..
}

compile_json() {
	# Get the demo files we need from json
	files="$(get_files_from $json) $files";

	for file in $files; do
		# Make sure the file exists
		[ -a "$file" ] || continue;
		# Copy the file over
		dir="release/"$(dirname $file);
		mkdir -p "$dir";
		cp -rv "$file" "$dir";
	done

	# Clone the json

	cp -rv "$json" "$dir";
}

compile_html() {
	echo "Compiling HTML...";

	# Wrap the JSON in player.load()
	echo "player.load(" > ./temp.json;
	cat "$json" >> ./temp.json;
	echo ");" >> ./temp.json;

	# Include the json into the html
	sed -e '/player.load({})/rtemp.json' "$html" > temp.html;
	rm temp.json;

	# Wrap the script statement
	# Add the ./js/app.min.js we just compiled
	echo "<script src='./js/app.min.js'></script>" > append.html;

	# Remove other scripts and replace with contents of append.html
	sed -e "s/\\s*<script .*><\/script>\\s*//;/<!-- App scripts -->/rappend.html" "./temp.html" > temp2.html;
	rm append.html;
	rm temp.html;

	# Remove comments and copy over
	sed -e "s/\\s*<\!--.*-->\\s*//" "./temp2.html" | tr -s "\n" > release/index.html;
	rm temp2.html;
}

clone_release_dir;
compile_js;
compile_css;
compile_json;
compile_html;
