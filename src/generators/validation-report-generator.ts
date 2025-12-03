// src/generators/validation-report-generator.ts
import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult, ValidationError, ValidationWarning } from '../types/ast';

export class ValidationReportGenerator {

  generateTextReport(
    result: ValidationResult,
    projectName: string,
    outputDir: string
  ): void {
    const timestamp = new Date().toISOString();
    const reportPath = path.join(outputDir, 'validation-report.txt');

    const text = this.buildTextReport(result, projectName, timestamp);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, text);
    console.log(`✓ Validation report generated: ${reportPath}`);
  }

  /**
   * Build the text report
   */
  private buildTextReport(
    result: ValidationResult,
    projectName: string,
    timestamp: string
  ): string {
    const lines: string[] = [];
    const separator = '='.repeat(80);
    const miniSeparator = '-'.repeat(80);

    // Header
    lines.push(separator);
    lines.push('                    VALIDATION REPORT');
    lines.push(separator);
    lines.push('');
    lines.push(`Project:   ${projectName}`);
    lines.push(`Generated: ${new Date(timestamp).toLocaleString()}`);
    lines.push(`Status:    ${result.valid ? '✓ PASSED' : '✗ FAILED'}`);
    lines.push('');

    // Summary
    lines.push(separator);
    lines.push('                      SUMMARY');
    lines.push(separator);
    lines.push('');
    lines.push(`  Errors:   ${result.errors.length}`);
    lines.push(`  Warnings: ${result.warnings.length}`);
    lines.push('');

    // Errors Section
    if (result.errors.length > 0) {
      lines.push(separator);
      lines.push(`                  ERRORS (${result.errors.length})`);
      lines.push(separator);
      lines.push('');

      result.errors.forEach((error, idx) => {
        lines.push(`[${idx + 1}] ${error.type}`);
        lines.push(miniSeparator);
        lines.push(`Message:  ${error.message}`);
        if (error.location) {
          lines.push(`Location: ${error.location}`);
        }
        lines.push('');
      });
    } else {
      lines.push(separator);
      lines.push('                      ERRORS');
      lines.push(separator);
      lines.push('');
      lines.push('  ✓ No errors found! Your schema is error-free.');
      lines.push('');
    }

    // Warnings Section
    if (result.warnings.length > 0) {
      lines.push(separator);
      lines.push(`                 WARNINGS (${result.warnings.length})`);
      lines.push(separator);
      lines.push('');

      result.warnings.forEach((warning, idx) => {
        lines.push(`[${idx + 1}] ${warning.type}`);
        lines.push(miniSeparator);
        lines.push(`Message:  ${warning.message}`);
        if (warning.location) {
          lines.push(`Location: ${warning.location}`);
        }
        lines.push('');
      });
    } else {
      lines.push(separator);
      lines.push('                     WARNINGS');
      lines.push(separator);
      lines.push('');
      lines.push('  ✓ No warnings found! Everything looks good.');
      lines.push('');
    }

    // Footer
    lines.push(separator);
    lines.push('                    END OF REPORT');
    lines.push(separator);

    return lines.join('\n');
  }
}