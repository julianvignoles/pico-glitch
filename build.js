// Builds index.html from src/ as ONE self-contained file (no internet needed).
// Run: node build.js
const fs = require("fs"), path = require("path");
const src = f => fs.readFileSync(path.join(__dirname, "src", f), "utf8");
const parts = ["words.js","trivia.js","links.js","pixel.js","core.js","uplink.js","splice.js","wordle.js","connections.js"];
const scripts = parts.map(f => "<script>/* " + f + " */\n" + src(f) + "\n</script>").join("\n") + "\n<script>A.boot();</script>";
const html = src("shell.html").replace("<!--SCRIPTS-->", () => scripts);
fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("index.html", (html.length/1024).toFixed(0) + " KB");
