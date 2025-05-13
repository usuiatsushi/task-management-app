import { Injectable } from '@angular/core';
import { DateAdapter } from '@angular/material/core';

@Injectable()
export class CustomDateAdapter extends DateAdapter<Date> {
  override format(date: Date, displayFormat: string): string {
    if (displayFormat === 'yyyy/MM/dd') {
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    } else if (displayFormat === 'yyyy年M月') {
      return `${date.getFullYear()}/${date.getMonth() + 1}`;
    }
    return date.toLocaleDateString();
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return value ? new Date(value) : null;
  }

  override createDate(year: number, month: number, date: number): Date {
    return new Date(year, month, date);
  }

  override getDateNames(): string[] {
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }

  override getDayOfWeekNames(): string[] {
    return ['日', '月', '火', '水', '木', '金', '土'];
  }

  override getMonthNames(): string[] {
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  }

  override getYearName(date: Date): string {
    return `${date.getFullYear()}`;
  }

  override getFirstDayOfWeek(): number {
    return 0;
  }

  override getNumDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  override clone(date: Date): Date {
    return new Date(date.getTime());
  }

  override today(): Date {
    return new Date();
  }

  override isValid(date: Date): boolean {
    return !isNaN(date.getTime());
  }

  override isDateInstance(obj: any): boolean {
    return obj instanceof Date;
  }

  override addCalendarMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  override addCalendarDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  override addCalendarYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  override getYear(date: Date): number {
    return date.getFullYear();
  }

  override getMonth(date: Date): number {
    return date.getMonth();
  }

  override getDate(date: Date): number {
    return date.getDate();
  }

  override getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  override toIso8601(date: Date): string {
    return date.toISOString();
  }

  override invalid(): Date {
    return new Date(NaN);
  }
} 