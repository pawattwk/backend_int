const fs = require("fs");
const PDFDocument = require("pdfkit");
// https://pdfkit.org/docs/images.html
// https://pdfkit.org/demo/browser.html

// let data = {
//   "subject": "Meeting_Room",
//   "datetime": "22/10/2020, 14:43-14:44, Duration 1 Min",
//   "record": false,
//   "attendee": "1",
//   "member": []
// }
// for (let i = 1; i <= 100; i++) {
//   data.member.push({
//     "no": i,
//     "name": "prasert.nach@one.th",
//     "timein": "14:43",
//     "timeout": "14:44",
//     "duration": "1 Min"
//   })
// }


function createPDF(data, res, meeting_id) {
  let doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true});
  let buffers = []
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    let pdfData = Buffer.concat(buffers)
    res.writeHead(200, {
    'Content-Length': Buffer.byteLength(pdfData),
    'Content-Type': 'application/pdf',
    'Content-disposition': 'attachment;filename=report-'+meeting_id+'.pdf',})
    res.end(pdfData)
  })
  generateHeader(doc);
  generateBody(doc,data)
  generateTableMember(doc, data)
  doc.end();
  // doc.pipe(fs.createWriteStream(path))
}
// createPDF(data,'../Report.pdf')


function generateHeader(doc) {
  doc
    .image(process.env.path_one, 190, 10, { width: 170, align: "center" })
    .fontSize(20)
    .text("Report", 0, 140, { align: "center" })
    // .moveDown();
}

function generateBody(doc,data){
  doc
  .fontSize(14)
  .text(`Subject:`, 50, 180, { align: "left" })
  .fillColor("#444444")
  .text(data.subject, 105, 180, { align: "left" })
  
  .fillColor("#000000")
  .fontSize(14)
  .text(`Date and Time:`, 50, 205, { align: "left" })
  .fillColor("#444444")
  .text(data.datetime, 150, 205, { align: "left" })

  .fillColor("#000000")
  .text(`Record:`, 50, 230, { align: "left" })
  .fillColor("#444444")
  .text(data.record == true ? 'YES':'NO', 105, 230, { align: "left" })

  .fillColor("#000000")
  .text(`Attendee:`, 50, 255, { align: "left" })
  .fillColor("#444444")
  .text(data.attendee, 115, 255, { align: "left" })

  .fontSize(20)
  .fillColor("#444444")
  .text(`Meeting Report`, 0, 300, { align: "center" })
  // generateHr(doc, 185);
}

function generateTableMember(doc, data){
  bgcolor(doc,355)
  doc
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .fontSize(10)
    .text('No.', 30, 350, {width: 90,align: "center"})
    .text('Name', 130, 350, {width: 150,align: "center"})
    .text('Time in', 310, 350, { width: 90, align: "center" })
    .text('Duration', 450, 350, { width: 90, align: "center" })

  for (let i = 0; i <  data.member.length; i++) {
    let item = data.member[i]
    doc
    .moveDown(2)
    .fontSize(15)
    .font(process.env.path_sarabunTH)
    .fillColor("#000000")
    .text(item.no,70).moveUp()
    .text(item.name,160).moveUp()
    .text(item.timein +' - '+item.timeout,330).moveUp()
    .text(item.duration==null ? 'null':item.duration,470).moveUp()
  }
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function bgcolor(doc,y){
  doc
  .strokeColor("#086AAB")
  .lineWidth(40)
  .moveTo(50, y)
  .lineTo(550, y)
  .stroke();
}

module.exports={createPDF}