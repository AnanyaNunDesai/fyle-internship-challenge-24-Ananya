import { Pipe, PipeTransform } from '@angular/core';
import { Repository } from '../constants/repository';

@Pipe({ name: 'repository', standalone: true })
export class RepositoryPipe implements PipeTransform {
  transform(value: any): Repository | null {
    if (!value || !value.name) {
      return null;
    } else {
      return {
        name: value.name,
        description: value.description,
        topics: value.topics,
      } as Repository;
    }
  }
}
