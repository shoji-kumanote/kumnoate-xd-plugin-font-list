const scenegraph = require("scenegraph");
const clipboard = require("clipboard");
let panel;

function create() {
  const HTML = `
<style>
#result {
  width: 100%;
  margin: 0;
  height: 10em;
}
.buttons {
  display: flex;
}
button {
  margin-left: 0;
  margin-right: 0;
  flex-grow: 1;
}
button + button {
  margin-left: 1em;
}
</style>
<div class="buttons">
  <button id="get" type="button" uxp-variant="cta">Get font list</button>
</div>
<textarea id="result" readonly></textarea>
<div class="buttons">
  <button id="copyAsTsv" type="button" uxp-variant="cta" disabled>Copy as TSV</button>
  <button id="copyAsCsv" type="button" uxp-variant="cta" disabled>Copy as CSV</button>
</div>
        `;

  function compare(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return undefined;
  }

  function gatherFont(node, list) {
    if (node instanceof scenegraph.Text) {
      const key = [node.fontFamily, node.fontStyle, node.fontSize].join("\t");
      list[key] = (list[key] ?? 0) + 1;
    }
    if (!node.children) return;
    node.children.forEach((child) => {
      gatherFont(child, list);
    });
  }

  function getFontList() {
    const list = {};
    gatherFont(scenegraph.root, list);
    const result = Object.entries(list);
    result.sort((a, b) => {
      const [familyA, styleA, sizeA] = a[0].split("\t");
      const [familyB, styleB, sizeB] = b[0].split("\t");
      return compare(familyA, familyB) ?? compare(styleA, styleB) ?? compare(sizeA, sizeB) ?? 0;
    });
    document.querySelector("#result").value = result.map((x) => x.join("\t")).join("\n");
    document.querySelector("#copyAsCsv").disabled = document.querySelector("#result").value === "";
    document.querySelector("#copyAsTsv").disabled = document.querySelector("#result").value === "";
  }

  function copyToClipboard(data) {
    clipboard.copyText(data);
  }

  function copyResultAsCsv() {
    copyToClipboard(
      document
        .querySelector("#result")
        .value.split("\r")
        .map((x) =>
          x
            .split("\t")
            .map((y) => `"${y.replace(/\"/g, '""')}"`)
            .join(","),
        )
        .join("\n"),
    );
  }
  function copyResultAsTsv() {
    copyToClipboard(document.querySelector("#result").value);
  }

  panel = document.createElement("div");
  panel.innerHTML = HTML;
  panel.querySelector("#get")?.addEventListener("click", getFontList);
  panel.querySelector("#copyAsCsv")?.addEventListener("click", copyResultAsCsv);
  panel.querySelector("#copyAsTsv")?.addEventListener("click", copyResultAsTsv);

  return panel;
}

function show(event) {
  if (!panel) event.node.appendChild(create());
}

function update() {}

module.exports = {
  panels: {
    fontList: {
      show,
      update,
    },
  },
};
