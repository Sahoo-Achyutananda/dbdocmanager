# DBDocManager

A lightweight database documentation and lineage tool using a JSON-based DSL.

## Features

✅ **Schema Documentation** - Document tables, columns, types, constraints  
✅ **Data Lineage** - Track source → target mappings at column level  
✅ **NoSQL Support** - Document MongoDB → Relational transformations  
✅ **HTML Generation** - Beautiful, searchable static documentation  
✅ **CLI Tool** - Validate and generate docs from command line  
✅ **Git-Friendly** - Version control your data documentation

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd dbdoc-manager

# Install dependencies
npm install

# Build the project
npm run build

# (Optional) Install globally
npm link
```

## Quick Start

### 1. Create a DSL file

Create `my-schema.json`:

```json
{
  "project": "my_project",
  "description": "My database documentation",
  "targets": [
    {
      "db": "warehouse",
      "engine": "postgres",
      "tables": [
        {
          "name": "users",
          "description": "User accounts",
          "columns": [
            {
              "name": "id",
              "type": "INTEGER",
              "pk": true,
              "description": "Primary key"
            },
            {
              "name": "email",
              "type": "VARCHAR(255)",
              "unique": true,
              "nullable": false
            }
          ]
        }
      ]
    }
  ],
  "sources": [
    {
      "id": "app_db",
      "kind": "postgres",
      "db": "production"
    }
  ],
  "mappings": [
    {
      "target": "warehouse.public.users.email",
      "from": {
        "source_id": "app_db",
        "path": "users.email_address",
        "transform": "LOWER()"
      }
    }
  ]
}
```

### 2. Validate your DSL

```bash
npm run dev validate my-schema.json
```

Output:
```
🔍 Validating DSL file...
✓ Successfully parsed DSL file
  Project: my_project
  Targets: 1
  Sources: 1
  Mappings: 1

✓ Validation passed!
```

### 3. Generate Documentation

```bash
npm run dev generate my-schema.json -o ./docs
```

Output:
```
📚 Generating documentation...
✓ Parsed DSL file
✓ Validation passed
✓ Generated documentation in ./docs

Open ./docs/index.html in your browser to view.
```

### 4. View Documentation

Open `./docs/index.html` in your browser!

## CLI Commands

### `dbdoc validate <file>`

Validate a DSL file for errors and warnings.

```bash
dbdoc validate schema.json
```

### `dbdoc generate <file> [options]`

Generate HTML documentation.

```bash
dbdoc generate schema.json -o ./output
```

Options:
- `-o, --output <dir>` - Output directory (default: `./docs`)

### `dbdoc info <file>`

Display summary information about a DSL file.

```bash
dbdoc info schema.json
```

## DSL Reference

### Project Structure

```json
{
  "project": "string (required)",
  "version": "string (optional)",
  "description": "string (optional)",
  "owners": ["array of strings (optional)"],
  "targets": [],
  "sources": [],
  "mappings": []
}
```

### Targets (Databases)

```json
{
  "db": "database_name",
  "engine": "postgres|mysql|snowflake|bigquery",
  "schema": "schema_name (optional)",
  "tables": [...]
}
```

### Tables

```json
{
  "name": "table_name",
  "description": "Table description",
  "columns": [...],
  "primary_key": ["column1", "column2"],
  "foreign_keys": [...],
  "indexes": [...]
}
```

### Columns

```json
{
  "name": "column_name",
  "type": "VARCHAR(255)",
  "nullable": false,
  "default": "default_value",
  "description": "Column description",
  "pk": false,
  "unique": false,
  "auto_increment": false
}
```

### Sources

```json
{
  "id": "unique_source_id",
  "kind": "mongodb|postgres|mysql|api|csv",
  "connection": "connection_string",
  "db": "database_name",
  "collection": "collection_name (for MongoDB)",
  "description": "Source description"
}
```

### Mappings (Lineage)

```json
{
  "target": "db.schema.table.column",
  "from": {
    "source_id": "source_id",
    "path": "$.path.to.field",
    "transform": "LOWER()"
  },
  "description": "Mapping description"
}
```

## Example: E-commerce Project

See `examples/sample-schema.json` for a complete example.

```bash
# Test with example
npm run test
```

## Project Structure

```
dbdoc-manager/
├── src/
│   ├── types/
│   │   └── ast.ts           # TypeScript interfaces
│   ├── parser/
│   │   └── parser.ts        # JSON parser
│   ├── validator/
│   │   └── validator.ts     # Validation logic
│   ├── generators/
│   │   └── html-generator.ts # HTML documentation generator
│   └── cli.ts               # Command-line interface
├── examples/
│   └── sample-schema.json   # Example DSL file
├── dist/                    # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Run in development mode
npm run dev validate examples/sample-schema.json
npm run dev generate examples/sample-schema.json

# Build for production
npm run build

# Run built version
node dist/cli.js validate examples/sample-schema.json
```

## Features Roadmap

### ✅ MVP (Current)
- [x] JSON DSL parsing
- [x] Schema validation
- [x] HTML documentation generation
- [x] Column-level lineage tracking
- [x] CLI interface

### 🚧 Phase 2
- [ ] ERD diagram generation (Mermaid)
- [ ] Interactive lineage graph (Cytoscape)
- [ ] Array explosion documentation
- [ ] Database introspection tool

### 🔮 Phase 3
- [ ] Web-based DSL editor - maybe
- [ ] Real-time validation -maybe
- [ ] Markdown export -maybe
- [ ] CI/CD integration examples -maybe
- [ ] Transform library -maybe
