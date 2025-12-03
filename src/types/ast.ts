// src/types/ast.ts

/**
 * Root project structure
 */
export interface Project {
  project: string;
  version?: string;
  owners?: string[];
  description?: string;
  targets: Target[];
  sources: Source[];
  mappings: Mapping[];
}

/**
 * Target database (where data ends up)
 */
export interface Target {
  db: string;
  engine: 'postgres' | 'mysql' | 'snowflake' | 'bigquery';
  schema?: string;
  tables: Table[];
}

/**
 * Table definition
 */
export interface Table {
  name: string;
  description?: string;
  columns: Column[];
  primary_key?: string[];
  foreign_keys?: ForeignKey[];
  indexes?: Index[];
}

/**
 * Column definition
 */
export interface Column {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  description?: string;
  pk?: boolean;
  unique?: boolean;
  auto_increment?: boolean;
}

/**
 * Foreign key constraint
 */
export interface ForeignKey {
  name: string;
  columns: string[];
  references: {
    table: string;
    columns: string[];
  };
  on_delete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  on_update?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

/**
 * Index definition
 */
export interface Index {
  name: string;
  columns: string[];
  unique?: boolean;
  type?: 'BTREE' | 'HASH';
}

/**
 * Source system (where data comes from)
 */
export interface Source {
  id: string;
  kind: 'mongodb' | 'postgres' | 'mysql' | 'api' | 'csv';
  connection?: string;
  db?: string;
  collection?: string;
  description?: string;
}

/**
 * Column-level mapping (lineage)
 */
export interface Mapping {
  target: string; 
  from: {
    source_id: string;
    path: string;
    transform?: string;
    is_array_explosion?: boolean;
    fields?: { [key: string]: string };
  };
  description?: string;
}


/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: string;
  message: string;
  location?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
  location?: string;
}