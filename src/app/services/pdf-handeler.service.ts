
import { Injectable } from '@angular/core';
declare var PDFJS;

@Injectable()
export class PdfHandelerService {
  url: String;
  pdfDoc: any = {};
  pageObjectPromise: any = {};

  constructor() {
  }

  setPdfDocObjects(data) {
    let self = this;
    let docId = data;
    return new Promise((resolve, reject) => {
      PDFJS.getDocument(docId).then((_pdfDoc) => {
        self.pdfDoc[docId] = _pdfDoc;
        resolve(_pdfDoc);
      }, (error) => {
        reject(error);
      });
    });

  }

  SaveToPdf(data: any[]) {
    data.forEach(imgData => {
      PDFJS.addImage(imgData, 'JPEG', 0, 0);
    });
  }


}
