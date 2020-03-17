import * as jsPDF from 'jspdf'
import * as JsBarcode from 'jsbarcode'

function generateLabelPDF (assetsArray) {
    var doc = new jsPDF({
        format: 'letter',
        orientation: 'portrait',
        unit: 'in'
    })

    doc.setLineWidth('1mm')
    doc.setFontSize(10)
    doc.setFont('courier')

    for (var index = 0; index < assetsArray.length; index++) {
        // First see if a new page has to be added
        if (index/80 > 0 && index%80 === 0) {
            doc.addPage("letter", "portrait")

            doc.setLineWidth('1mm')
            doc.setFontSize(10)
            doc.setFont('courier')
        }
        // Now generate one label
        var xoffset = 0.3*parseInt(1+((index%80)/20))+1.75*parseInt(((index%80)/20))
        var yoffset = 0.5+0.5*(index%20)
        var canvas = document.getElementById("barcodecanvas")
        JsBarcode('#barcodecanvas', ""+assetsArray[index].assetId, {format: "CODE128C",
            displayValue: false
        })
        var jpegUrl = canvas.toDataURL("image/jpeg")
        doc.addImage(jpegUrl, 'JPEG', xoffset+0, yoffset+0, 1.75, 0.35)
        doc.text(xoffset+0.1, yoffset+0.45, 'HypoSoft '+assetsArray[index].assetId)
        doc.rect(xoffset+0.0, yoffset+0.0, 1.75, 0.5)
    }
    window.open(URL.createObjectURL(doc.output("blob")))
}

export { generateLabelPDF }
