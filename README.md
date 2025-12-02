# DBDocManager

> A lightweight database documentation and lineage tool using a JSON-based DSL  
> **College Project** - Software Systems Development Course

A command-line tool that helps document relational databases and track data lineage from NoSQL sources to relational tables. Generate beautiful HTML documentation with column-level mappings and transformation tracking.

## Features

✅ **Schema Documentation** - Document tables, columns, types, and constraints  
✅ **Data Lineage** - Track source → target mappings at column level  
✅ **NoSQL Support** - Document MongoDB → Relational transformations  
✅ **HTML Generation** - Beautiful, searchable static documentation with interactive graphs  
✅ **Transform Tracking** - Visualize data transformations in lineage graphs  
✅ **CLI Tool** - Validate and generate docs from anywhere

## Installation

### Global Installation (Recommended)

Install globally to use the `dbdoc` command from anywhere:

```bash
npm install -g dbdocmanager_ssd
```

**Note:** The package name is `dbdocmanager_ssd` (not `dbdoc`, which is a different package).

### Verify Installation

```bash
dbdoc --version
```

## Quick Start

### 1. Create a DSL File

Create a file named `my-database.json`:

```json
{
  "project": "my_project",
  "description": "My database documentation",
  "targets": [
    {
      "db": "warehouse",
      "engine": "postgres",
      "schema": "public",
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
              "nullable": false,
              "description": "User email address"
            }
          ]
        }
      ]
    }
  ],
  "sources": [
    {
      "id": "app_db",
      "kind": "mongodb",
      "db": "production",
      "collection": "users"
    }
  ],
  "mappings": [
    {
      "target": "warehouse.public.users.email",
      "from": {
        "source_id": "app_db",
        "path": "contact.email",
        "transform": "LOWER(TRIM())"
      }
    }
  ]
}
```

### 2. Validate Your Schema

```bash
dbdoc validate my-database.json
```

### 3. Generate Documentation

```bash
dbdoc generate my-database.json -o ./docs
```

### 4. View Documentation

Open `./docs/index.html` in your browser to view:
- Project overview with all tables
- Individual table pages with columns and constraints
- Data lineage table view
- **Interactive lineage graph** with transform labels

## CLI Commands

### `dbdoc validate <file>`

Validates your DSL file for errors and warnings.

```bash
dbdoc validate schema.json
```

### `dbdoc generate <file> [options]`

Generates HTML documentation from your DSL file.

```bash
dbdoc generate schema.json -o ./output
```

**Options:**
- `-o, --output <dir>` - Output directory (default: `./docs`)

### `dbdoc info <file>`

Displays summary information about your DSL file.

```bash
dbdoc info schema.json
```

## DSL Schema Reference

### Basic Structure

```json
{
  "project": "string (required)",
  "version": "string (optional)",
  "description": "string (optional)",
  "owners": ["email@example.com"],
  "targets": [],
  "sources": [],
  "mappings": []
}
```

### Column Definition

```json
{
  "name": "column_name",
  "type": "VARCHAR(255)",
  "nullable": false,
  "default": "default_value",
  "description": "Description",
  "pk": false,
  "unique": false,
  "auto_increment": false
}
```

### Source Definition

```json
{
  "id": "unique_id",
  "kind": "mongodb|postgres|mysql|api",
  "db": "database_name",
  "collection": "collection_name"
}
```

### Mapping (Lineage)

```json
{
  "target": "db.schema.table.column",
  "from": {
    "source_id": "source_id",
    "path": "field.path",
    "transform": "LOWER()"
  },
  "description": "Optional description"
}
```

## Example Output

The tool generates:

1. **Index Page** - Overview of all databases and tables
2. **Table Pages** - Detailed column information with data lineage
3. **Lineage Table** - All source-to-target mappings
4. **Lineage Graph** - Interactive visualization with:
   - Source and target nodes grouped by table/collection
   - Column-level connections
   - Transform labels on edges
   - Hover tooltips showing full qualified names

## Project Information

**Course:** Software Systems Development  
**Team Size:** 5 members  
**Package:** dbdocmanager_ssd  
**Point of Contact:** 
Team Members :
- Achyutananda Sahoo
- Satyajit Priyadarshi
- Abhijith Sangarsu
- Swaraj Kumar
- Ameya Purohit
Guide : Sai Anirudh Karre

## License

This is a college project created for educational purposes.

## Troubleshooting

**Command not found after installation:**
```bash
# Try installing with sudo (Linux/Mac)
sudo npm install -g dbdocmanager_ssd

# Or check your npm global bin path
npm config get prefix
```

**Permission errors on Linux/Mac:**
```bash
# Fix npm permissions
sudo chown -R $USER /usr/local/lib/node_modules
```