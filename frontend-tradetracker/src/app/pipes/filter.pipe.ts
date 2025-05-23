import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[] | null, currency: string): any[] {
    if (!items) return [];
    
    return items.filter(item => item.currency === currency);
  }
}
