const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

const {
  insert,
  search,
  update,
  updateViewCount,
  deleteById,
  count,
} = require("./service");
const { validate } = require("./request");
const { VIDEO_QUEUE_EVENTS: QUEUE_EVENTS } = require("../../queues/constants");
const { VIDEO_STATUS } = require("../../db/constant");
const { addQueueItem } = require("../../queues/queue");
const {
  getVideoDurationAndResolution,
} = require("../../queues/video-processor");
// const logger = require("../../../logger");

const BASE_URL = `/api/videos`;

const setupRoutes = (app) => {
  // logger.info(`Setting up routes for ${BASE_URL}`);
  console.log(`Setting up routes for ${BASE_URL}`);

  // return empty response with success message for the base route
  app.get(`${BASE_URL}/`, async (req, res) => {
    // logger.info(`GET`, req.params);
    console.log(`GET`, req.params);
    const data = await search({});
    res.send({
      status: "success",
      message: "OK",
      timestamp: new Date(),
      data,
    });
  });

  app.get(`${BASE_URL}/detail/:id`, async (req, res) => {
    // logger.info(`GET`, req.params);
    console.log(`GET`, req.params);
    const video = await updateViewCount(req.params.id);
    if (video instanceof Error) {
      return res.status(400).json(JSON.parse(video.message));
    }
    res.send(video);
  });

  // TODO: Proper searching with paging and ordering
  app.post(`${BASE_URL}/search`, async (req, res) => {
    // logger.info("POST search", req.body);
    console.log("POST search", req.body);
    const result = await search(req.body);
    res.send(result);
  });

  app.post(`${BASE_URL}/count`, async (req, res) => {
    // logger.info("POST count", req.body);
    console.log("POST count", req.body);
    const result = await count(req.body);
    res.send({ count: result });
  });

  // app.post(`${BASE_URL}/create`, async (req, res) => {
  //   // console.log('POST create', req.body);
  //   const validationResult = validate(req.body);
  //   if (!validationResult.error) {
  //     const result = await insert(req.body);
  //     if (result instanceof Error) {
  //       res.status(400).json(JSON.parse(result.message));
  //       return;
  //     }
  //     return res.json(result);
  //   }
  //   return res
  //     .status(400)
  //     .json({ status: 'error', message: validationResult.error });
  // });

  app.put(`${BASE_URL}/update/:id`, async (req, res) => {
    const validationResult = validate(req.body);
    if (req.params.id && !validationResult.error) {
      const result = await update({
        _id: req.params.id,
        ...validationResult.value,
      });
      if (result instanceof Error) {
        return res.status(400).json(JSON.parse(result.message));
      }
      return res.json(result);
    }
    return res
      .status(400)
      .json({ status: "error", message: validationResult.error });
  });

  app.delete(`${BASE_URL}/delete/:id`, async (req, res) => {
    // logger.info("DELETE", req.params.id);
    console.log("DELETE", req.params.id);
    if (req.params.id) {
      const result = await deleteById(req.params.id);
      if (result instanceof Error) {
        res.status(400).json(JSON.parse(result.message));
        return;
      }
      return res.json(result);
    }
    return res.status(400).json({ status: "error", message: "Id required" });
  });

  // upload videos handler using multer package routes below.

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/videos");
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype === "video/mp4" || file.mimetype === "video/webm") {
      // logger.info("file type supported", file);
      console.log("file type supported", file);
      cb(null, true);
    } else {
      // logger.info("file type not supported", file);
      console.log("file type not supported", file);
      cb(new multer.MulterError("File type not supported"), false);
    }
  };

  const s3Client = new S3Client({
    region: process.env.REGION, // Region must match your S3 bucket region
    credentials: {
      accessKeyId: process.env.ACCESS_KEY, // Access key pair from your AWS account
      secretAccessKey: process.env.ACCESS_TOKEN, // Secret access key from your AWS account
    },
  });

  const s3Storage = multerS3({
    s3: s3Client, // S3 instance
    bucket: process.env.BUCKET_NAME, // Your S3 bucket name
    acl: "private", // Storage access type
    // metadata: (req, file, cb) => {
    //   cb(null, { fieldname: file.fieldname });
    // },
    // key: (req, file, cb) => {
    //   const fileName =
    //     Date.now() + '_' + file.fieldname + '_' + file.originalname;
    //   cb(null, fileName);
    // },
  });

  const upload = multer({
    // dest: 'uploads/videos',
    fileFilter: fileFilter,
    limits: { fileSize: 50000000 },
    storage: s3Storage,
  }).single("video");

  const uploadProcessor = (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        // console.error(err);
        res.status(400).json({ status: "error", error: err });
        return;
      } else {
        // logger.info("upload success", req.file);
        console.log("upload success", req.file);
        // res.status(200).json({ status: "success", message: "upload success" });
        next();
      }
    });
  };

  app.post(`${BASE_URL}/upload`, uploadProcessor, async (req, res) => {
    try {
      // const { videoDuration } = await getVideoDurationAndResolution(
      //   `./${req.file.path}`
      // );
      // console.log('videoDuration', videoDuration);

      const dbPayload = {
        ...req.body,
        fileName: req.file.originalname,
        originalName: req.file.originalname,
        recordingDate: new Date(),
        videoLink: req.file.location,
        viewCount: 0,
        duration: 0,
        status: VIDEO_STATUS.PUBLISHED,
      };
      // logger.info("dbPayload", { dbPayload });
      console.log("dbPayload", { dbPayload });
      // TODO: save the file info and get the id from the database
      const result = await insert(dbPayload);
      // logger.info("result", result);
      console.log("result", result);
      // await addQueueItem(QUEUE_EVENTS.VIDEO_UPLOADED, {
      //   id: result.insertedId.toString(),
      //   ...req.body,
      //   ...req.file,
      // });
      res.status(200).json({
        status: "success",
        message: "Upload success",
        ...req.file,
        ...result,
      });
      return;
    } catch (error) {
      // logger.error(error);
      console.error(error);
      res.send(error);
    }
  });
};

const setup = (app) => {
  setupRoutes(app);
};

module.exports = { setup };
