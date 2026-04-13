const azure = require('../utils/azureStorage');
const local = require('../utils/localStorage');

const normalizeProvider = (provider) => (provider || 'local').toLowerCase();

const hasAzureConfig = () => Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING);

const resolveDefaultProvider = () => {
  if (process.env.STORAGE_PROVIDER) {
    return normalizeProvider(process.env.STORAGE_PROVIDER);
  }

  return hasAzureConfig() ? 'azure' : 'local';
};

const createS3Adapter = () => ({
  storeChunk: async () => {
    throw new Error('S3 storage provider is not configured in this workspace');
  },
  getChunk: async () => {
    throw new Error('S3 storage provider is not configured in this workspace');
  },
  deleteChunk: async () => {
    throw new Error('S3 storage provider is not configured in this workspace');
  }
});

const adapters = {
  local: {
    storeChunk: local.uploadChunkLocal,
    getChunk: local.downloadChunkLocal,
    deleteChunk: local.deleteChunkLocal
  },
  azure: {
    storeChunk: azure.uploadChunkToAzure,
    getChunk: azure.downloadChunkFromAzure,
    deleteChunk: azure.deleteChunkFromAzure
  },
  s3: createS3Adapter()
};

let activeProvider = normalizeProvider(process.env.STORAGE_PROVIDER);
activeProvider = resolveDefaultProvider();

const setProvider = (provider) => {
  activeProvider = normalizeProvider(provider);
};

const getProviderAdapter = () => adapters[activeProvider] || adapters.local;

const storeChunk = async (hash, buffer) => getProviderAdapter().storeChunk(hash, buffer);

const getChunk = async (hash) => {
  const primaryProvider = activeProvider;
  const fallbackProvider = primaryProvider === 'azure' ? 'local' : 'azure';

  try {
    return await (adapters[primaryProvider] || adapters.local).getChunk(hash);
  } catch (error) {
    const isNotFound = error && (error.code === 'ENOENT' || error.statusCode === 404 || error.statusCode === 409);
    if (!isNotFound) {
      throw error;
    }

    // If chunk is not found in selected provider, try the alternate backend.
    if (fallbackProvider === 'azure' && !hasAzureConfig()) {
      throw error;
    }

    return await (adapters[fallbackProvider] || adapters.local).getChunk(hash);
  }
};

const deleteChunk = async (hash) => getProviderAdapter().deleteChunk(hash);

module.exports = {
  storeChunk,
  getChunk,
  deleteChunk,
  setProvider
};
