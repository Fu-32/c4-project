// import pdf from 'pdf-parse';
// import formidable from 'formidable';
// import fs from 'fs';
// 
// export const config = {
//   api: {
//     bodyParser: false, // Disable default body parsing for file uploads
//   },
// };
// 
// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }
// 
//   const form = new formidable.IncomingForm();
// 
//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error('Error parsing form:', err);
//       return res.status(500).json({ message: 'Error parsing form data.' });
//     }
// 
//     const file = files.file;
//     if (!file) {
//       return res.status(400).json({ message: 'No file uploaded.' });
//     }
// 
//     try {
//       // Read the uploaded file
//       const fileBuffer = fs.readFileSync(file.filepath);
// 
//       // Extract text from the PDF
//       const data = await pdf(fileBuffer);
// 
//       // Respond with the extracted text
//       return res.status(200).json({ text: data.text });
//     } catch (error) {
//       console.error('Error parsing PDF:', error);
//       return res.status(500).json({ message: 'Error parsing PDF.' });
//     }
//   });
// }