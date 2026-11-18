import multer from 'multer'
import path from 'path'

const extensionsByMimeType = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const allowedExtensions = extensionsByMimeType[file.mimetype]
    const extension = path.extname(file.originalname).toLowerCase()
    if (allowedExtensions && allowedExtensions.includes(extension)) {
      callback(null, true)
      return
    }
    callback(new Error('Choose a JPG, PNG, or WebP image.'))
  },
})

export const uploadAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (error) => {
    if (error) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      return res.status(status).json({ message: error.message })
    }
    next()
  })
}
