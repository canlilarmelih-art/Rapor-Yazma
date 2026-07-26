/* Builds a browser-safe, compact projection of the local Graphify export. */
const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const inputPath = path.join(appDir, "graphify-out", "graph.json");
const outputDir = path.join(appDir, "codebase-map");
const outputPath = path.join(outputDir, "graph-core.json");
const maximumNodes = 1600;

function isProjectNode(node) {
  const file = String(node?.source_file || "").replace(/\\/g, "/");
  if (!file) return false;
  return !/^(vendor|node_modules|backups|graphify-out|assets|icons|test-inputs)\//i.test(file)
    && !/\.min\.(js|mjs)$/i.test(file)
    && !/pdf\.(worker|local|fake)\.js/i.test(file);
}

function compactNode(node, degree) {
  return {
    id: String(node.id),
    label: String(node.label || node.id),
    sourceFile: String(node.source_file || ""),
    sourceLocation: String(node.source_location || ""),
    community: Number.isFinite(Number(node.community)) ? Number(node.community) : -1,
    communityName: String(node.community_name || node.source_file || "Proje"),
    fileType: String(node.file_type || "code"),
    degree,
  };
}

function main() {
  const graph = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const candidates = (Array.isArray(graph.nodes) ? graph.nodes : []).filter(isProjectNode);
  const candidateIds = new Set(candidates.map((node) => String(node.id)));
  const links = (Array.isArray(graph.links) ? graph.links : [])
    .filter((link) => candidateIds.has(String(link.source)) && candidateIds.has(String(link.target)));
  const degree = new Map(candidates.map((node) => [String(node.id), 0]));

  links.forEach((link) => {
    degree.set(String(link.source), (degree.get(String(link.source)) || 0) + 1);
    degree.set(String(link.target), (degree.get(String(link.target)) || 0) + 1);
  });

  const selected = candidates
    .slice()
    .sort((left, right) => {
      const difference = (degree.get(String(right.id)) || 0) - (degree.get(String(left.id)) || 0);
      return difference || String(left.label || left.id).localeCompare(String(right.label || right.id), "tr");
    })
    .slice(0, maximumNodes);
  const selectedIds = new Set(selected.map((node) => String(node.id)));
  const selectedLinks = links
    .filter((link) => selectedIds.has(String(link.source)) && selectedIds.has(String(link.target)))
    .map((link) => ({
      source: String(link.source),
      target: String(link.target),
      relation: String(link.relation || "bağlantı"),
      confidence: String(link.confidence || ""),
      weight: Number(link.weight) || 1,
    }));

  const payload = {
    generatedAt: new Date().toISOString(),
    builtAtCommit: String(graph.built_at_commit || ""),
    sourceNodeCount: Array.isArray(graph.nodes) ? graph.nodes.length : 0,
    sourceLinkCount: Array.isArray(graph.links) ? graph.links.length : 0,
    nodeLimit: maximumNodes,
    nodes: selected.map((node) => compactNode(node, degree.get(String(node.id)) || 0)),
    links: selectedLinks,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload)}\n`, "utf8");
  console.log(`Neural map data: ${payload.nodes.length} nodes, ${payload.links.length} links -> ${outputPath}`);
}

main();
