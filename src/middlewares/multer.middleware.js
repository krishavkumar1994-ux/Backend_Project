import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("🔥🔥🔥 MULTER MIDDLEWARE LOADED 🔥🔥🔥")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("🔥🔥🔥 DESTINATION CALLED 🔥🔥🔥")
        const uploadPath = path.join(__dirname, "../../public/temp")
        console.log("Path:", uploadPath)

        cb(null, uploadPath)
    },

    filename: function (req, file, cb) {
        console.log("🔥🔥🔥 FILENAME CALLED 🔥🔥🔥")
        console.log("File:", file.originalname)

        cb(null, file.originalname)
    }
})

export const upload = multer({ storage })