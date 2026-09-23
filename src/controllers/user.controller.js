import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "ok"
    // })

    const { fullName, email, username, password } = req.body
    console.log("email: ", email)

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === "")
     ) {
            throw new ApiError(400, "All fields are required")
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if ( existedUser ) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avtarLocalPath = req.files?.avatar[0]?.path
    const coveImageLocalPath = req.files?.coverImage[0]?.path
    
    if (!avtarLocalPath) {
        throw new ApiError(400, "Avtar file is required")
    }

    const avtar = await uploadOnCloudinary(avtarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!avtar) {
        throw new ApiError(400, "Avtar file is required")
    }


    const User = await User.create({
        fullName,
        avatar: avatar.url, 
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase() 
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )



})

export { registerUser }