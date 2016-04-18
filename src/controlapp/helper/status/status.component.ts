import {Component, Input} from 'angular2/core';

@Component({
  selector: 'webend-status',
  template: require('./status.html')
})
export class StatusComponent {
  @Input() status: boolean;
  constructor() {}
}
