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
          // Separate standard Mermaid keys (PK, FK, UK) from other constraints
          const keys: string[] = [];
          const otherConstraints: string[] = [];

          if (column.pk) keys.push('PK');
          if (foreignKeyMap.has(`${table.name}.${column.name}`)) keys.push('FK');
          if (column.unique) keys.push('UK');
          
          if (column.nullable === false) otherConstraints.push('NOT NULL');
          if (column.auto_increment) otherConstraints.push('AUTO_INC');
          
          // Mermaid Syntax: type name [PK,FK] "comment"
          // We must NOT quote the PK/FK part, and we must ONLY have one quoted string at the end.
          
          // 1. Type & Name
          // Replace spaces in type with underscores to prevent parsing errors
          let columnDef = `    ${column.type.replace(/\s+/g, '_')} ${column.name}`;
          
          // 2. Keys (PK, FK, UK) - Unquoted, comma-separated
          if (keys.length > 0) {
            columnDef += ` ${keys.join(',')}`;
          }

          // 3. Comment (Description + Other Constraints)
          let commentParts: string[] = [];
          
          // Add non-key constraints to the comment (e.g., "[NOT NULL]")
          if (otherConstraints.length > 0) {
            commentParts.push(`[${otherConstraints.join(', ')}]`);
          }
          
          // Add user description
          if (column.description) {
            // Escape double quotes and remove newlines
            const safeDesc = column.description.replace(/"/g, "'").replace(/\n/g, " ");
            commentParts.push(safeDesc);
          }

          // Append combined comment if exists
          if (commentParts.length > 0) {
            columnDef += ` "${commentParts.join(' ')}"`;
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