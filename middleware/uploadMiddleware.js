const path = require('path');
const multer = require('multer');

const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.gif', '.txt'];

function createStorage(folder) {
  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.join(__dirname, '..', 'uploads', folder));
    },
    filename(req, file, cb) {
      const safeOriginalName = file.originalname.replace(/\s+/g, '-').toLowerCase();
      cb(null, `${Date.now()}-${safeOriginalName}`);
    }
  });
}

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return cb(new Error('Unsupported file type.'));
  }

  return cb(null, true);
}

const uploadMaterial = multer({
  storage: createStorage('materials'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadSubmission = multer({
  storage: createStorage('submissions'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = {
  uploadMaterial,
  uploadSubmission
};
