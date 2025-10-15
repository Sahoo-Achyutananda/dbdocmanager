// src/validator/validator.ts
import { Project, ValidationResult, ValidationError, ValidationWarning } from '../types/ast';

export class DBDocValidator {
  validate(ast: Project): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate targets
    errors.push(...this.validateTargets(ast));

    // Validate sources
    errors.push(...this.validateSources(ast));

    // Validate mappings (referential integrity)
    errors.push(...this.validateMappings(ast));

    // Warnings for best practices
    warnings.push(...this.checkBestPractices(ast));

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateTargets(ast: Project): ValidationError[] {
    const errors: ValidationError[] = [];

    if (ast.targets.length === 0) {
      errors.push({
        type: 'MISSING_TARGETS',
        message: 'No target databases defined'
      });
    }

    for (const target of ast.targets) {
      if (!target.db) {
        errors.push({
          type: 'INVALID_TARGET',
          message: 'Target missing database name'
        });
      }

      if (!target.engine) {
        errors.push({
          type: 'INVALID_TARGET',
          message: `Target '${target.db}' missing engine type`,
          location: target.db
        });
      }

      if (!target.tables || target.tables.length === 0) {
        errors.push({
          type: 'EMPTY_TARGET',
          message: `Target '${target.db}' has no tables defined`,
          location: target.db
        });
      }

      // Validate tables
      for (const table of target.tables || []) {
        if (!table.name) {
          errors.push({
            type: 'INVALID_TABLE',
            message: `Table in '${target.db}' missing name`
          });
        }

        if (!table.columns || table.columns.length === 0) {
          errors.push({
            type: 'EMPTY_TABLE',
            message: `Table '${table.name}' has no columns`,
            location: `${target.db}.${table.name}`
          });
        }

        // Check for duplicate column names
        const colNames = table.columns.map(c => c.name);
        const duplicates = colNames.filter((name, idx) => colNames.indexOf(name) !== idx);
        if (duplicates.length > 0) {
          errors.push({
            type: 'DUPLICATE_COLUMN',
            message: `Table '${table.name}' has duplicate columns: ${duplicates.join(', ')}`,
            location: `${target.db}.${table.name}`
          });
        }
      }
    }

    return errors;
  }

  private validateSources(ast: Project): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const source of ast.sources) {
      if (!source.id) {
        errors.push({
          type: 'INVALID_SOURCE',
          message: 'Source missing id'
        });
      }

      if (!source.kind) {
        errors.push({
          type: 'INVALID_SOURCE',
          message: `Source '${source.id}' missing kind`,
          location: source.id
        });
      }
    }

    return errors;
  }

  private validateMappings(ast: Project): ValidationError[] {
    const errors: ValidationError[] = [];

    // Build index of all targets and sources
    const targetIndex = this.buildTargetIndex(ast);
    const sourceIds = new Set(ast.sources.map(s => s.id));

    for (const mapping of ast.mappings) {
      // Validate target exists
      if (!targetIndex.has(mapping.target)) {
        errors.push({
          type: 'INVALID_MAPPING_TARGET',
          message: `Mapping target not found: ${mapping.target}`,
          location: mapping.target
        });
      }

      // Validate source exists
      if (!sourceIds.has(mapping.from.source_id)) {
        errors.push({
          type: 'INVALID_MAPPING_SOURCE',
          message: `Mapping source not found: ${mapping.from.source_id}`,
          location: mapping.target
        });
      }

      // Validate required fields
      if (!mapping.from.path) {
        errors.push({
          type: 'MISSING_MAPPING_PATH',
          message: `Mapping missing source path: ${mapping.target}`,
          location: mapping.target
        });
      }
    }

    return errors;
  }

  private checkBestPractices(ast: Project): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for missing descriptions
    for (const target of ast.targets) {
      for (const table of target.tables) {
        if (!table.description) {
          warnings.push({
            type: 'MISSING_DESCRIPTION',
            message: `Table '${table.name}' has no description`,
            location: `${target.db}.${table.name}`
          });
        }

        for (const column of table.columns) {
          if (!column.description) {
            warnings.push({
              type: 'MISSING_DESCRIPTION',
              message: `Column '${column.name}' has no description`,
              location: `${target.db}.${table.name}.${column.name}`
            });
          }
        }
      }
    }

    // Check for unmapped columns
    const mappedTargets = new Set(ast.mappings.map(m => m.target));
    for (const target of ast.targets) {
      for (const table of target.tables) {
        for (const column of table.columns) {
          const fqn = `${target.db}.${target.schema || 'public'}.${table.name}.${column.name}`;
          if (!mappedTargets.has(fqn)) {
            warnings.push({
              type: 'UNMAPPED_COLUMN',
              message: `Column has no mapping defined`,
              location: fqn
            });
          }
        }
      }
    }

    return warnings;
  }

  private buildTargetIndex(ast: Project): Set<string> {
    const index = new Set<string>();

    for (const target of ast.targets) {
      for (const table of target.tables) {
        for (const column of table.columns) {
          const fqn = `${target.db}.${target.schema || 'public'}.${table.name}.${column.name}`;
          index.add(fqn);
        }
      }
    }

    return index;
  }
}
