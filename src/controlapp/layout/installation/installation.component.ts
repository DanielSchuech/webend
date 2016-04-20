import {Component, OnInit, OnDestroy} from 'angular2/core';
import {Websocket} from '../../services/websocket';

@Component({
  selector: 'installation',
  template: require('./installation.html')
})
export class InstallationComponent implements OnInit, OnDestroy {
  public logs: string = '';
  public type: string;
  
  constructor(private websocket: Websocket) {}
  
  ngOnInit() {
    this.type = 'global';
    
    //on new system logs
    this.websocket.socket.on('newLog', this.newLogListener);
    
    var inputs = document.querySelectorAll( '.inputfile' );
    Array.prototype.forEach.call( inputs, function( input: any )
    {
      var label	 = input.nextElementSibling,
        labelVal = label.innerHTML;

      input.addEventListener( 'change', function( e: any )
      {
        var fileName = '';
        if( this.files && this.files.length > 1 )
          fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
        else
          fileName = e.target.value.split( '\\' ).pop();

        if( fileName )
          label.querySelector( 'span' ).innerHTML = fileName;
        else
          label.innerHTML = labelVal;
      });
    });
  }
  
  ngOnDestroy() {
    this.websocket.socket.removeListener('newLog', this.newLogListener);
  }
  
  /**
   * websocket lsitener
   */
  newLogListener = this._newLogListener.bind(this);
  _newLogListener(data: string) {
    this.logs += data;
  }
}