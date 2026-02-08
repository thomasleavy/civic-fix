import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Local file storage fallback
const saveFileLocally = async (file: Express.Multer.File): Promise<{
  url: string;
  public_id: string;
}> => {
  // Create uploads directory if it doesn't exist
  // Use process.cwd() to get the project root, then navigate to server/uploads
  const uploadsDir = path.join(process.cwd(), 'server', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
  }

  // Generate unique filename
  const fileExt = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExt}`;
  const filePath = path.join(uploadsDir, fileName);

  // Write file to disk
  fs.writeFileSync(filePath, file.buffer);
  console.log('Saved image locally:', filePath);

  // Return URL that can be served statically
  const url = `/uploads/${fileName}`;
  return {
    url,
    public_id: fileName // Use filename as public_id for local storage
  };
};

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<{
  url: string;
  public_id: string;
}> => {
  // If Cloudinary is not configured, use local storage
  if (!isCloudinaryConfigured()) {
    console.log('Cloudinary not configured, using local file storage');
    return saveFileLocally(file);
  }

  // Try Cloudinary upload
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'civicfix',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              public_id: result.public_id
            });
          } else {
            reject(new Error('Upload failed'));
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  } catch (error) {
    // If Cloudinary fails, fall back to local storage
    console.warn('Cloudinary upload failed, falling back to local storage:', error);
    return saveFileLocally(file);
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw - image deletion failure shouldn't break the app
  }
};
