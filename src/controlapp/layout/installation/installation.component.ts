import {Component, OnInit, OnDestroy} from 'angular2/core';
import {Websocket} from '../../services/websocket';

@Component({
  selector: 'installation',
  template: require('./installation.html')
})
export class InstallationComponent implements OnInit, OnDestroy {
  public logs: string = '';
  public type: string;
  public npmInput: string = '';
  
  constructor(private websocket: Websocket) {}
  
  ngOnInit() {
    this.type = 'global';
    
    //on new system logs
    this.websocket.socket.on('newLog', this.newLogListener);
    this.websocket.socket.on('getLogs', this.newLogListener);
    this.websocket.socket.emit('getLogs');
    
    this.initialiseFileBrowser();
  }
  
  ngOnDestroy() {
    this.websocket.socket.removeListener('newLog', this.newLogListener);
    this.websocket.socket.removeListener('getLogs', this.newLogListener);
  }
  
  install() {console.log('click')
    if (this.type === 'global') {
      //exit with clear input
      if (this.npmInput.length === 0) {
        this.logs += 'No Input given! Add the package name to the input field!\n';
        return;
      }
      //install global available npm package
      this.websocket.socket.emit('install', this.npmInput);
    } else {
      //upload and install local npm package
    }
  }
  
  /**
   * websocket listener
   */
  newLogListener = this._newLogListener.bind(this);
  _newLogListener(data: string) {
    this.logs += data;
  }
  
  /**
   * initialise the file browser input to show the selected file or
   * ammount of files in label
   */
  initialiseFileBrowser() {
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
}
