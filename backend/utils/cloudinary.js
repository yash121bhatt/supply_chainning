require('dotenv').config();

require('dotenv').config();

const cloudinary = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = CLOUD_NAME && API_KEY && API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.v2.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET
  });
}

const avatarStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary: cloudinary.v2,
      params: {
        folder: 'supply-chain/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }]
      }
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${req.user?.id || 'user'}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

const podStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary: cloudinary.v2,
      params: {
        folder: 'supply-chain/pod',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf']
      }
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/pod');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `pod-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

console.log('Cloudinary config:', { isCloudinaryConfigured, CLOUD_NAME });

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, and PNG images are allowed'), false);
    }
  }
});

const podUpload = multer({
  storage: podStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadPOD = podUpload.fields([
  { name: 'deliveryImage', maxCount: 1 },
  { name: 'signatureImage', maxCount: 1 }
]);

module.exports = {
  cloudinary,
  avatarUpload,
  podUpload,
  uploadPOD,
  isCloudinaryConfigured
};