import {Component, Input, Output, EventEmitter} from 'angular2/core';

@Component({
  selector: 'webend-switch',
  template: require('./switch.html')
})
export class SwitchComponent {
  @Input() model: boolean;
  @Output() modelChange = new EventEmitter();
  
  switch() {
    this.model = !this.model;
    this.modelChange.next(this.model);
  }
}
