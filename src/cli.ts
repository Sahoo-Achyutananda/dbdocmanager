// src/cli.ts
// #!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
const { exit } = require('node:process');
import { DBDocParser } from './parser/parser';
import { DBDocValidator } from './validator/validator';
import { HTMLGenerator } from './generators/html-generator';

const program = new Command();

program
  .name('dbdoc')
  .description('Database documentation and lineage tool')
  .version('1.0.0');

// Validate command
program
  .command('validate')
  .description('Validate a DSL file')
  .argument('<file>', 'JSON DSL file to validate')
  .action((file: string) => {
    try {
      console.log(chalk.blue('🔍 Validating DSL file...'));
      
      const parser = new DBDocParser();
      const ast = parser.parse(file);
      
      console.log(chalk.green('✓ Successfully parsed DSL file'));
      console.log(chalk.gray(`  Project: ${ast.project}`));
      console.log(chalk.gray(`  Targets: ${ast.targets.length}`));
      console.log(chalk.gray(`  Sources: ${ast.sources.length}`));
      console.log(chalk.gray(`  Mappings: ${ast.mappings.length}`));
      
      const validator = new DBDocValidator();
      const result = validator.validate(ast);
      
      if (result.errors.length > 0) {
        console.log(chalk.red(`\n❌ Found ${result.errors.length} error(s):\n`));
        result.errors.forEach(err => {
          console.log(chalk.red(`  • ${err.type}: ${err.message}`));
          if (err.location) {
            console.log(chalk.gray(`    Location: ${err.location}`));
          }
        });
      }
      
      if (result.warnings.length > 0) {
        console.log(chalk.yellow(`\n⚠️  Found ${result.warnings.length} warning(s):\n`));
        result.warnings.forEach(warn => {
          console.log(chalk.yellow(`  • ${warn.type}: ${warn.message}`));
          if (warn.location) {
            console.log(chalk.gray(`    Location: ${warn.location}`));
          }
        });
      }
      
      if (result.valid) {
        console.log(chalk.green('\n✓ Validation passed!'));
        process.exit(0);
      } else {
        console.log(chalk.red('\n✗ Validation failed!'));
        process.exit(1);
      }
      
    } catch (error: any) {
      console.error(chalk.red('✗ Error:'), error.message);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate')
  .description('Generate HTML documentation')
  .argument('<file>', 'JSON DSL file')
  .option('-o, --output <dir>', 'Output directory', './docs')
  .action((file: string, options: { output: string }) => {
    try {
      console.log(chalk.blue('📚 Generating documentation...'));
      
      const parser = new DBDocParser();
      const ast = parser.parse(file);
      
      console.log(chalk.green('✓ Parsed DSL file'));
      
      const validator = new DBDocValidator();
      const result = validator.validate(ast);
      
      if (!result.valid) {
        console.log(chalk.red(`\n❌ Validation failed with ${result.errors.length} error(s)`));
        result.errors.forEach(err => {
          console.log(chalk.red(`  • ${err.message}`));
        });
        console.log(chalk.yellow('\nFix errors before generating documentation.'));
        process.exit(1);
      }
      
      console.log(chalk.green('✓ Validation passed'));
      
      const generator = new HTMLGenerator();
      generator.generate(ast, options.output);
      
      console.log(chalk.green(`\n✓ Documentation generated successfully!`));
      console.log(chalk.gray(`  Output: ${options.output}`));
      console.log(chalk.cyan(`\nOpen ${options.output}/index.html in your browser to view.`));
      
    } catch (error: any) {
      console.error(chalk.red('✗ Error:'), error.message);
      process.exit(1);
    }
  });

// Info command - shows AST structure
program
  .command('info')
  .description('Show information about a DSL file')
  .argument('<file>', 'JSON DSL file')
  .action((file: string) => {
    try {
      const parser = new DBDocParser();
      const ast = parser.parse(file);
      
      console.log(chalk.blue('\n📊 Project Information\n'));
      console.log(chalk.white(`Name: ${chalk.bold(ast.project)}`));
      console.log(chalk.white(`Version: ${ast.version}`));
      if (ast.description) {
        console.log(chalk.white(`Description: ${ast.description}`));
      }
      if (ast.owners && ast.owners.length > 0) {
        console.log(chalk.white(`Owners: ${ast.owners.join(', ')}`));
      }
      
      console.log(chalk.blue('\n🗄️  Target Databases\n'));
      ast.targets.forEach(target => {
        console.log(chalk.green(`  ${target.db} (${target.engine})`));
        const totalColumns = target.tables.reduce((sum, t) => sum + t.columns.length, 0);
        console.log(chalk.gray(`    Tables: ${target.tables.length}`));
        console.log(chalk.gray(`    Columns: ${totalColumns}`));
      });
      
      console.log(chalk.blue('\n📥 Source Systems\n'));
      ast.sources.forEach(source => {
        console.log(chalk.green(`  ${source.id} (${source.kind})`));
        if (source.db) {
          console.log(chalk.gray(`    Database: ${source.db}`));
        }
      });
      
      console.log(chalk.blue('\n🔗 Lineage\n'));
      console.log(chalk.white(`  Total mappings: ${ast.mappings.length}`));
      
      // Group by source
      const bySource = new Map<string, number>();
      ast.mappings.forEach(m => {
        const count = bySource.get(m.from.source_id) || 0;
        bySource.set(m.from.source_id, count + 1);
      });
      
      bySource.forEach((count, source) => {
        console.log(chalk.gray(`    ${source}: ${count} mapping(s)`));
      });
      
    } catch (error: any) {
      console.error(chalk.red('✗ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();