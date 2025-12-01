// src/generators/lineage-generator.ts
import * as fs from 'fs';
import * as path from 'path';
import { Project, Mapping, Source } from '../types/ast'; // Import your types

// This is the format Cytoscape.js (our frontend) understands
interface GraphElement {
  data: {
    id: string;
    label: string;
    type: 'source' | 'target';
    kind?: string;
  };
}

interface GraphEdge {
  data: {
    id: string;
    source: string; // ID of the source node
    target: string; // ID of the target node
  };
}

export function generateLineage(ast: Project, outputDir: string) {
  console.log('Generating lineage graph data...');

  // Use Maps to store unique nodes and edges
  const nodes = new Map<string, GraphElement>();
  const edges = new Map<string, GraphEdge>();

  // 1. Create a quick lookup map for our sources
  const sourceMap = new Map<string, Source>(
    ast.sources.map((s) => [s.id, s])
  );

  // 2. Process all mappings to find nodes and edges
  for (const mapping of ast.mappings) {
    try {
      // --- Get Target Node ---
      // mapping.target is "db.schema.table.column"
      const targetParts = mapping.target.split('.');
      if (targetParts.length < 4) {
        console.warn(`Skipping invalid target: ${mapping.target}`);
        continue;
      }
      // We want the table FQN: "db.schema.table"
      const targetTableId = targetParts.slice(0, 3).join('.');
      const targetTableLabel = targetParts[2]; // "table"

      // --- Get Source Node ---
      const sourceId = mapping.from.source_id; // e.g., "mongo_users"
      const sourceObj = sourceMap.get(sourceId);
      if (!sourceObj) {
        console.warn(`Skipping mapping with unknown source_id: ${sourceId}`);
        continue;
      }
      // Use the collection name (e.g., "users") or the ID (e.g., "mongo_users") as the label
      const sourceLabel = sourceObj.collection || sourceObj.id;
      const sourceKind = sourceObj.kind; // e.g., "mongodb"

      // --- Add Nodes (if they don't exist) ---
      if (!nodes.has(targetTableId)) {
        nodes.set(targetTableId, {
          data: { id: targetTableId, label: targetTableLabel, type: 'target' },
        });
      }
      if (!nodes.has(sourceId)) {
        nodes.set(sourceId, {
          data: {
            id: sourceId,
            label: sourceLabel,
            type: 'source',
            kind: sourceKind,
          },
        });
      }

      // --- Add Edge (if it doesn't exist) ---
      const edgeId = `${sourceId}_to_${targetTableId}`;
      if (!edges.has(edgeId)) {
        edges.set(edgeId, {
          data: { id: edgeId, source: sourceId, target: targetTableId },
        });
      }
    } catch (e) {
      console.error(`Error processing mapping for ${mapping.target}:`, e);
    }
  }

  // 3. Prepare the final JSON output
  const graphData = {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };

  // 4. Write the file
  const outputPath = path.join(outputDir, 'lineage-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(graphData, null, 2));

  console.log(`Lineage data generated at ${outputPath}`);
}