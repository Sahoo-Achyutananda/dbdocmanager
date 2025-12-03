#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as os from 'os';
const { exit } = require('node:process');
import { DBDocParser } from './parser/parser';
import { DBDocValidator } from './validator/validator';
import { HTMLGenerator } from './generators/html-generator';
import { ValidationReportGenerator } from './generators/validation-report-generator';

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
  .option('-o, --output <dir>', 'Output directory for validation report', './validation-reports')
  .option('--no-report', 'Skip generating report file (only console output)')
  .option('--no-clean', 'Skip cleaning output directory before generating report')
  .action((file: string, options: { output: string; report: boolean; clean: boolean }) => {
    try {
      console.log(chalk.blue('🔍 Validating DSL file...'));
      
      // Clean output directory if enabled
      if (options.report && options.clean) {
        if (fs.existsSync(options.output)) {
          console.log(chalk.yellow(`🧹 Cleaning report directory: ${options.output}`));
          fs.rmSync(options.output, { recursive: true, force: true });
        }
      }
      
      const parser = new DBDocParser();
      const ast = parser.parse(file);
      
      console.log(chalk.green('✓ Successfully parsed DSL file'));
      console.log(chalk.gray(`  Project: ${ast.project}`));
      console.log(chalk.gray(`  Targets: ${ast.targets.length}`));
      console.log(chalk.gray(`  Sources: ${ast.sources.length}`));
      console.log(chalk.gray(`  Mappings: ${ast.mappings.length}`));
      
      const validator = new DBDocValidator();
      const result = validator.validate(ast);
      
      // ALWAYS generate validation report first (before displaying errors)
      if (options.report) {
        console.log(chalk.blue('\n📄 Generating validation report...'));
        const reportGen = new ValidationReportGenerator();
        reportGen.generateTextReport(result, ast.project, options.output);
        console.log(chalk.green(`✓ Validation report saved to ${options.output}/validation-report.txt`));
      }
      
      // Display errors on console
      if (result.errors.length > 0) {
        console.log(chalk.red(`\n❌ Found ${result.errors.length} error(s):\n`));
        result.errors.forEach(err => {
          console.log(chalk.red(`  • ${err.type}: ${err.message}`));
          if (err.location) {
            console.log(chalk.gray(`    Location: ${err.location}`));
          }
        });
      }
      
      // Display warnings on console
      if (result.warnings.length > 0) {
        console.log(chalk.yellow(`\n⚠️  Found ${result.warnings.length} warning(s):\n`));
        result.warnings.forEach(warn => {
          console.log(chalk.yellow(`  • ${warn.type}: ${warn.message}`));
          if (warn.location) {
            console.log(chalk.gray(`    Location: ${warn.location}`));
          }
        });
      }
      
      // Final status
      if (result.valid) {
        console.log(chalk.green('\n✓ Validation passed!'));
        process.exit(0);
      } else {
        console.log(chalk.red('\n✗ Validation failed!'));
        if (options.report) {
          console.log(chalk.cyan(`\n💡 Check detailed report at: ${options.output}/validation-report.txt`));
        }
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
  .option('--validate', 'Run validation before generating docs', true)
  .option('--validation-report', 'Generate validation report along with docs', true)
  .option('--no-clean', 'Skip cleaning output directory before generation')
  .option('--no-open', 'Skip auto-opening browser after generation')
  .action((file: string, options: { output: string; validate: boolean; validationReport: boolean; clean: boolean; open: boolean }) => {
    try {
      console.log(chalk.blue('📚 Generating documentation...'));
      
      // Clean output directory if enabled
      if (options.clean) {
        if (fs.existsSync(options.output)) {
          console.log(chalk.yellow(`🧹 Cleaning output directory: ${options.output}`));
          fs.rmSync(options.output, { recursive: true, force: true });
        }
      }
      
      const parser = new DBDocParser();
      const ast = parser.parse(file);
      
      console.log(chalk.green('✓ Parsed DSL file'));
      
      // Optional validation
      if (options.validate) {
        const validator = new DBDocValidator();
        const result = validator.validate(ast);
        
        // ALWAYS generate validation report (even if validation fails)
        if (options.validationReport) {
          const reportGen = new ValidationReportGenerator();
          reportGen.generateTextReport(result, ast.project, options.output);
          console.log(chalk.green('✓ Validation report generated'));
        }
        
        if (!result.valid) {
          console.log(chalk.red(`\n❌ Validation failed with ${result.errors.length} error(s)`));
          result.errors.forEach(err => {
            console.log(chalk.red(`  • ${err.message}`));
          });
          console.log(chalk.yellow('\nFix errors before generating documentation.'));
          if (options.validationReport) {
            console.log(chalk.cyan(`\n💡 Check detailed report at: ${options.output}/validation-report.txt`));
          }
          process.exit(1);
        }
        
        console.log(chalk.green('✓ Validation passed'));
      }
      
      const generator = new HTMLGenerator();
      generator.generate(ast, options.output);
      
      const absolutePath = path.resolve(options.output, 'index.html');
      
      console.log(chalk.green(`\n✓ Documentation generated successfully!`));
      console.log(chalk.gray(`  Output: ${absolutePath}`));
      
      if (options.validationReport) {
        console.log(chalk.cyan(`View validation report at ${options.output}/validation-report.txt`));
      }
      
      // --- AUTO OPEN LOGIC ---
      if (options.open) {
        console.log(chalk.cyan(`\n🚀 Opening in your browser...`));
        
        let command;
        const platform = os.platform();

        if (platform === 'win32') {
          // Windows
          command = `start "" "${absolutePath}"`;
        } else if (platform === 'darwin') {
          // macOS
          command = `open "${absolutePath}"`;
        } else {
          // Linux
          command = `xdg-open "${absolutePath}"`;
        }

        exec(command, (error) => {
          if (error) {
            console.log(chalk.yellow('Could not auto-open browser. Please open the file manually.'));
          }
        });
      } else {
        console.log(chalk.cyan(`\n💡 Open ${absolutePath} in your browser to view.`));
      }
      
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

// New command: Generate only validation report
program
  .command('report')
  .description('Generate only validation report (no docs)')
  .argument('<file>', 'JSON DSL file')
  .option('-o, --output <dir>', 'Output directory', './validation-reports')
  .option('--no-clean', 'Skip cleaning output directory before generating report')
  .action((file: string, options: { output: string; clean: boolean }) => {
    try {
      console.log(chalk.blue('📋 Generating validation report...'));
      
      // Clean output directory if enabled
      if (options.clean) {
        if (fs.existsSync(options.output)) {
          console.log(chalk.yellow(`🧹 Cleaning report directory: ${options.output}`));
          fs.rmSync(options.output, { recursive: true, force: true });
        }
      }
      
      const parser = new DBDocParser();
      const ast = parser.parse(file);
      
      const validator = new DBDocValidator();
      const result = validator.validate(ast);
      
      const reportGen = new ValidationReportGenerator();
      reportGen.generateTextReport(result, ast.project, options.output);
      
      console.log(chalk.cyan(`\nReport saved to: ${options.output}/validation-report.txt`));
      
      // Show summary
      if (result.valid) {
        console.log(chalk.green('\n✓ Validation: PASSED'));
      } else {
        console.log(chalk.red('\n✗ Validation: FAILED'));
        console.log(chalk.red(`  Errors: ${result.errors.length}`));
      }
      console.log(chalk.yellow(`  Warnings: ${result.warnings.length}`));
      
    } catch (error: any) {
      console.error(chalk.red('✗ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();