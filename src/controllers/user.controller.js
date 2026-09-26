import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User as UserModel } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        
        const user = await UserModel.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "ok"
    // })

    const { fullName, email, username, password } = req.body
    // console.log("email: ", email)
    // console.log("req.body",req.body);

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
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    // console.log("req.files",req.files);
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //upload on cloudinary...
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null
    
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //create a user in MongoDB...
    const newUser = await UserModel.create({
        fullName,
        avatar: avatar.url, 
        coverImage: coverImage?.url || "",
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

const loginUser = asyncHandler( async(req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password } = req.body

    if (!username && !email) {
        throw new ApiError(400, "username or password is required")
    }

    const user = await UserModel.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await UserModel.findById(user._id).select("-password -refreshToken")


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler( async(req, res) => {
    await UserModel.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

     console.log(`✅ User logged out successfully:
        ${req.user.username}`);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(
        200,
        {},
        "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies
    .refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await UserModel.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or user")
        }
    
        const options = {
            httpsOnly:true,
            secure: true
        }
    
        const { accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken},
                "Access token refreshed"
                
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message ||
            "Invalid Refresh Token")
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }