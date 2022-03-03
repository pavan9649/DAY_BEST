const S3= require("aws-sdk/clients/s3");
const fs= require("fs");
const multer = require("multer");
const multerS3 = require("multer-s3");
let { createReadStream, readFileSync, unlink } = require("fs");
const uuid = require("uuid").v4;
const bucketName="day-best";
const regin="US East (Ohio) us-east-2";
const accessKeyId="AKIASF6B7XV4I2CXTZNQ"
const secretKey="19VhCtyUAfKjI/eJvbIN01kvjeOI0Om2bcads0D;"

const s3=new S3({
    regin,
    accessKeyId,
    secretKey
})

const uploadFile = () =>
  multer({
    storage: multerS3({
      s3,
      bucket: bucketName,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, `image-${Date.now()}.jpeg`);
      },
    }),
  });

  function awsUpload(req, res, next) {
    if (req.file) {
      let image = req.file.originalname.split(".");
      const fileType = image[image.length - 1];
  
      let stream = createReadStream(req.file.path);
      const params = {
        Bucket: bucketName,
        Key: `${uuid()}.${fileType}`,
        Body: stream,
        "Content-Length": req.file.size,
      };
      s3.upload(params, (error, data) => {
        //console.log(data, error);
        if (error) {
          res.status(500).json(error);
        } else {
          //console.log(data);
          req.body.image = data.Location;
          req.body.pic_name = data.Key;
  
          next();
        }
      });
    } else {
      next();
    }
  }
  
/*function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path)
  
    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: file.filename
    }
  
    return s3.upload(uploadParams).promise()
  }*/

  exports.awsUpload = awsUpload;
  

  function getFileStream(fileKey) {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName
    }
  
    return s3.getObject(downloadParams).createReadStream()
  }
  exports.getFileStream = getFileStream



  async function awsMultipartUpload(req, res, next) {
    let s3_links = [];
    let chunkSize = 5 * 1024 * 1024;
    //console.log(req.files ,"hello ile")
    for (let i = 0; req.files && i < req.files.length; i++) {
      let numberOfChunks = Math.floor(req.files[i].size / chunkSize) + 1;
      let Parts = [];
      let fileType = req.files[i].originalname.split(".");
      fileType = fileType[fileType.length - 1];
      let buffer = readFileSync(req.files[i].path);
      let params = { Bucket: bucketName, Key: `${uuid()}.${fileType}` };
      //  returns promise so we need to wait til its resolved or rejected
      let initiateUpload = await s3.createMultipartUpload(params).promise();
      let Body;
      for (let chunk = 1; chunk <= numberOfChunks; chunk++) {
        if (chunk === numberOfChunks) {
          Body = buffer.slice((chunk - 1) * chunkSize, buffer.length);
        } else {
          Body = buffer.slice((chunk - 1) * chunkSize, chunk * chunkSize);
        }
        try {
          let response = await s3
            .uploadPart({ ...initiateUpload, PartNumber: chunk, Body })
            .promise();
          Parts[chunk - 1] = { ETag: response.ETag, PartNumber: chunk };
        } catch (e) {
          await s3.abortMultipartUpload(initiateUpload);
        }
      }
      try {
        let uploaded = await s3
          .completeMultipartUpload({
            ...initiateUpload,
            MultipartUpload: { Parts },
          })
          .promise();
          unlink(`${req.files[i].path}`, (err) => {
            console.log(err);
          });
       // console.log(uploaded)  
        s3_links.push(uploaded.Location);
        req.body.pic_name=uploaded.Key
      } catch (error) {
        console.log(error);
        await s3.abortMultipartUpload(initiateUpload);
      }
    }
  
    if (req.body.links) {
      let links = req.body.links;
      req.body.links = [];
      req.body.links.push(links);
      if (s3_links.length) {
        req.body.links.push(...s3_links);
      }
    } else if (s3_links.length) {
      req.body.links = s3_links;
    }
    //console.log(req.body);
    next();
  }
  exports.awsMultipartUpload= awsMultipartUpload;