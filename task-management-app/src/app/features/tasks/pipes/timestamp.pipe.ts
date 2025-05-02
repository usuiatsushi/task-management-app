import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from 'firebase/firestore';

@Pipe({
  name: 'timestamp',
  standalone: true
})
export class TimestampPipe implements PipeTransform {
  transform(value: Timestamp | null): Date | null {
    return value?.toDate() || null;
  }
} 