const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME || 'chunks';

let containerClient = null;

const getContainerClient = () => {
  if (!connectionString) {
    throw new Error('Azure storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING to use azure provider.');
  }

  if (!containerClient) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
  }

  return containerClient;
};

/**
 * Uploads a chunk buffer to Azure Blob Storage
 * @param {string} hash - The hash of the chunk (used as blob name)
 * @param {Buffer} buffer - The chunk data
 * @returns {Promise<string>} - The URL of the uploaded blob
 */
const uploadChunkToAzure = async (hash, buffer) => {
  try {
    const blockBlobClient = getContainerClient().getBlockBlobClient(hash);
    
    // Create container if it doesn't exist (optional, but good for first time)
    // await containerClient.createIfNotExists();

    await blockBlobClient.uploadData(buffer);
    return blockBlobClient.url;
  } catch (error) {
    console.error(`Error uploading chunk ${hash} to Azure:`, error.message);
    throw error;
  }
};

/**
 * Downloads a chunk buffer from Azure Blob Storage
 * @param {string} hash - The hash of the chunk
 * @returns {Promise<Buffer>} - The chunk data
 */
const downloadChunkFromAzure = async (hash) => {
  try {
    const blockBlobClient = getContainerClient().getBlockBlobClient(hash);
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    
    return await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
  } catch (error) {
    console.error(`Error downloading chunk ${hash} from Azure:`, error.message);
    throw error;
  }
};

/**
 * Deletes a chunk from Azure Blob Storage
 * @param {string} hash - The hash of the chunk
 */
const deleteChunkFromAzure = async (hash) => {
  try {
    const blockBlobClient = getContainerClient().getBlockBlobClient(hash);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error(`Error deleting chunk ${hash} from Azure:`, error.message);
    throw error;
  }
};

/**
 * Helper to convert stream to buffer
 */
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

module.exports = {
  uploadChunkToAzure,
  downloadChunkFromAzure,
  deleteChunkFromAzure
};
