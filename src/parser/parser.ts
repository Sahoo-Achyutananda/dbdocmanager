// src/parser/parser.ts
import * as fs from 'fs';
import * as path from 'path';
import { Project, Target, Table, Column, Source, Mapping } from '../types/ast';

export class DBDocParser {
  /**
   * Parse a JSON DSL file into AST
   */
  parse(filePath: string): Project {
    try {
      // Read file
      const absolutePath = path.resolve(filePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = fs.readFileSync(absolutePath, 'utf-8');

      // Parse JSON
      let data: any;
      try {
        data = JSON.parse(content);
      } catch (e: any) {  // ← Add type to catch variable
        throw new Error(`Invalid JSON: ${e.message}`);
      }

      // Basic structure validation
      if (!data.project) {
        throw new Error('Missing required field: project');
      }

      if (!data.targets || !Array.isArray(data.targets)) {
        throw new Error('Missing or invalid field: targets (must be array)');
      }

      // Transform to AST
      const ast: Project = {
        project: data.project,
        version: data.version || '1.0.0',
        owners: data.owners || [],
        description: data.description || '',
        targets: this.parseTargets(data.targets || []),
        sources: this.parseSources(data.sources || []),
        mappings: this.parseMappings(data.mappings || [])
      };

      return ast;
    } catch (error: any) {  // ← Add type to catch variable
      throw new Error(`Failed to parse DSL file: ${error.message}`);
    }
  }

  private parseTargets(targets: any[]): Target[] {  // ← Change return type from any[] to Target[]
    return targets.map((target: any): Target => ({ 
      db: target.db,
      engine: target.engine,
      schema: target.schema,
      tables: (target.tables || []).map((table: any): Table => ({
        name: table.name,
        description: table.description,
        columns: (table.columns || []).map((col: any): Column => ({  
          name: col.name,
          type: col.type,
          nullable: col.nullable !== false,
          default: col.default,
          description: col.description,
          pk: col.pk || false,
          unique: col.unique || false,
          auto_increment: col.auto_increment || false
        })),
        primary_key: table.primary_key,
        foreign_keys: table.foreign_keys,
        indexes: table.indexes
      }))
    }));
  }

  private parseSources(sources: any[]): Source[] {  
    return sources.map((source: any): Source => ({  
      id: source.id,
      kind: source.kind,
      connection: source.connection,
      db: source.db,
      collection: source.collection,
      description: source.description
    }));
  }

  private parseMappings(mappings: any[]): Mapping[] {
    return mappings.map((mapping: any): Mapping => {
      const isArrayExplosion = mapping.target.endsWith('.*');
      
      return {
        target: mapping.target,
        from: {
          source_id: mapping.from?.source_id,
          path: mapping.from?.path,
          transform: mapping.from?.transform,
          is_array_explosion: isArrayExplosion || mapping.from?.is_array_explosion || false,
          fields: mapping.from?.fields || undefined
        },
        description: mapping.description
      };
    });
  }
}