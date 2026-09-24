import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User as UserModel } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "ok"
    // })

    const { fullName, email, username, password } = req.body
    // console.log("email: ", email)

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === "")
     ) {
            throw new ApiError(400, "All fields are required")
    }

    //User exists or not...
    const existedUser = await UserModel.findOne({
        $or: [{ username }, { email }]
    })

    if ( existedUser ) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //Get uploaded files...
    // const avatarLocalPath = req.files?.avatar?.[0]?.path
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    
    // if (!avatarLocalPath) {
    //     throw new ApiError(400, "Avatar file is required")
    // }

    // //upload on cloudinary...
    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null
    
    // if (!avatar) {
    //     throw new ApiError(400, "Avatar file is required")
    // }

    //create a user in MongoDB...
    const newUser = await UserModel.create({
        fullName,
        // avatar: avatar.url, 
        // coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase() 
    })

    //Get created User...
    const createdUser = await UserModel.findById(newUser._id).select(
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