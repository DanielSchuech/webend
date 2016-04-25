import {Component, OnInit, OnDestroy} from 'angular2/core';
import {Websocket} from '../../services/websocket';

declare var window: any;

@Component({
  selector: 'installation',
  template: require('./installation.html')
})
export class InstallationComponent implements OnInit, OnDestroy {
  public logs: string = '';
  public type: string;
  public npmInput: string = '';
  public uploadFiles: FileList;
  public fReader: {[name: string]: FileReader} = {};
  public uploadProgress: {[name: string]: number} = {};
  public uploadPercentage: number;
  
  constructor(private websocket: Websocket) {}
  
  ngOnInit() {
    this.type = 'global';
    
    //on new system logs
    this.websocket.socket.on('newLog', this.newLogListener);
    this.websocket.socket.on('getLogs', this.newLogListener);
    this.websocket.socket.on('uploadMoreData', this.uploadMoreDataListener);
    this.websocket.socket.on('uploadDone', this.uploadDone);
    this.websocket.socket.emit('getLogs');
    
    this.initialiseFileBrowser();
  }
  
  ngOnDestroy() {
    this.websocket.socket.removeListener('newLog', this.newLogListener);
    this.websocket.socket.removeListener('getLogs', this.newLogListener);
    this.websocket.socket.removeListener('uploadMoreData', this.uploadMoreDataListener);
    this.websocket.socket.removeListener('uploadDone', this.uploadDone);
  }
  
  install() {
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
      if (!this.uploadFiles) {
        this.logs += 'No File selected\n';
        return;
      }
      if (!window.File || !window.FileReader) {
        this.logs += 'Your Browser Doesn\'t Support The File API Please Update Your Browser';
        return;
      }
      this.upload();
    }
  }
  
  upload() {
    let self = this;
    for (let i = 0; i < this.uploadFiles.length; i++) {
      let file = this.uploadFiles[i];
      self.fReader[file.name] = new FileReader();
      self.fReader[file.name].onload = (evnt: any) => {      
        self.websocket.socket.emit('fileUpload', 
          { 'name' : file.name, data : evnt.target.result });
      }
      self.websocket.socket.emit('fileUploadStart', 
        { 'name' : file.name, 'size' : file.size });
    }
    
  }
  
  /**
   * websocket listener
   */
  newLogListener = this._newLogListener.bind(this);
  _newLogListener(data: string) {
    this.logs += data;
  }
  
  uploadMoreDataListener = this._uploadMoreDataListener.bind(this);
  _uploadMoreDataListener(data: any) {
    this.updateProgress(data);
    let file = this.findFileByName(data.name);
    let place = data['place'] * 524288; //The Next Blocks Starting Position
    let newFile: any; //The Variable that will hold the new Block of Data
    if (file.slice) 
        newFile = file.slice(place, place + 
          Math.min(524288, (file.size - place)));
    this.fReader[file.name].readAsBinaryString(newFile);
  }
  
  uploadDone = this._uploadDone.bind(this);
  _uploadDone(name: any) {
    this.updateProgress({name: name, percent: 100});
  }
  
  updateProgress(data: any) {
    let percent = Math.round(data['percent'] * 100) / 100;
    this.uploadProgress[data.name] = percent;
    
    let keys = Object.keys(this.uploadProgress);
    this.uploadPercentage = 0;
    keys.forEach((key) => {
      this.uploadPercentage += this.uploadProgress[key];
    });
    this.uploadPercentage /= keys.length;
    this.uploadPercentage = Math.round(this.uploadPercentage * 100) / 100;
  }
  
  /**
   * initialise the file browser input to show the selected file or
   * ammount of files in label
   */
  initialiseFileBrowser() {
    let self = this;
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
        
        self.uploadFiles = this.files;

        if( fileName )
          label.querySelector( 'span' ).innerHTML = fileName;
        else
          label.innerHTML = labelVal;
      });
    });
  }
  
  /**
   * helper
   */
  findFileByName(name: string) {
    let file: File;
    let found: File;
    for (let i = 0; file = this.uploadFiles[i]; i++) {
      if (file.name === name) {
        found = file;
      }
    }
    return found;
  }
}
