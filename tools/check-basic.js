const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function checkFileExists(relativePath) {
  assert(fs.existsSync(path.join(root, relativePath)), `${relativePath} bulunamadi.`);
}

function runNodeSyntaxCheck(relativePath) {
  execFileSync(process.execPath, ["--check", path.join(root, relativePath)], {
    cwd: root,
    stdio: "pipe"
  });
}

function main() {
  ["index.html", "app.js", "styles.css", "server.js"].forEach(checkFileExists);

  runNodeSyntaxCheck("app.js");
  runNodeSyntaxCheck("server.js");

  const indexHtml = readText("index.html");
  assert(indexHtml.includes("installCompatibilityFixes"), "index.html uyumluluk blogu bulunamadi.");
  assert(
    indexHtml.includes("ReadableStream.prototype[Symbol.asyncIterator]"),
    "iOS PDF icin ReadableStream async iterator duzeltmesi bulunamadi."
  );
  assert(indexHtml.includes("Promise.try"), "pdf.js icin Promise.try guvencesi bulunamadi.");
  assert(indexHtml.includes("Uint8Array.fromBase64"), "pdf.js icin Uint8Array.fromBase64 guvencesi bulunamadi.");

  console.log("Temel kontrol tamam: dosyalar, JavaScript sozdizimi ve iOS PDF uyumluluk blogu saglam.");
}

main();

