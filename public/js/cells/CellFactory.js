// AI-generated: factory pattern — returns correct cell instance for section type
import { ExperienceCell } from './ExperienceCell.js';
import { EducationCell }  from './EducationCell.js';
import { SkillCell }      from './SkillCell.js';
import { AwardCell }      from './AwardCell.js';

export class CellFactory {
  static create(type, data) {
    switch (type) {
      case 'experience': return new ExperienceCell(data);
      case 'education':  return new EducationCell(data);
      case 'skills':     return new SkillCell(data);
      case 'awards':
      case 'certs':      return new AwardCell(data);
      default: throw new Error(`Unknown cell type: ${type}`);
    }
  }
}
