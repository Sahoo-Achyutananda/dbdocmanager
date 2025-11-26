import { Project } from '../types/ast';

export class ERGenerator {
  /**
   * Ported directly from your jsontommd.js
   */
  generateMermaidCode(ast: Project): string {
    let mermaidCode = 'erDiagram\n\n';
    const foreignKeyMap = new Map<string, string>();

    // 1. Map Foreign Keys
    ast.targets.forEach(target => {
      target.tables.forEach(table => {
        if (table.foreign_keys) {
          table.foreign_keys.forEach(fk => {
            fk.columns.forEach(col => {
              const key = `${table.name}.${col}`;
              foreignKeyMap.set(key, fk.references.table);
            });
          });
        }
      });
    });

    // 2. Generate Table Definitions
    ast.targets.forEach(target => {
      target.tables.forEach(table => {
        if (table.description) {
          mermaidCode += `  %% ${table.description}\n`;
        }
        mermaidCode += `  ${table.name} {\n`;
        
        table.columns.forEach(column => {
          const constraints: string[] = [];
          if (column.pk) constraints.push('PK');
          // Check our map for FKs
          if (foreignKeyMap.has(`${table.name}.${column.name}`)) constraints.push('FK');
          if (column.unique) constraints.push('UK');
          if (column.nullable === false) constraints.push('NOT NULL');
          if (column.auto_increment) constraints.push('AUTO_INCREMENT');
          
          const constraintStr = constraints.length > 0 ? `"${constraints.join(', ')}"` : '';
          
          let columnDef = `    ${column.type} ${column.name}`;
          if (constraintStr) {
            columnDef += ` ${constraintStr}`;
          }
          if (column.description) {
            // Clean description of quotes to prevent mermaid errors
            const safeDesc = column.description.replace(/"/g, "'");
            columnDef += ` "${safeDesc}"`;
          }
          mermaidCode += columnDef + '\n';
        });
        mermaidCode += '  }\n\n';
      });
    });

    // 3. Generate Relationships
    ast.targets.forEach(target => {
      target.tables.forEach(table => {
        if (table.foreign_keys) {
          table.foreign_keys.forEach(fk => {
            const refTable = fk.references.table;
            const relationship = fk.name || 'references';
            mermaidCode += `  ${refTable} ||--o{ ${table.name} : "${relationship}"\n`;
          });
        }
      });
    });

    return mermaidCode;
  }
}