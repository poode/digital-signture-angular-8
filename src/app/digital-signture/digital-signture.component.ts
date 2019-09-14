import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

declare var jsPDF;
import * as sha256 from 'sha256'
import {  fromEvent } from 'rxjs';
import { takeUntil, pairwise } from 'rxjs/operators';
import { uploadToS3 } from '../services/aws.js'
import { Subscription } from 'rxjs';
import { PdfHandelerService } from '../services/pdf-handeler.service.js';

@Component({
  selector: 'digital-signture',
  templateUrl: './digital-signture.component.html',
  styleUrls: ['./digital-signture.component.scss'],
  providers: [PdfHandelerService]

})

export class DigitalSigntureComponent implements OnInit {

  pdfFileId: string;
  lastHash: any;
  subscriper: Subscription;
  singature: string;
  showDraw: boolean;
  showType: boolean;
  currentPos: { x: number; y: number; };
  loading: any;

  pdf: any;
  viewport: any;
  showCanvas: boolean;
  edited: boolean;
  canvas: any;
  cx: any;
  docBlob: any;
  isSigned: boolean;
  pageNumber: number;
  myFile: any;
  width: any;
  height: any;
  totalPages: number;
  docReady: boolean;
  fileHash: any;
  myForm: FormGroup;
  errorMessage: string;
  constructor(private pdfHandlerService: PdfHandelerService,
     private fb: FormBuilder) {

  }

  /**
     * initialize the form group in component init event
     *get the employee id from query param
     *
   * @memberof DocumentNewComponent
   */
  ngOnInit(): void {
    // this.myForm = this.fb.group({
    //   Key: [null, Validators.required],
    // })
  }


  /**
   *fire when user select file
   * read the file as array buffer
   * get the file hash and check dublication in blockchain
   * if there is no file with the same hash that means this is new file  and render the file using pdfjs package
   * if not user won't continue and the form valaue is set to null
   * @param {*} files
   * @memberof DocumentNewComponent
   */
  fileChange(files: any) {
    console.log(files, 'files');

    if (files.length > 0) {
      this.pageNumber = 1;
      this.totalPages = 0;


      let reader = new FileReader();
      this.myFile = files[0];




      reader.readAsArrayBuffer(this.myFile);

      reader.onload = () => {
        const result: any = reader.result;
        let typedarray = new Uint8Array(result);
        console.log(typedarray, 'new Uint8Array(');

        this.fileHash = sha256(typedarray);

        this.setInitialProof(typedarray);
        // this.spinner.hide();

      };
    }
  }

  /**
   **populate the pdf using pdfjs package
   * pdfjs  could only serve the current page (may be the previous and next pages)
   *  so to get all the pages in order to sign any of them and save  these signatures
   *  we need to work around by pushing all the pages to array of dataurl
   * when pdfjs render all the pages , it return to render the first page to the user
   *
   * @param {*} file
   * @memberof DocumentNewComponent
   */
  setInitialProof(file) {

    // this.spinner.show();

    this.pdfHandlerService.setPdfDocObjects(file).then(async (pdf) => {
      this.pdf = pdf;
      this.totalPages = this.pdf.pdfInfo.numPages;
      this.docBlob = [];
      //   this.generateView(1);
      for (let index = 1; index < this.totalPages + 1; index++) {
        await this.generateAllView(index).then((r: any) => {

          this.docBlob.push(r.toDataURL("image/jpeg", 1.0));
          this.cx.clearRect(0, 0, this.width, this.height);
          if (index == this.totalPages) {

            this.generateView(1);

          }

        });

      }
      this.docReady = true;
    });

  }
  /**
   *
   *render pdf page in canvas
   * @param {*} pageNumber
   * @memberof DocumentNewComponent
   */
  generateView(pageNumber) {

    this.pdf.getPage(pageNumber).then((page) => {

      let scale = 1;
      let viewport = page.getViewport(scale);
      // let textLayerDiv: any = document.getElementById("page_1");
      this.canvas = document.getElementById('main-canvas');
      this.cx = this.canvas.getContext('2d');
      this.canvas.height = viewport.height;
      this.canvas.width = viewport.width;
      let renderContext = {
        canvasContext: this.cx,
        viewport: viewport
      };
      page.render(renderContext).then((data) => {

      });

    });
  }

  /**
   *render pdf page in canvas
   *
   * @param {*} pageNumber
   * @returns
   * @memberof DocumentNewComponent
   */
  async  generateAllView(pageNumber) {

    return this.pdf.getPage(pageNumber).then(async (page) => {

      let scale = 1;
      this.viewport = page.getViewport(scale);
      this.canvas = document.getElementById('main-canvas');
      if (pageNumber == this.totalPages + 1) {
        this.showCanvas = true;
      }
      this.cx = this.canvas.getContext('2d');
      this.canvas.height = this.viewport.height;
      this.canvas.width = this.viewport.width;
      let renderContext = {
        canvasContext: this.cx,
        viewport: this.viewport
      };

      this.width = this.viewport.width;
      this.height = this.viewport.height;
      return await page.render(renderContext).then((data) => {

        return this.canvas;
      });


    });
  }
  /**
   *render the previous page and fill in canvas
   *
   * @memberof DocumentNewComponent
   */
  changePagePrevious() {
    if (this.pageNumber <= 1) {
      alert("firstPage");
      this.pageNumber = 1;
    }
    else {
      this.pageNumber = this.pageNumber - 1;

      this.generateView(this.pageNumber)
    }
  }
  /**
   *render the next page and fill in canvas
   *
   * @memberof DocumentNewComponent
   */
  changePageNext() {

    if (this.pageNumber >= this.totalPages) {
      alert("LastPage");
      //this.pageNumber = 641;
    }
    else {
      this.pageNumber = this.pageNumber + 1;

      this.generateView(this.pageNumber)
    }
  }
  /**
   * *listen to  mouse mousedown, mousemove events  to draw line  untile the  mouseup event fires
   *
   *
   * @private
   * @param {HTMLCanvasElement} canvasEl
   * @memberof DocumentNewComponent
   */
  private captureEvents(canvasEl: HTMLCanvasElement) {
    if (this.showDraw) {
      this.subscriper = fromEvent(canvasEl, 'mousedown')
        .pipe((e) => {
          return fromEvent(canvasEl, 'mousemove')
            .pipe(takeUntil(fromEvent(canvasEl, 'mouseup')))
            .pipe(pairwise());
        })
        .subscribe((res: [MouseEvent, MouseEvent]) => {
          const rect = canvasEl.getBoundingClientRect();
          const prevPos = {
            x: res[0].clientX - rect.left,
            y: res[0].clientY - rect.top
          };

          const currentPos = {
            x: res[1].clientX - rect.left,
            y: res[1].clientY - rect.top
          };

          this.drawOnCanvas(prevPos, currentPos);
        });
    }

  }
  /**
   *
   *listen to  mouse mousedown event untile mouseup to get the mouse coordinates
   *place input field and button in the  mouse coordincates to take the user signature
   *
   * @private
   * @param {HTMLCanvasElement} canvasEl
   * @memberof DocumentNewComponent
   */
  private captureTypeEvents(canvasEl: HTMLCanvasElement) {
    if (this.showType) {

      this.subscriper = fromEvent(canvasEl, 'mousedown')
        .pipe(takeUntil(fromEvent(canvasEl, 'mouseup')))

        .subscribe((res: MouseEvent) => {
          const rect = canvasEl.getBoundingClientRect();
          const canvasLeft = document.getElementById("main-canvas").getBoundingClientRect().left;

          this.currentPos = {
            x: res.x - rect.left,
            y: res.y - rect.top
          };

          this.typeOnCanvas(this.currentPos);
        });
    }
  }
  /**
   *
   * listen to the mouse event to draw lines in canvas
   * mark edited as true
   * mark showType as false & showDraw as true
   *
   * @memberof DocumentNewComponent
   */
  drawSign() {
    this.edited = true;
    this.showType = false;
    this.showDraw = true;
    this.captureEvents(this.canvas);
  }

  /**
   * listen to the mouse event to type  in canvas
   * mark showType as true & showDraw as false
   * @memberof DocumentNewComponent
   */
  typeSign() {
    this.showType = true;
    this.showDraw = false;
    this.captureTypeEvents(this.canvas);
  }

  /**
   *draw line rom the previous coordinates to current coordinates
   *
   * @private
   * @param {{ x: number, y: number }} prevPos
   * @param {{ x: number, y: number }} currentPos
   * @returns
   * @memberof DocumentNewComponent
   */
  private drawOnCanvas(prevPos: { x: number, y: number }, currentPos: { x: number, y: number }) {
    if (!this.cx) { return; }

    this.cx.beginPath();

    if (prevPos) {
      this.cx.moveTo(prevPos.x, prevPos.y); // from
      this.cx.lineTo(currentPos.x, currentPos.y);
      this.cx.stroke();
    }
  }
  /**
   *display the input box and button to user to write his signature
   *
   * @private
   * @param {{ x: number, y: number }} currentPos
   * @returns
   * @memberof DocumentNewComponent
   */
  private typeOnCanvas(currentPos: { x: number, y: number }) {
    if (!this.cx) { return; }
    console.log(currentPos, 'currentPro');

    // let saveButton = "<input type='button' value='save' id='saveText' onclick='saveTextFromArea("+currentPos.y+","+ currentPos.x+");'></div>";
    // let appendString = textArea + saveButton;
    // let dev = document.getElementById("main")
    this.singature = "";
    let inputArea = document.getElementById("btnTypeing");
    inputArea.setAttribute("visibility", "visible")
    inputArea.setAttribute("style", "position:absolute;top:" + (currentPos.y + 120) + "px;left:" + currentPos.x + "px;z-index:30;")
    // let btnTypeing = document.getElementById("btnTypeing");
    // btnTypeing.setAttribute("visibility", "visible")
    // btnTypeing.setAttribute("style", "position:absolute;top:" + (currentPos.y + 120) + "px;left:" + inputArea.getBoundingClientRect().left + "px;z-index:30;")

  }

  /**
    * write to canvas
   * take the user input and write it to the canvas  with font 16px serif and hide the input box and button
   *
   * @memberof DocumentNewComponent
   */
  finishTyping() {
    this.showType = false;
    this.showDraw = false;
    this.edited = true;

    this.subscriper.unsubscribe();
    const sig = document.getElementById("mySignature");
    document.getElementById("btnTypeing").style.visibility = "hidden";
    let rect = sig.getBoundingClientRect();


    //  sig.hidden = true;
    this.cx.font = '16px serif';
    this.cx.fillText(this.singature, this.currentPos.x, this.currentPos.y);
  }
  /**
    *save file to aws
     * first save all canvas dataurl to one pdf file using jspdf package
   *
   * @memberof DocumentNewComponent
   */
  async Save() {
    // get the opning page tht contain the user signature

    this.docBlob[this.pageNumber - 1] = this.canvas.toDataURL("image/jpeg", 1.0)

    let doc: any;
    // set jspdf option and detect the file orintation
    if (this.width > this.height) {
      doc = new jsPDF('l', 'pt', [this.width, this.height]);
    }
    else {
      doc = new jsPDF('p', 'pt', 'a4', true);
    }
    let index = 1;
    await this.docBlob.forEach(data => {
      doc.addImage(data, 'JPEG', 0, 0, this.width, this.height);
      if (this.docBlob.length != index) {
        doc.addPage();

      }
      index++;


    });
    const docToArray = new Uint8Array((doc.output('arraybuffer')));
    const lastHash = sha256(docToArray);
    console.log(lastHash, 'Uint8ArrayHash');



    // save to aws

    uploadToS3(doc.output('arraybuffer'), this.fileHash, this.myFile.name).then((d) => {
      this.pdfFileId = d.Key;
      this.lastHash = lastHash;
      this.isSigned = true;
    }).catch(e => {
      console.log(e, 'error ');
    });

  }



  ////////////////////////////////////////////////////////

  onCancle() {
    const confirmed = confirm('Are you Sure?');
    if(confirmed){
      alert('cancel and go to any page ')
    }
    return;
  }

  sendToAPI(form: FormGroup) {
    alert(`Send data to API as file key is ${this.pdfFileId}`)
    return;
  }
}

