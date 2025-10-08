**Project:** DBDocManager — DSL-driven Documentation & Lineage for Relationalized Data Models

**Context:**
Teams maintain data in both **relational databases** (e.g., Postgres, MySQL, Snowflake) and **NoSQL sources** (e.g., MongoDB) that are later **converted/flattened into relational tables** for analytics. It’s hard to keep a single source of truth for: table/column definitions, keys/constraints, **source→target mappings** (e.g., “`dim_user.address_street` comes from `mongo.users.address.street`”), and visualizations (ERDs, lineage).
**DBDocManager** provides a lightweight **DSL** to describe schemas and mappings, then generates human-readable docs, ER diagrams, and lineage views.

---

**Input (via DSL):**
Users describe:

* **Targets (Relational):** databases/schemas, tables, columns, PK/FK, indexes, constraints.
* **Sources (Relational or NoSQL):** e.g., Mongo collections with JSONPath-like pointers.
* **Mappings:** column-level source→target lineage (with optional transforms, defaults).
* **Metadata:** owners, SLAs, tags, business definitions.

> The DSL can be plain-text files (`.dbdoc`) or YAML/TOML; repo-friendly, CI/CD-friendly.

**Minimal DSL Example (YAML-style):**

```yaml
project: retail_dw
owners: [ "data-eng@company.com" ]
targets:
  - db: dw
    engine: postgres
    schema: mart
    tables:
      - name: dim_user
        description: Master user dimension
        columns:
          - { name: user_id, type: INTEGER, pk: true, description: Surrogate key }
          - { name: email, type: VARCHAR(320), unique: true, not_null: true }
          - { name: address_street, type: VARCHAR(256) }
          - { name: created_at, type: TIMESTAMP, default: now() }
sources:
  - id: mongo_users
    kind: mongodb
    conn: atlas-cluster-A
    db: shop
    collection: users
mappings:
  - target: dw.mart.dim_user.email
    from:
      source_id: mongo_users
      path: $.contact.email              # JSONPath
      transform: lower()                 # optional
  - target: dw.mart.dim_user.address_street
    from:
      source_id: mongo_users
      path: $.address.street
  - target: dw.mart.dim_user.user_id
    from:
      rule: sequence('dim_user_seq')     # generated surrogate key
notes:
  - "PII: email; mask in non-prod exports"
```

**Array/Explode Example (orders → fact lines):**

```yaml
targets:
  - db: dw
    engine: snowflake
    schema: mart
    tables:
      - name: fct_order_line
        columns:
          - { name: order_id, type: STRING, not_null: true }
          - { name: line_nbr, type: INT, not_null: true }
          - { name: sku, type: STRING }
          - { name: qty, type: NUMBER(38,0) }
sources:
  - id: mongo_orders
    kind: mongodb
    db: shop
    collection: orders
mappings:
  - target: dw.mart.fct_order_line.*
    from:
      source_id: mongo_orders
      path: $.lines[*]                   # explode array
      fields:
        order_id: $.order_id
        line_nbr: $index                 # implicit array index
        sku: $.sku
        qty: $.quantity
```

---

**Output:**

* **HTML site** with searchable docs: tables, columns, data types, constraints, owners.
* **ERD** (Mermaid/Graph rendering) for schemas and FK relationships.
* **Lineage graph** (source→target) at table and column level.
* **Mapping Matrix** (CSV/HTML): one row per target column with source path/transform.
* **Validation report**: missing mappings, orphan sources, type mismatches, undocumented columns.

---

**Technology Stack:**

* **Frontend:** HTML, CSS, JavaScript (optionally React) for docs viewer, ERD & lineage canvases.
* **Visualization:** Mermaid.js (ERD), Cytoscape.js/D3 (lineage graph).
* **Backend/CLI:** Node.js (Express for web app, CLI for parse→validate→generate).
* **Parser:** DSL compiler in TypeScript (YAML/TOML/plain parser → normalized AST).
* **Connectors (optional):** schema introspection for Postgres/MySQL/Snowflake; Mongo sampling to suggest paths.
* **Storage:** Flat files in Git (preferred). Optionally Mongo/Postgres if hosting edits.

---

**Chronology of Tasks:**

1. **Define DSL MVP:** targets, sources, mappings, minimal metadata. Provide schema (JSON Schema) and examples.
2. **Build Parser & Validator:** parse files to AST; validate referential integrity (targets exist, paths valid, PK/FK complete).
3. **Generators:**

   * Docs generator → static site (tables/columns pages).
   * ERD generator → Mermaid diagrams per schema.
   * Lineage generator → table/column lineage graph.
   * Mapping Matrix export → CSV/HTML.
4. **Introspection Utilities (optional):** import actual DB schemas; suggest DSL stubs.
5. **CI Integration:** command `dbdoc validate` fails build on drift/missing docs.
6. **Web UI (optional):** DSL editor with linting, preview of ERD/lineage, and diff view.
7. **Extensions:** transforms library (e.g., `lower()`, `concat()`, `parseDate()`), masking policies, tags.

---

**Stakeholders:**

* **Data Engineers:** author DSL, maintain mappings, generate docs & graphs.
* **Analytics/BI Engineers:** consult mapping matrix and lineage for pipeline builds.
* **Governance/Stewards:** ensure columns have definitions/owners; track PII flags.
* **Developers/QA:** validate schema changes in CI to prevent undocumented drift.

---

**Team Size:** 5

---
**Point of Contact:** Sai Anirudh Karre (saianirudh.karre@iiit.ac.in)
