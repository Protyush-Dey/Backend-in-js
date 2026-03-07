import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshtoken = async (UserId) => {
  try {
    const user = await User.findById(UserId);
    if (!user) {
      throw new ApiError(400, "something went wrong");
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "something went wrong when gensrating token"
    );
  }
};

// register
const register = asyncHandler(async (req, res) => {
  // get user Detail frontend
  const { userName, email, fullName, password } = req.body;
  // cheak validation - is empty
  if (
    [userName, email, fullName, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fieds are required");
  }
  // is exist validtaion
  const existuser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existuser) {
    throw new ApiError(409, "Username or email already exist");
  }
  const avatarLocalpath = await req.files?.avatar[0]?.path;
  const coverImageLocalpath = await req.files?.coverImage[0]?.path;
  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const coverImage = await uploadOnCloudinary(coverImageLocalpath);
  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }
  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while register");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "Register successfully"));
});

// login
const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;
  if (!(userName || email)) {
    throw new ApiError(401, "Give username or email");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) throw new ApiError(401, "User does not exist");
  const isVlidPass = await user.isPasswordCorrect(password);
  if (!isVlidPass) {
    throw new ApiError(400, "WrongPassword");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshtoken(
    user._id
  );
  const loginUserData = await User.findById(user._id);
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("RefreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loginUserData, accessToken, refreshToken },
        "Logeed in successfully"
      )
    );
});

// logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200, "Logeed out successfully"));
});

// refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.RefreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized access");
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);
    if (!user) throw new ApiError(401, "invalid Refresh token");
    if (user?.refreshToken !== incomingRefreshToken)
      throw new ApiError(401, "Refresh token is used or expired");
    const { accessToken, refreshToken } = await generateAccessAndRefreshtoken(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("AccessToken", accessToken, options)
      .cookie("RefreshToken", refreshToken, options)
      .json(new ApiResponse(200, "Accesstoken refreshed"));
  } catch (error) {
    throw new ApiError(401, error.message || "invalid Refresh token");
  }
});

//change password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPasswrd, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPasswrd);
  if (!isPasswordCorrect) throw new ApiError(400, "invaid old password");
  user.password = newPassword;
  user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

//get curent user

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "userdata successfully get"));
});

//update account details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, userName } = red.body;
  if (!fullName || !userName)
    throw new ApiError(400, "all feilds are required");
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName:fullName,
        userName:userName
      }
    },
    {new : true}
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, " update userdata successfully"));
});

// update Avatar 

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = red.file?.path;
  if (!avatarLocalPath)
    throw new ApiError(400, "Avatar file is missing");
  const avatar = uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url)
    throw new ApiError(400, "error when uploading Avatar in cloudinary");
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar
      }
    },
    {new : true}
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, " update avatar successfully"));
});


// update Cover image 

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = red.file?.path;
  if (!coverImageLocalPath)
    throw new ApiError(400, "CoverImage file is missing");
  const coverImage = uploadOnCloudinary(coverImageLocalPath)
  if (!coverImage.url)
    throw new ApiError(400, "error when uploading CoverImage");
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage
      }
    },
    {new : true}
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, " update coverImage successfully"));
});
export {
  register,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
};
