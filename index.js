// 改自strapi-provider-upload-minio-ce
// 添加了日期目录
const Minio = require('minio');
const mime = require("mime-types");

module.exports = {
  init(providerOptions) {
    const { port, useSSL, endPoint, accessKey, secretKey, bucket, folder } = providerOptions;
    const MINIO = new Minio.Client({
      endPoint,
      port: +port || 9000,
      useSSL: useSSL === "true",
      accessKey,
      secretKey,
    });
    const getUploadPath = (file) => {

      const pathChunk = file.path ? `${file.path}/` : `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}/`;
      const path = folder ? `${folder}/${pathChunk}` : pathChunk;

      return `${path}${file.hash}${file.ext}`;
    };
    const getDeletePath = (file) => {
      const path = file.url.replace(`${bucket}/`, '');
      return path;
    };
    return {
      uploadStream(file) {
        return this.upload(file);
      },
      upload(file) {
        return new Promise((resolve, reject) => {
          // upload file to a bucket
          const path = getUploadPath(file);
          const metaData = {
            'Content-Type': mime.lookup(file.ext) || 'application/octet-stream',
          }

          MINIO.putObject(
            bucket,
            path,
            file.stream || Buffer.from(file.buffer, 'binary'),
            metaData,
            (err, _etag) => {
              if (err) {
                return reject(err);
              }

              file.url = `${bucket}/${path}`;
              resolve();
            }
          );
        });
      },
      delete(file) {
        return new Promise((resolve, reject) => {
          const path = getDeletePath(file);
          MINIO.removeObject(bucket, path, err => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        });
      },
    };
  },
};
