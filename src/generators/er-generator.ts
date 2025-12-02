import { Project } from '../types/ast';

export class ERGenerator {
  /**
   * Generates strict Mermaid ER Diagram syntax
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
          // Remove newlines from description for comment
          const safeTableDesc = table.description.replace(/\n/g, ' ');
          mermaidCode += `  %% ${safeTableDesc}\n`;
        }

        mermaidCode += `  ${table.name} {\n`;

        table.columns.forEach(column => {
          // Collect all attributes (keys and constraints)
          const attributes: string[] = [];

          if (column.pk) attributes.push('PK');
          if (foreignKeyMap.has(`${table.name}.${column.name}`)) attributes.push('FK');
          if (column.unique) attributes.push('UK');
          if (column.nullable === false) attributes.push('NOT NULL');
          if (column.auto_increment) attributes.push('AUTO_INC');

          // Mermaid Syntax: type name "PK,FK,NOT NULL" "comment"
          // 1. Type & Name
          // Replace spaces in type with underscores to prevent parsing errors
          let columnDef = `    ${column.type.replace(/\s+/g, '_')} ${column.name}`;

          // 2. All attributes together (quoted and comma-separated)
          // Always add quotes, even if empty
          if (attributes.length > 0) {
            columnDef += ` "${attributes.join(', ')}"`;
          } else {
            columnDef += ` ""`;
          }

          // 3. Description (in separate quotes)
          if (column.description) {
            // Escape double quotes and remove newlines
            const safeDesc = column.description.replace(/"/g, "'").replace(/\n/g, " ");
            columnDef += ` "${safeDesc}"`;
          } else {
            columnDef += ` ""`;
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
            // Sanitizing relationship label
            const relationship = (fk.name || 'references').replace(/"/g, "'");
            mermaidCode += `  ${refTable} ||--o{ ${table.name} : "${relationship}"\n`;
          });
        }
      });
    });

    return mermaidCode;
  }
}