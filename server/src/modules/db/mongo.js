const fs = require("fs");
const path = require("path");
// const winston = require("winston");
// const winstonMongo = require("winston-mongodb");

const { MongoClient } = require("mongodb");

// const logger = require("../../logger");

// Singleton design pattern
class MongoManager {
  static async setInstance(instance) {
    if (!MongoManager.instance) {
      // logger.info("Setting MongoDB instance");
      console.log("Setting MongoDB instance");
      MongoManager.instance = instance;
    }
  }

  static get Instance() {
    return MongoManager.instance;
  }

  static updateSchemas = async () => {
    const directoryPath = path.join(__dirname, "schemas");
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const { updateSchema } = require(filePath);
      if (updateSchema) await updateSchema(MongoManager.instance);
    }
  };

  static connect = async () => {
    if (MongoManager.instance) return MongoManager.instance;

    // Connection string from environment or default
    const mongoUrl =
      process.env.MONGODB_URL ||
      "mongodb+srv://admin:Yash%401234@vidstream.u66ndsu.mongodb.net/videodb?retryWrites=true&w=majority";

    const client = new MongoClient(mongoUrl, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true, // Ensures compatibility with newer MongoDB versions
      tls: true,
      tlsAllowInvalidCertificates: true, // Use only if you are aware of the security implications
    });

    // logger.info("Connecting to MongoDB");
    console.log("Connecting to MongoDB");

    try {
      await client.connect();
      const db = client.db("videodb");

      // Add Winston transport if enabled
      // if (process.env.ENABLE_WINSTON_MONGODB === "true") {
      //   logger.add(
      //     new winston.transports.MongoDB({
      //       db,
      //       collection: "logs",
      //       storeHost: true,
      //       level: "info",
      //     })
      //   );
      // }

      console.log("Connected to MongoDB");
      // logger.info("Connected to MongoDB");
      await MongoManager.setInstance(db);
      await MongoManager.updateSchemas();
      return db;
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      // logger.error("Error connecting to MongoDB:", error);
      throw error;
    }
  };
}

// Export the MongoManager class
module.exports = { MongoManager };
