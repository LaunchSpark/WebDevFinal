// AI-generated: factory pattern — returns correct cell instance for section type
import { HeaderCell }     from './HeaderCell.js';
import { ExperienceCell } from './ExperienceCell.js';
import { EducationCell }  from './EducationCell.js';
import { SkillCell }      from './SkillCell.js';

export class CellFactory {
  static create(type, data) {
    switch (type) {
      case 'header':                return new HeaderCell(data);
      case 'work-experience':
      case 'technical-projects':
      case 'clubs-and-organization': return new ExperienceCell(data);
      case 'education':              return new EducationCell(data);
      case 'skills':                 return new SkillCell(data);
      default: throw new Error(`Unknown cell type: ${type}`);
    }
  }
}
