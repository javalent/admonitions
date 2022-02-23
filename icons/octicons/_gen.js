const { writeFile } = require("fs");

const octicons = require("@primer/octicons");

const data = Object.fromEntries(
    Object.entries(octicons).map(([icon, definition]) => {
        return [icon, definition.toSVG()];
    })
);

writeFile(`./icons/octicons/icons.json`, JSON.stringify(data), (err) => {
    if (err) console.error(err);
});
